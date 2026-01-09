from __future__ import annotations

from pathlib import Path

import pytest
from typer.testing import CliRunner

from fiberpath.simulation import SimulationError, simulate_program
from fiberpath_cli.main import app

HEADER = '; Parameters {"mandrel":{"diameter":50,"windLength":500},"tow":{"width":8,"thickness":0.4}}'
PROGRAM = [
    HEADER,
    "G0 F6000",
    "G0 X10",
    "G0 Y180",
    "G0 X10 Y360",
]


def test_simulate_program_produces_time_and_tow_metrics() -> None:
    result = simulate_program(PROGRAM)
    assert result.commands_executed == len(PROGRAM)
    assert result.moves == 3
    assert pytest.approx(result.estimated_time_s, rel=1e-3) == 1.6708
    assert pytest.approx(result.total_distance_mm, rel=1e-3) == 167.0796
    assert pytest.approx(result.tow_length_mm, rel=1e-3) == 167.0796


def test_simulate_program_requires_header() -> None:
    with pytest.raises(SimulationError):
        simulate_program(["G0 X1"])


def test_simulate_cli_outputs_summary(tmp_path: Path) -> None:
    gcode_file = tmp_path / "test.gcode"
    gcode_file.write_text("\n".join(PROGRAM) + "\n", encoding="utf-8")

    runner = CliRunner()
    result = runner.invoke(app, ["simulate", str(gcode_file)])

    assert result.exit_code == 0, result.output
    assert "Simulated" in result.output
    assert "1.67" in result.output
