"""Crash-recovery tests for the machine service's orphaned-job snapshot.

When the sidecar process dies mid-stream its in-memory job is lost and the OS
releases the serial port (DTR resets the controller). A freshly started service
must surface that job as ``orphaned`` to a re-attaching client instead of a 404.
These tests drive :class:`MachineService` directly with an isolated
``state_path`` so nothing touches the shared singleton or the real temp file.
"""

from __future__ import annotations

import json
import threading
from collections.abc import Iterator
from pathlib import Path

import pytest
from fiberpath_api.machine import MachineNotFoundError, MachineService
from marlin_host import FakeTransport


def _write_snapshot(path: Path, **fields: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(fields))


def test_no_snapshot_means_no_orphaned_job(tmp_path: Path) -> None:
    svc = MachineService(state_path=tmp_path / "job.json")
    assert svc.state == "disconnected"
    with pytest.raises(MachineNotFoundError):
        svc.get_job("job-1")


def test_active_snapshot_recovers_as_orphaned(tmp_path: Path) -> None:
    state_path = tmp_path / "job.json"
    _write_snapshot(
        state_path,
        id="job-7",
        port="/dev/ttyACM0",
        baud_rate=250000,
        total=100,
        sent=42,
        state="streaming",
    )

    svc = MachineService(state_path=state_path)

    status = svc.get_job("job-7")
    assert status["state"] == "orphaned"
    assert status["sent"] == 42
    assert status["total"] == 100
    assert "/dev/ttyACM0" in str(status["error"])
    # The snapshot is consumed into memory, not left to re-trigger.
    assert not state_path.exists()


def test_paused_snapshot_also_orphaned(tmp_path: Path) -> None:
    state_path = tmp_path / "job.json"
    _write_snapshot(state_path, id="job-1", port="COM3", total=5, sent=2, state="paused")
    svc = MachineService(state_path=state_path)
    assert svc.get_job("job-1")["state"] == "orphaned"


@pytest.mark.parametrize("terminal", ["completed", "cancelled", "error"])
def test_terminal_snapshot_is_ignored(tmp_path: Path, terminal: str) -> None:
    state_path = tmp_path / "job.json"
    _write_snapshot(state_path, id="job-1", total=5, sent=5, state=terminal)
    svc = MachineService(state_path=state_path)
    with pytest.raises(MachineNotFoundError):
        svc.get_job("job-1")
    assert not state_path.exists()


def test_corrupt_snapshot_is_ignored(tmp_path: Path) -> None:
    state_path = tmp_path / "job.json"
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text("{not valid json")
    svc = MachineService(state_path=state_path)
    with pytest.raises(MachineNotFoundError):
        svc.get_job("job-1")
    assert not state_path.exists()


def test_recovered_counter_avoids_id_reuse(tmp_path: Path) -> None:
    state_path = tmp_path / "job.json"
    _write_snapshot(state_path, id="job-5", total=3, sent=1, state="streaming")
    svc = MachineService(state_path=state_path)
    # Next started job must not reuse the orphaned id.
    assert svc._job_counter == 5


# --- persistence lifecycle (snapshot written while streaming, cleared after) ---


class _Responder:
    """Scripted device; ``gate`` parks the worker between streamed lines."""

    def __init__(self) -> None:
        self.gate = threading.Event()
        self.gate.set()
        self.reached = threading.Event()

    def __call__(self, line: str) -> list[str]:
        if "M115" in line:
            return ["FIRMWARE_NAME:Marlin 2.1.2 (Fake)", "Cap:EMERGENCY_PARSER:1", "ok"]
        if "M110" in line:
            return ["ok"]
        self.reached.set()
        self.gate.wait(timeout=5.0)
        return ["ok"]


@pytest.fixture
def svc(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Iterator[tuple[MachineService, Path]]:
    responder = _Responder()

    def fake_serial(port: str, baud_rate: int = 250000, *, timeout: float = 2.0) -> FakeTransport:
        return FakeTransport(responder=responder)

    monkeypatch.setattr("fiberpath_api.machine.SerialTransport", fake_serial)
    state_path = tmp_path / "job.json"
    service = MachineService(state_path=state_path)
    service._responder = responder  # type: ignore[attr-defined]  # test handle
    try:
        yield service, state_path
    finally:
        responder.gate.set()
        service.disconnect()


def test_snapshot_written_while_streaming_and_cleared_on_complete(
    svc: tuple[MachineService, Path],
) -> None:
    service, state_path = svc
    responder: _Responder = service._responder  # type: ignore[attr-defined]
    service.connect("/dev/ttyFAKE", 250000, 2.0)

    responder.gate.clear()  # park the worker on the first streamed line
    service.start_job("G1 X1\nG1 X2\nG1 X3")
    assert responder.reached.wait(timeout=5.0)

    # A job is active -> the recovery snapshot exists and marks it streaming.
    assert state_path.exists()
    snap = json.loads(state_path.read_text())
    assert snap["state"] == "streaming"

    responder.gate.set()  # let the job run to completion
    deadline = threading.Event()
    for _ in range(100):
        if service.get_job(service._job.id)["state"] == "completed":  # type: ignore[union-attr]
            break
        deadline.wait(0.05)

    assert service.get_job(service._job.id)["state"] == "completed"  # type: ignore[union-attr]
    # Clean completion clears the snapshot, so a later restart won't orphan it.
    assert not state_path.exists()
