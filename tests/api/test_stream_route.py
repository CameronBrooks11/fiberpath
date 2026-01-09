from __future__ import annotations

from fastapi.testclient import TestClient
from fiberpath_api.main import create_app


def test_stream_route_supports_dry_run() -> None:
    app = create_app()
    client = TestClient(app)

    response = client.post(
        "/stream/",
        json={
            "gcode": "; header\nG0 X10\nG0 Y20",
            "dry_run": True,
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["commands_streamed"] == 2
    assert payload["total_commands"] == 2
    assert payload["dry_run"] is True
