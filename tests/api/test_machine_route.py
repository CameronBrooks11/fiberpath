"""Tests for the machine-control surface.

No real hardware: ``SerialTransport`` is monkeypatched to build a
``marlin_host.FakeTransport`` driven by a scripted responder, so the real
``MarlinHost`` stack runs end to end. A ``threading.Event`` gate lets a test park
the streaming worker mid-program to exercise the pause/resume/cancel/409 paths
deterministically.
"""

from __future__ import annotations

import queue
import threading
import time
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from fiberpath_api.machine import machine
from fiberpath_api.main import create_app
from marlin_host import FakeTransport, PortInfo

PORT = "/dev/ttyFAKE"


class Responder:
    """Scripted device. ``gate`` is open by default; close it to park the worker."""

    def __init__(self) -> None:
        self.gate = threading.Event()
        self.gate.set()
        self.reached: queue.Queue[str] = queue.Queue()

    def __call__(self, line: str) -> list[str]:
        if "M115" in line:
            return [
                "FIRMWARE_NAME:Marlin 2.1.2 (FiberPath Fake)",
                "Cap:EMERGENCY_PARSER:1",
                "Cap:AUTOREPORT_TEMP:1",
                "ok",
            ]
        if "M110" in line:  # connect-time readiness probe
            return ["ok"]
        # A streamed line or manual command: announce arrival, then block on the
        # gate so a test can hold the worker between lines.
        self.reached.put(line)
        self.gate.wait(timeout=5.0)
        if "M114" in line:
            return ["X:0.00 Y:0.00 Z:0.00 E:0.00 Count A:0 B:0 C:0", "ok"]
        return ["ok"]


@pytest.fixture
def responder() -> Responder:
    return Responder()


