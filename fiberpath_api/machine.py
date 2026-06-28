"""Serial machine-control surface for the FiberPath sidecar.

The sidecar owns the serial port. A single :class:`MachineService` singleton
holds all serial state: the connection, an optional background streaming job, and
the manual-command path. A background thread streams G-code to the board while
progress is recorded into a monotonic event log that the routes poll (the Marlin
protocol is send-line -> ``ok``, so there is nothing to push).

Concurrency model:

* ``_lock`` (an :class:`threading.RLock`) serialises state mutations and guards
  the event log. The worker thread acquires it only to record progress/results.
* ``pause`` / ``resume`` / ``cancel`` set host-side flags on :class:`MarlinHost`
  and are safe to call from the request thread while the worker streams.
* Manual ``send_command`` takes the lock and is rejected while a job is actively
  streaming (not paused), so two threads never drive the transport at once.
* ``emergency_stop`` is the safety path (issue #196): it writes M112 out-of-band
  via :meth:`MarlinHost.emergency_stop` and never waits on the lock.
"""

from __future__ import annotations

import json
import os
import tempfile
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path

from marlin_host import (
    HaltError,
    HostError,
    MarlinHost,
    MarlinResponse,
    PortInfo,
    ProtocolError,
    SerialTransport,
    StreamProgress,
    list_ports,
)

__all__ = [
    "MachineService",
    "MachineError",
    "MachineBusyError",
    "MachineNotFoundError",
    "MachineConflictError",
    "machine",
]

# Job states that mean a job still owns the serial port.
_ACTIVE_JOB_STATES = ("streaming", "paused")
# How often (seconds) to refresh the on-disk recovery snapshot while streaming.
_PERSIST_THROTTLE_S = 1.0


def _default_state_path() -> Path:
    """Runtime path for the active-job recovery snapshot.

    Lives in the temp dir on purpose: it is per-machine runtime state, and a
    reboot (which clears it) also powers down the controller, so there is
    nothing to recover after one.
    """
    return Path(tempfile.gettempdir()) / "fiberpath-api" / "machine-job.json"


def _job_number(job_id: str) -> int:
    """Parse the counter out of a ``job-N`` id (0 if it doesn't match)."""
    try:
        return int(job_id.rsplit("-", 1)[-1])
    except ValueError:
        return 0


class MachineError(RuntimeError):
    """Base error for machine-control failures (maps to HTTP 400)."""


class MachineBusyError(MachineError):
    """A manual command was rejected because a job is actively streaming (HTTP 409)."""


class MachineNotFoundError(MachineError):
    """The requested job id is unknown (HTTP 404)."""


class MachineConflictError(MachineError):
    """The request conflicts with current state, e.g. already connected (HTTP 409)."""


@dataclass
class JobEvent:
    """One entry in a job's monotonic event log."""

    seq: int
    type: str  # "progress" | "action" | "error" | "complete"
    sent: int | None = None
    total: int | None = None
    command: str | None = None
    action: str | None = None
    message: str | None = None


@dataclass
class Job:
    """A single streaming job. Only one exists at a time."""

    id: str
    total: int
    sent: int = 0
    state: str = "streaming"  # streaming|paused|completed|cancelled|error|orphaned
    error: str | None = None
    events: list[JobEvent] = field(default_factory=list)
    # seq is 1-based so the default poll cursor (since=0) returns every event.
    _next_seq: int = 1

    def append(self, type: str, **fields: object) -> JobEvent:
        event = JobEvent(seq=self._next_seq, type=type, **fields)  # type: ignore[arg-type]
        self._next_seq += 1
        self.events.append(event)
        return event

    @property
    def cursor(self) -> int:
        """The highest seq emitted so far (0 before any event)."""
        return self._next_seq - 1


