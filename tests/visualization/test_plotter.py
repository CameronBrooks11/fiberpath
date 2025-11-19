from __future__ import annotations

from hashlib import sha256
from io import BytesIO
from pathlib import Path

from typer.testing import CliRunner

from fiberpath.config import load_wind_definition
from fiberpath.planning import plan_wind
from fiberpath.visualization.plotter import PlotConfig, render_plot
from fiberpath_cli.main import app

FIXTURE = (
    Path(__file__).parents[1]
    / "cyclone_reference_runs"
    / "outputs"
    / "simple-hoop"
    / "output.gcode"
)

SIMPLE_CYLINDER_WIND = (
    Path(__file__).parents[2] / "examples" / "simple_cylinder" / "input.wind"
)


def _hash_image(result_image) -> str:
    buffer = BytesIO()
    result_image.save(buffer, format="PNG")
    return sha256(buffer.getvalue()).hexdigest()


def _plan_simple_cylinder_commands() -> list[str]:
    definition = load_wind_definition(SIMPLE_CYLINDER_WIND)
    return plan_wind(definition).commands


def test_render_plot_produces_stable_png_hash():
    program = FIXTURE.read_text(encoding="utf-8").splitlines()
    result = render_plot(program, PlotConfig(scale=0.5))
    digest = _hash_image(result.image)
    assert digest == "56759d86dfe900de4a3f9ccf98d77db1cdd26b9a89c0c8f289321571d44329bc"


def test_plot_cli_writes_output(tmp_path: Path):
    runner = CliRunner()
    destination = tmp_path / "preview.png"
    result = runner.invoke(
        app,
        ["plot", str(FIXTURE), "--output", str(destination), "--scale", "0.5"],
    )
    assert result.exit_code == 0, result.output
    assert destination.exists()
    assert destination.stat().st_size > 0


def test_render_plot_handles_simple_cylinder_example():
    commands = _plan_simple_cylinder_commands()
    result = render_plot(commands, PlotConfig(scale=0.5))
    digest = _hash_image(result.image)
    assert digest == "e2cfeb54d160e415f5f7a95c9ed575b8fc11168d031dd552671771ecbf4fbcee"


def test_plot_cli_renders_simple_cylinder_example(tmp_path: Path):
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
    digest = sha256(destination.read_bytes()).hexdigest()
    assert digest == "e2cfeb54d160e415f5f7a95c9ed575b8fc11168d031dd552671771ecbf4fbcee"
