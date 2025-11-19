"""CLI simulate command."""

from __future__ import annotations

from pathlib import Path

import typer
from fiberpath.simulation import simulate_program

GCODE_ARGUMENT = typer.Argument(..., exists=True, readable=True)


def simulate_command(gcode_file: Path = GCODE_ARGUMENT) -> None:
    commands = Path(gcode_file).read_text(encoding="utf-8").splitlines()
    result = simulate_program(commands)
    typer.echo(
        "Simulated "
        f"{result.commands_executed} commands / {result.moves} moves in "
        f"{result.estimated_time_s:.2f}s\n"
        f"  distance: {result.total_distance_mm:.1f} mm"
        f"  tow: {result.tow_length_mm / 1000.0:.3f} m"
        f"  avg feed: {result.average_feed_rate_mmpm:.0f} mm/min"
    )