@pytest.fixture
def client(responder: Responder, monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    def fake_serial(
        port: str, baud_rate: int = 250000, *, timeout: float = 2.0, reset_on_open: bool = True
    ) -> FakeTransport:
        return FakeTransport(responder=responder)

    monkeypatch.setattr("fiberpath_api.machine.SerialTransport", fake_serial)
    with TestClient(create_app()) as test_client:
        yield test_client
    # Reset the shared singleton between tests.
    responder.gate.set()
    machine.disconnect()
    machine._job = None
    machine._thread = None
    machine._job_counter = 0
    machine._state = "disconnected"


def _connect(client: TestClient) -> dict[str, object]:
    response = client.post(
        "/machine/connection",
        json={"port": PORT, "baud_rate": 250000, "timeout": 1.0},
    )
    assert response.status_code == 200, response.text
    return response.json()


def _wait_terminal(client: TestClient, job_id: str) -> dict[str, object]:
    """Poll until the job reaches a terminal state, asserting monotonic seq."""
    cursor = 0
    last: dict[str, object] = {}
    for _ in range(1000):
        last = client.get(f"/machine/jobs/{job_id}", params={"since": cursor}).json()
        for event in last["events"]:
            assert event["seq"] > cursor
            cursor = event["seq"]
        if last["state"] in ("completed", "cancelled", "error"):
            return last
        time.sleep(0.005)
    raise AssertionError(f"job did not terminate: {last}")


def test_list_ports(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        "fiberpath_api.machine.list_ports",
        lambda: [PortInfo(port=PORT, description="Fake board", hwid="USB:FAKE")],
    )
    response = client.get("/machine/ports")
    assert response.status_code == 200
    body = response.json()
    assert body == [{"port": PORT, "description": "Fake board", "hwid": "USB:FAKE"}]


def test_connect_returns_connection_info(client: TestClient) -> None:
    info = _connect(client)
    assert info["state"] == "connected"
    assert info["port"] == PORT
    assert info["baud_rate"] == 250000
    assert info["firmware"].startswith("FIRMWARE_NAME:")
    assert info["capabilities"]["EMERGENCY_PARSER"] is True


def test_connect_twice_conflicts(client: TestClient) -> None:
    _connect(client)
    response = client.post(
        "/machine/connection",
        json={"port": PORT, "baud_rate": 250000, "timeout": 1.0},
    )
    assert response.status_code == 409, response.text


def test_send_command(client: TestClient) -> None:
    _connect(client)
    response = client.post("/machine/commands", json={"gcode": "M114"})
    assert response.status_code == 200, response.text
    responses = response.json()["responses"]
    assert any("X:0.00" in line for line in responses)


def test_send_command_requires_connection(client: TestClient) -> None:
    response = client.post("/machine/commands", json={"gcode": "M114"})
    assert response.status_code == 400, response.text


def test_job_streams_to_completion(client: TestClient) -> None:
    _connect(client)
    start = client.post("/machine/jobs", json={"gcode": "G28\nG1 X10\n; comment\nG1 X20\n"})
    assert start.status_code == 200, start.text
    body = start.json()
    assert body["total"] == 3  # the ; comment line is not counted
    job_id = body["job_id"]

    final = _wait_terminal(client, job_id)
    assert final["state"] == "completed"
    assert final["sent"] == 3
    assert final["cursor"] >= 4  # 3 progress events + 1 complete
    # A final poll past the cursor yields nothing new.
    tail = client.get(f"/machine/jobs/{job_id}", params={"since": final["cursor"]}).json()
    assert tail["events"] == []
    assert tail["cursor"] == final["cursor"]


def test_unknown_job_is_404(client: TestClient) -> None:
    _connect(client)
    response = client.get("/machine/jobs/job-999")
    assert response.status_code == 404, response.text


def test_command_rejected_while_streaming(client: TestClient, responder: Responder) -> None:
    _connect(client)
    responder.gate.clear()
    start = client.post("/machine/jobs", json={"gcode": "G1 X1\nG1 X2\n"})
    job_id = start.json()["job_id"]
    responder.reached.get(timeout=2.0)  # worker has reached line 1 and is parked

    busy = client.post("/machine/commands", json={"gcode": "M114"})
    assert busy.status_code == 409, busy.text

    responder.gate.set()
    assert _wait_terminal(client, job_id)["state"] == "completed"


def test_pause_and_resume(client: TestClient, responder: Responder) -> None:
    _connect(client)
    responder.gate.clear()
    start = client.post("/machine/jobs", json={"gcode": "G1 X1\nG1 X2\nG1 X3\n"})
    job_id = start.json()["job_id"]
    responder.reached.get(timeout=2.0)

    paused = client.post(f"/machine/jobs/{job_id}/pause")
    assert paused.status_code == 200, paused.text
    assert paused.json()["state"] == "paused"

    responder.gate.set()
    resumed = client.post(f"/machine/jobs/{job_id}/resume")
    assert resumed.status_code == 200, resumed.text
    assert resumed.json()["state"] in ("streaming", "completed")

    assert _wait_terminal(client, job_id)["state"] == "completed"


def test_cancel(client: TestClient, responder: Responder) -> None:
    _connect(client)
    responder.gate.clear()
    start = client.post("/machine/jobs", json={"gcode": "G1 X1\nG1 X2\nG1 X3\n"})
    job_id = start.json()["job_id"]
    responder.reached.get(timeout=2.0)

    cancelled = client.post(f"/machine/jobs/{job_id}/cancel")
    assert cancelled.status_code == 200, cancelled.text
    assert cancelled.json()["state"] == "cancelled"

    responder.gate.set()
    assert _wait_terminal(client, job_id)["state"] == "cancelled"


def test_estop_returns_204(client: TestClient) -> None:
    _connect(client)
    response = client.post("/machine/estop")
    assert response.status_code == 204
    assert response.content == b""


def test_disconnect_returns_204(client: TestClient) -> None:
    _connect(client)
    response = client.delete("/machine/connection")
    assert response.status_code == 204
