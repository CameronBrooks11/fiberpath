from __future__ import annotations

from hashlib import sha256
from io import BytesIO
from pathlib import Path

from typer.testing import CliRunner

from fiberpath.visualization.plotter import PlotConfig, render_plot
from fiberpath_cli.main import app

FIXTURE = (
    Path(__file__).parents[1]
    / "cyclone_reference_runs"
    / "outputs"
    / "simple-hoop"
    / "output.gcode"
)


def test_render_plot_produces_stable_png_hash():
    program = FIXTURE.read_text(encoding="utf-8").splitlines()
    result = render_plot(program, PlotConfig(scale=0.5))
    buffer = BytesIO()
    result.image.save(buffer, format="PNG")
    digest = sha256(buffer.getvalue()).hexdigest()
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
