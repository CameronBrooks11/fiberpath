from __future__ import annotations

from pathlib import Path

from fastapi.testclient import TestClient
from fiberpath_api.main import create_app

ROOT = Path(__file__).resolve().parents[2]
EXAMPLES = ROOT / "examples"


def test_plan_route_returns_summary(tmp_path: Path) -> None:
    wind_src = EXAMPLES / "simple_cylinder" / "input.wind"
    wind_copy = tmp_path / "input.wind"
    wind_copy.write_text(wind_src.read_text(encoding="utf-8"), encoding="utf-8")

    client = TestClient(create_app())
    import os

    os.environ["FIBERPATH_API_ALLOWED_ROOTS"] = str(tmp_path)
    response = client.post("/plan/from-file", json={"path": "input.wind"})

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["output"].endswith(".gcode")
    assert payload["commands"] > 0
    assert payload["layers"]


def test_simulate_and_validate_routes(tmp_path: Path) -> None:
    gcode_file = tmp_path / "program.gcode"
    gcode_file.write_text(
        "\n".join(
            [
                (
                    '; Parameters {"mandrel":{"diameter":50,"windLength":500},'
                    '"tow":{"width":8,"thickness":0.4}}'
                ),
                "G0 F6000",
                "G0 X10",
                "G0 A180",
                "G0 X10 A360",
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    client = TestClient(create_app())
    import os

    os.environ["FIBERPATH_API_ALLOWED_ROOTS"] = str(tmp_path)

    simulate_response = client.post("/simulate/from-file", json={"path": "program.gcode"})
    assert simulate_response.status_code == 200, simulate_response.text
    simulate_payload = simulate_response.json()
    assert simulate_payload["commands"] == 5
    assert simulate_payload["moves"] == 3

    wind_src = EXAMPLES / "simple_cylinder" / "input.wind"
    wind_copy = tmp_path / "input.wind"
    wind_copy.write_text(wind_src.read_text(encoding="utf-8"), encoding="utf-8")

    validate_response = client.post("/validate/from-file", json={"path": "input.wind"})
    assert validate_response.status_code == 200, validate_response.text
    assert validate_response.json()["status"] == "ok"


def test_plan_route_rejects_absolute_path(tmp_path: Path) -> None:
    """Absolute paths are rejected with 400 regardless of root membership."""
    import os

    client = TestClient(create_app())
    os.environ["FIBERPATH_API_ALLOWED_ROOTS"] = str(tmp_path)

    # Pass an absolute path (even one inside the root) – must be rejected.
    absolute_path = str(tmp_path / "input.wind")
    response = client.post("/plan/from-file", json={"path": absolute_path})

    assert response.status_code == 400
    assert "absolute" in response.json()["detail"].lower()


def test_plan_route_rejects_traversal_path(tmp_path: Path) -> None:
    """Paths containing ``..`` are rejected with 400."""
    import os

    client = TestClient(create_app())
    os.environ["FIBERPATH_API_ALLOWED_ROOTS"] = str(tmp_path)

    response = client.post("/plan/from-file", json={"path": "../outside/secret.wind"})

    assert response.status_code == 400
    assert "traversal" in response.json()["detail"].lower()
