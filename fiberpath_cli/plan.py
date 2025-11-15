"""CLI plan command."""

from __future__ import annotations

from pathlib import Path

import typer
from fiberpath.config import WindFileError, load_wind_definition
from fiberpath.gcode import write_gcode
from fiberpath.planning import plan_wind
from rich.console import Console

console = Console()

WIND_FILE_ARGUMENT = typer.Argument(..., exists=True, readable=True, help="Input .wind file")
OUTPUT_OPTION = typer.Option(
    Path("output.gcode"), "--output", "-o", help="Destination for generated G-code"
)
VERBOSE_OPTION = typer.Option(False, "--verbose", "-v", help="Emit verbose planner output")


def plan_command(
    wind_file: Path = WIND_FILE_ARGUMENT,
    output: Path = OUTPUT_OPTION,
    verbose: bool = VERBOSE_OPTION,
) -> None:
    try:
        wind_definition = load_wind_definition(wind_file)
    except WindFileError as exc:  # pragma: no cover - CLI glue
        raise typer.BadParameter(str(exc)) from exc

    program = plan_wind(wind_definition)
    destination = write_gcode(program, output)
    console.print(f"[green]Wrote[/green] {len(program)} commands to {destination}")

    if verbose:
        console.print(wind_definition.model_dump(mode="json"))
