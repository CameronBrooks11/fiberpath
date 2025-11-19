from __future__ import annotations

import json
from pathlib import Path

from fiberpath_cli.main import app
from typer.testing import CliRunner

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT.parent / "examples"
SIMPLE_WIND = EXAMPLES / "simple_cylinder" / "input.wind"

SIM_HEADER = (
    '; Parameters {"mandrel":{"diameter":50,"windLength":500},"tow":{"width":8,"thickness":0.4}}'
)
SIM_PROGRAM = [SIM_HEADER, "G0 F6000", "G0 X10", "G0 Y180", "G0 X10 Y360"]


def test_plan_command_json(tmp_path: Path) -> None:
    runner = CliRunner()
    output_file = tmp_path / "out.gcode"

    result = runner.invoke(
        app,
        ["plan", str(SIMPLE_WIND), "--output", str(output_file), "--json"],
    )

    assert result.exit_code == 0, result.output
    payload = json.loads(result.stdout)
    assert payload["output"] == str(output_file)
    assert payload["commands"] > 0


def test_simulate_command_json(tmp_path: Path) -> None:
    gcode_file = tmp_path / "program.gcode"
    gcode_file.write_text("\n".join(SIM_PROGRAM) + "\n", encoding="utf-8")

    runner = CliRunner()
    result = runner.invoke(app, ["simulate", str(gcode_file), "--json"])

    assert result.exit_code == 0, result.output
    payload = json.loads(result.stdout)
    assert payload["commands_executed"] == 5


def test_validate_command_json() -> None:
    runner = CliRunner()
    result = runner.invoke(app, ["validate", str(SIMPLE_WIND), "--json"])

    assert result.exit_code == 0, result.output
    payload = json.loads(result.stdout)
    assert payload["status"] == "ok"


def test_stream_command_json(tmp_path: Path) -> None:
    gcode_file = tmp_path / "program.gcode"
    gcode_file.write_text("\n".join(SIM_PROGRAM) + "\n", encoding="utf-8")

    runner = CliRunner()
    result = runner.invoke(
        app,
        ["stream", str(gcode_file), "--dry-run", "--json"],
    )

    assert result.exit_code == 0, result.output
    payload = json.loads(result.stdout)
    assert payload["dryRun"] is True
    assert payload["commands"] > 0
