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
    response = client.post("/plan/from-file", json={"path": str(wind_copy)})

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
                "G0 Y180",
                "G0 X10 Y360",
            ]
        )
        + "\n",
        encoding="utf-8",
    )

    client = TestClient(create_app())

    simulate_response = client.post(
        "/simulate/from-file", json={"path": str(gcode_file)}
    )
    assert simulate_response.status_code == 200, simulate_response.text
    simulate_payload = simulate_response.json()
    assert simulate_payload["commands"] == 5
    assert simulate_payload["moves"] == 3

    wind_src = EXAMPLES / "simple_cylinder" / "input.wind"
    wind_copy = tmp_path / "input.wind"
    wind_copy.write_text(wind_src.read_text(encoding="utf-8"), encoding="utf-8")

    validate_response = client.post(
        "/validate/from-file", json={"path": str(wind_copy)}
    )
    assert validate_response.status_code == 200, validate_response.text
    assert validate_response.json()["status"] == "ok"
