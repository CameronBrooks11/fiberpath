from __future__ import annotations

from pathlib import Path

from fiberpath.config import load_wind_definition
from fiberpath.planning import plan_wind
from fiberpath.visualization.plotter import (
    PlotConfig,
    compute_plot_signature,
    render_plot,
)
from fiberpath_cli.main import app
from typer.testing import CliRunner

FIXTURE = (
    Path(__file__).parents[1]
    / "cyclone_reference_runs"
    / "outputs"
    / "simple-hoop"
    / "output.gcode"
)

SIMPLE_CYLINDER_WIND = Path(__file__).parents[2] / "examples" / "simple_cylinder" / "input.wind"

REFERENCE_SIGNATURE_DIGEST = "bc2495ba15965b8b0e3a2616957741ef0801fc62a6a8284e30955635d2426af0"
SIMPLE_CYLINDER_SIGNATURE_DIGEST = (
    "f5516bc0b68cd25c8ab7014c05109c926f8183ad00ba1d25ee4b56835a73900f"
)


def _plan_simple_cylinder_commands() -> list[str]:
    definition = load_wind_definition(SIMPLE_CYLINDER_WIND)
    return plan_wind(definition).commands


def test_render_plot_produces_stable_geometry_signature() -> None:
    program = FIXTURE.read_text(encoding="utf-8").splitlines()
    signature = compute_plot_signature(program)
    assert signature.digest == REFERENCE_SIGNATURE_DIGEST
    assert signature.segments_rendered == 1821
    assert signature.metadata.mandrel_length_mm == 500.0
    assert signature.metadata.tow_width_mm == 8.0

    result = render_plot(program, PlotConfig(scale=0.5))
    assert result.image.size == (250, 180)
    assert result.segments_rendered == signature.segments_rendered


def test_plot_cli_writes_output(tmp_path: Path) -> None:
    runner = CliRunner()
    destination = tmp_path / "preview.png"
    result = runner.invoke(
        app,
        ["plot", str(FIXTURE), "--output", str(destination), "--scale", "0.5"],
    )
    assert result.exit_code == 0, result.output
    assert destination.exists()
    assert destination.stat().st_size > 0


def test_render_plot_handles_simple_cylinder_example() -> None:
    commands = _plan_simple_cylinder_commands()
    signature = compute_plot_signature(commands)
    assert signature.digest == SIMPLE_CYLINDER_SIGNATURE_DIGEST
    assert signature.segments_rendered > 0
    result = render_plot(commands, PlotConfig(scale=0.5))
    assert result.segments_rendered == signature.segments_rendered


def test_plot_cli_renders_simple_cylinder_example(tmp_path: Path) -> None:
    commands = _plan_simple_cylinder_commands()
    gcode_path = tmp_path / "simple-cylinder.gcode"
    gcode_path.write_text("\n".join(commands) + "\n", encoding="utf-8")
    destination = tmp_path / "simple-cylinder.png"
    runner = CliRunner()
    result = runner.invoke(
        app,
        ["plot", str(gcode_path), "--output", str(destination), "--scale", "0.5"],
    )
    assert result.exit_code == 0, result.output
    assert destination.exists()
    assert destination.stat().st_size > 0
