"""Tests for simulation API route."""

from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient
from fiberpath_api.main import create_app


def test_simulate_from_file_nonexistent(tmp_path: Path) -> None:
    """Verify that simulating a nonexistent file returns 404."""
    app = create_app()
    client = TestClient(app)

    nonexistent = tmp_path / "missing.gcode"

    response = client.post(
        "/simulate/from-file",
        json={"path": str(nonexistent)},
    )

    assert response.status_code == 404
    assert "No file found" in response.json()["detail"]


def test_simulate_from_file_success(tmp_path: Path) -> None:
    """Verify that simulating a valid G-code file returns metrics."""
    app = create_app()
    client = TestClient(app)

    gcode_file = tmp_path / "test.gcode"
    gcode_file.write_text(
        """; Parameters {"mandrel": {"diameter": 100.0}, "tow": {"width": 3.0}}
G21
G90
G92 X0 Y0 Z0
F1000
G1 X10 Y20 Z30
G1 X20 Y40 Z60
""",
        encoding="utf-8",
    )

    response = client.post(
        "/simulate/from-file",
        json={"path": str(gcode_file)},
    )

    assert response.status_code == 200
    data = response.json()

    # Should have 2 moves (G1 commands), positive time/distance
    assert data["moves"] == 2
    assert data["estimated_time_s"] > 0
    assert data["total_distance_mm"] > 0
