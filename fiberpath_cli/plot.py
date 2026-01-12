"""CLI plot command for PNG previews."""

from __future__ import annotations

from pathlib import Path

import typer
from fiberpath.visualization.plotter import PlotConfig, PlotError, render_plot
from rich.console import Console

console = Console()

GCODE_ARGUMENT = typer.Argument(..., exists=True, readable=True, help="Input G-code file")
OUTPUT_OPTION = typer.Option(Path("plot.png"), "--output", "-o", help="PNG destination")
SCALE_OPTION = typer.Option(
    1.0, "--scale", help="Pixels per millimeter along carriage axis", min=0.1, max=5.0
)


def plot_command(
    gcode_file: Path = GCODE_ARGUMENT,
    output: Path = OUTPUT_OPTION,
    scale: float = SCALE_OPTION,
) -> None:
    program = gcode_file.read_text(encoding="utf-8").splitlines()
    try:
        result = render_plot(program, PlotConfig(scale=scale))
    except PlotError as exc:  # pragma: no cover - parameter validation
        raise typer.BadParameter(str(exc)) from exc

    output.parent.mkdir(parents=True, exist_ok=True)
    result.image.save(output, format="PNG")
    console.print(
        "[green]Rendered[/green] preview to",
        output,
        f"({result.metadata.mandrel_length_mm:.1f} mm × {result.metadata.tow_width_mm:.1f} mm tow)",
    )
