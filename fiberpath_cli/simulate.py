"""CLI simulate command."""

from __future__ import annotations

from dataclasses import asdict
from pathlib import Path

import typer
from fiberpath.simulation import SimulationError, simulate_program

from .output import echo_json

GCODE_ARGUMENT = typer.Argument(..., exists=True, readable=True)
JSON_OPTION = typer.Option(False, "--json", help="Emit machine-readable JSON summary")


def simulate_command(gcode_file: Path = GCODE_ARGUMENT, json_output: bool = JSON_OPTION) -> None:
    commands = Path(gcode_file).read_text(encoding="utf-8").splitlines()
    try:
        result = simulate_program(commands)
    except SimulationError as exc:
        typer.echo(f"Simulation failed: {exc}", err=True)
        raise typer.Exit(code=1) from exc

    if json_output:
        echo_json(asdict(result))
        return

    typer.echo(
        "Simulated "
        f"{result.commands_executed} commands / {result.moves} moves in "
        f"{result.estimated_time_s:.2f}s\n"
        f"  distance: {result.total_distance_mm:.1f} mm"
        f"  tow: {result.tow_length_mm / 1000.0:.3f} m"
        f"  avg feed: {result.average_feed_rate_mmpm:.0f} mm/min"
    )
