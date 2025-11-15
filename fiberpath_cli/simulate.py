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
        f"Simulated {result.commands_executed} commands (est. {result.estimated_time_s:.1f}s)"
    )
