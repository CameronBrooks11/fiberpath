from __future__ import annotations

from pathlib import Path

import pytest
from fiberpath.config import load_wind_definition
from fiberpath.gcode import ProgramReadError, read_program
from fiberpath.planning import plan_wind
from fiberpath.simulation import SimulationError, simulate_program
from fiberpath_cli.main import app
from typer.testing import CliRunner

REPO_ROOT = Path(__file__).resolve().parents[2]
# A multi-layer wind exercises the `zero_axes` G92 resets between layers, so this
# is where the old G92-blind simulator diverged from the planner.
MULTI_LAYER_WIND = REPO_ROOT / "examples" / "multi_layer" / "input.wind"

HEADER = (
    '; Parameters {"mandrel":{"diameter":50,"windLength":500},"tow":{"width":8,"thickness":0.4}}'
)
PROGRAM = [
    HEADER,
    "G0 F6000",
    "G0 X10",
    "G0 A180",
    "G0 X10 A360",
]


def test_simulate_program_produces_time_and_tow_metrics() -> None:
    result = simulate_program(read_program(PROGRAM))
    assert result.commands_executed == len(PROGRAM)
    assert result.moves == 3
    assert pytest.approx(result.estimated_time_s, rel=1e-3) == 1.6708
    assert pytest.approx(result.total_distance_mm, rel=1e-3) == 167.0796
    assert pytest.approx(result.tow_length_mm, rel=1e-3) == 167.0796


def test_simulate_program_requires_header() -> None:
    with pytest.raises(ProgramReadError):
        read_program(["G0 X1"])


def test_simulate_program_rejects_empty_program() -> None:
    empty = read_program([HEADER])
    with pytest.raises(SimulationError):
        simulate_program(empty)


def test_planner_and_simulator_time_agree_by_construction() -> None:
    # Both now derive time/tow from the single O1 nominal_metrics, so the planner's
    # total and a fresh simulation of its own G-code agree by construction. The only
    # residual is G-code numeric rounding: the planner reports full-precision floats
    # while the simulator reads back the precision-stripped emitted program.
    plan = plan_wind(load_wind_definition(MULTI_LAYER_WIND))
    sim = simulate_program(read_program(plan.commands))

    assert sim.estimated_time_s == pytest.approx(plan.total_time_s, rel=1e-7)
    assert sim.tow_length_mm / 1000.0 == pytest.approx(plan.total_tow_m, rel=1e-7)


def test_simulate_cli_outputs_summary(tmp_path: Path) -> None:
    gcode_file = tmp_path / "test.gcode"
    gcode_file.write_text("\n".join(PROGRAM) + "\n", encoding="utf-8")

    runner = CliRunner()
    result = runner.invoke(app, ["simulate", str(gcode_file)])

    assert result.exit_code == 0, result.output
    assert "Simulated" in result.output
    assert "1.67" in result.output