class MachineService:
    """Owns the serial port and the background streaming job."""

    def __init__(self, state_path: Path | None = None) -> None:
        self._lock = threading.RLock()
        self._host: MarlinHost | None = None
        self._port: str | None = None
        self._baud_rate: int | None = None
        self._state = "disconnected"
        self._job: Job | None = None
        self._thread: threading.Thread | None = None
        self._job_counter = 0
        self._state_path = state_path if state_path is not None else _default_state_path()
        self._last_persist = 0.0
        self._recover_orphaned()

    # -- introspection -----------------------------------------------------

    @property
    def state(self) -> str:
        return self._state

    def list_serial_ports(self) -> list[PortInfo]:
        ports: list[PortInfo] = list_ports()
        return ports

    # -- connection lifecycle ---------------------------------------------

    def connect(self, port: str, baud_rate: int, timeout: float) -> dict[str, object]:
        with self._lock:
            if self._host is not None and self._host.is_connected:
                raise MachineConflictError("already connected; disconnect first")
            transport = SerialTransport(port, baud_rate, timeout=timeout)
            host = MarlinHost(
                transport,
                reliable=True,
                idle_timeout=timeout,
                on_action=self._record_action,
            )
            host.connect()
            self._host = host
            self._port = port
            self._baud_rate = baud_rate
            self._state = "connected"
            profile = host.profile
            firmware = profile.firmware if profile is not None else ""
            capabilities = dict(profile.caps) if profile is not None else {}
            return {
                "state": self._state,
                "port": port,
                "baud_rate": baud_rate,
                "firmware": firmware,
                "capabilities": capabilities,
            }

    def disconnect(self) -> None:
        # Stop any active job outside the lock (the worker needs the lock to
        # record its terminal event), then close the port.
        self._cancel_active_worker()
        with self._lock:
            if self._host is not None:
                self._host.close()
            self._host = None
            self._port = None
            self._baud_rate = None
            self._state = "disconnected"
            self._clear_persisted()

    def _cancel_active_worker(self) -> None:
        """Signal the worker to stop and wait for it to finish (lock-free join)."""
        thread = self._thread
        with self._lock:
            host = self._host
            job = self._job
            active = job is not None and job.state in _ACTIVE_JOB_STATES
            if active and host is not None:
                host.resume()  # unblock a paused stream so stop() takes effect
                host.stop()
                if job is not None:
                    job.state = "cancelled"
        if thread is not None and thread.is_alive():
            thread.join(timeout=10.0)

    # -- manual commands ---------------------------------------------------

    def send_command(self, gcode: str) -> list[str]:
        with self._lock:
            host = self._require_host()
            if self._job is not None and self._job.state == "streaming":
                raise MachineBusyError("a job is streaming; pause it before sending commands")
            result = host.query(gcode)
            return [str(r.raw) for r in result]

    # -- jobs --------------------------------------------------------------

    def start_job(self, gcode: str) -> dict[str, object]:
        with self._lock:
            host = self._require_host()
            if self._job is not None and self._job.state in _ACTIVE_JOB_STATES:
                raise MachineConflictError("a job is already active")
            commands = self._compile(gcode)
            self._job_counter += 1
            job = Job(id=f"job-{self._job_counter}", total=len(commands))
            self._job = job
            self._state = "streaming"
            self._last_persist = time.monotonic()
            self._persist_job()
            thread = threading.Thread(
                target=self._run_job,
                args=(host, job, commands),
                name=f"machine-{job.id}",
                daemon=True,
            )
            self._thread = thread
            thread.start()
            return {"job_id": job.id, "total": job.total}

    @staticmethod
    def _compile(gcode: str) -> list[str]:
        """Filter to streamable lines, matching MarlinHost.stream's own filter."""
        lines = [stripped for line in gcode.splitlines() if (stripped := line.strip())]
        return [line for line in lines if not line.startswith(";")]

    def _run_job(self, host: MarlinHost, job: Job, commands: list[str]) -> None:
        try:
            for progress in host.stream(commands):
                self._on_progress(progress)
        except (HostError, HaltError, ProtocolError) as exc:
            with self._lock:
                job.error = str(exc)
                job.state = "error"
                job.append("error", message=str(exc))
                self._state = "error"
                self._clear_persisted()
        else:
            with self._lock:
                if job.state not in ("cancelled", "error"):
                    job.state = "completed"
                    job.append("complete")
                if self._state != "error":
                    self._state = "connected"
                self._clear_persisted()

    def _on_progress(self, progress: StreamProgress) -> None:
        with self._lock:
            if self._job is not None:
                self._job.sent = progress.commands_sent
                self._job.append(
                    "progress",
                    sent=progress.commands_sent,
                    total=progress.total_commands,
                    command=progress.command,
                )
                # Refresh the recovery snapshot's progress, throttled to keep a
                # long job from rewriting the file on every line.
                now = time.monotonic()
                if now - self._last_persist >= _PERSIST_THROTTLE_S:
                    self._last_persist = now
                    self._persist_job()

    def _record_action(self, response: MarlinResponse) -> None:
        with self._lock:
            if self._job is not None:
                self._job.append("action", action=response.action or response.raw)

    def get_job(self, job_id: str, since: int = 0) -> dict[str, object]:
        with self._lock:
            job = self._lookup(job_id)
            events = [
                {
                    "seq": e.seq,
                    "type": e.type,
                    "sent": e.sent,
                    "total": e.total,
                    "command": e.command,
                    "action": e.action,
                    "message": e.message,
                }
                for e in job.events
                if e.seq > since
            ]
            return {
                "id": job.id,
                "state": job.state,
                "sent": job.sent,
                "total": job.total,
                "error": job.error,
                "cursor": job.cursor,
                "events": events,
            }

    def pause_job(self, job_id: str) -> dict[str, object]:
        with self._lock:
            job = self._lookup(job_id)
            host = self._require_host()
            host.pause()
            if job.state == "streaming":
                job.state = "paused"
            self._state = "paused"
            self._persist_job()
        return self.get_job(job_id)

    def resume_job(self, job_id: str) -> dict[str, object]:
        with self._lock:
            job = self._lookup(job_id)
            host = self._require_host()
            host.resume()
            if job.state == "paused":
                job.state = "streaming"
            self._state = "streaming"
            self._persist_job()
        return self.get_job(job_id)

    def cancel_job(self, job_id: str) -> dict[str, object]:
        with self._lock:
            job = self._lookup(job_id)
            host = self._require_host()
            host.resume()  # unblock a paused stream so stop() ends it
            host.stop()
            if job.state in _ACTIVE_JOB_STATES:
                job.state = "cancelled"
            self._clear_persisted()
            # Stay connected; the worker returns from stream() and settles state.
        return self.get_job(job_id)

    # -- safety ------------------------------------------------------------

    def emergency_stop(self) -> None:
        # Issue #196: must NOT wait on the lock. Write M112 out-of-band directly;
        # this sets host.is_halted so the worker's next streamed send raises
        # HaltError and records the terminal error event itself.
        host = self._host
        if host is None:
            raise MachineError("not connected")
        host.emergency_stop()
        self._state = "error"

    # -- helpers -----------------------------------------------------------

    def _require_host(self) -> MarlinHost:
        if self._host is None or not self._host.is_connected:
            raise MachineError("not connected")
        return self._host

    def _lookup(self, job_id: str) -> Job:
        if self._job is None or self._job.id != job_id:
            raise MachineNotFoundError(f"unknown job: {job_id}")
        return self._job

    # -- crash recovery ----------------------------------------------------

    def _persist_job(self) -> None:
        """Write a recovery snapshot of the active job (call under ``_lock``).

        Best-effort: a snapshot write must never break a live stream, so all
        I/O errors are swallowed. The file exists only while a job is active.
        """
        job = self._job
        if job is None:
            return
        snapshot = {
            "id": job.id,
            "port": self._port,
            "baud_rate": self._baud_rate,
            "total": job.total,
            "sent": job.sent,
            "state": job.state,
        }
        try:
            path = self._state_path
            path.parent.mkdir(parents=True, exist_ok=True)
            tmp = path.with_suffix(".tmp")
            tmp.write_text(json.dumps(snapshot))
            os.replace(tmp, path)  # atomic swap so a reader never sees a half file
        except OSError:
            pass

    def _clear_persisted(self) -> None:
        """Drop the recovery snapshot (call under ``_lock``)."""
        self._last_persist = 0.0
        try:
            self._state_path.unlink(missing_ok=True)
        except OSError:
            pass

    def _recover_orphaned(self) -> None:
        """Surface a job a previous (crashed) sidecar left mid-stream.

        The snapshot file is deleted on every clean terminal transition and on
        disconnect, so finding one with an active state at startup means a prior
        process died mid-job. Reconstruct it as an ``orphaned`` tombstone — so a
        re-attaching client polling that job id gets ``orphaned`` instead of a
        404 — but do **not** reopen the port: a blind re-open would DTR-reset a
        controller that may still be moving. Recovery is an explicit reconnect.
        """
        try:
            raw = self._state_path.read_text()
        except OSError:
            return
        try:
            snap = json.loads(raw)
        except ValueError:
            self._clear_persisted()
            return
        if not isinstance(snap, dict) or snap.get("state") not in _ACTIVE_JOB_STATES:
            self._clear_persisted()
            return
        job = Job(
            id=str(snap.get("id", "job-0")),
            total=int(snap.get("total") or 0),
            sent=int(snap.get("sent") or 0),
            state="orphaned",
        )
        port = snap.get("port")
        job.error = "The streaming backend restarted mid-job; the controller was reset. " + (
            f"Reconnect to {port} to continue." if port else "Reconnect to continue."
        )
        job.append("error", message=job.error)
        self._job = job
        # Keep the counter ahead of the recovered id so the next job won't reuse it.
        self._job_counter = _job_number(job.id)
        self._clear_persisted()  # consumed into memory


machine = MachineService()
