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

import threading
from dataclasses import dataclass, field

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
    state: str = "streaming"  # streaming|paused|completed|cancelled|error
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

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._host: MarlinHost | None = None
        self._port: str | None = None
        self._baud_rate: int | None = None
        self._state = "disconnected"
        self._job: Job | None = None
        self._thread: threading.Thread | None = None
        self._job_counter = 0

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
        else:
            with self._lock:
                if job.state not in ("cancelled", "error"):
                    job.state = "completed"
                    job.append("complete")
                if self._state != "error":
                    self._state = "connected"

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
        return self.get_job(job_id)

    def resume_job(self, job_id: str) -> dict[str, object]:
        with self._lock:
            job = self._lookup(job_id)
            host = self._require_host()
            host.resume()
            if job.state == "paused":
                job.state = "streaming"
            self._state = "streaming"
        return self.get_job(job_id)

    def cancel_job(self, job_id: str) -> dict[str, object]:
        with self._lock:
            job = self._lookup(job_id)
            host = self._require_host()
            host.resume()  # unblock a paused stream so stop() ends it
            host.stop()
            if job.state in _ACTIVE_JOB_STATES:
                job.state = "cancelled"
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


machine = MachineService()
