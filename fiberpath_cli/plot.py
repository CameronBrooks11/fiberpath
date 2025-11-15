"""CLI plot command placeholder."""

from __future__ import annotations

from pathlib import Path

import typer

GCODE_ARGUMENT = typer.Argument(..., exists=True, readable=True)
OUTPUT_OPTION = typer.Option(Path("plot.json"), "--output", "-o")


def plot_command(
    gcode_file: Path = GCODE_ARGUMENT,
    output: Path = OUTPUT_OPTION,
) -> None:
    raise typer.BadParameter(
        "Plotting is not yet implemented in the Python port. Use cyclone_reference for now."
    )
