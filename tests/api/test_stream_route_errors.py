"""Tests for stream API route error conditions."""

from __future__ import annotations

from fastapi.testclient import TestClient
from fiberpath_api.main import create_app


def test_stream_route_requires_port_when_not_dry_run() -> None:
    """Verify that streaming without dry_run requires a port."""
    app = create_app()
    client = TestClient(app)

    response = client.post(
        "/stream/",
        json={
            "gcode": "G0 X10",
            "dry_run": False,
            "port": None,  # Missing port
        },
    )

    assert response.status_code == 400
    assert "port is required" in response.json()["detail"]


def test_stream_route_dry_run_no_port_needed() -> None:
    """Verify that dry_run mode doesn't require a port."""
    app = create_app()
    client = TestClient(app)

    response = client.post(
        "/stream/",
        json={
            "gcode": "G0 X10\nG0 Y20",
            "dry_run": True,
            # port intentionally omitted
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["dry_run"] is True
    assert data["commands_streamed"] == 2
