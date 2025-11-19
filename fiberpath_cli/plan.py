"""CLI plan command."""

from __future__ import annotations

from pathlib import Path

import typer
from fiberpath.config import WindFileError, load_wind_definition
from fiberpath.gcode import write_gcode
from fiberpath.planning import PlanOptions, plan_wind
from rich.console import Console
from rich.table import Table

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

    result = plan_wind(wind_definition, PlanOptions(verbose=verbose))
    destination = write_gcode(result.commands, output)
    console.print(f"[green]Wrote[/green] {len(result.commands)} commands to {destination}")

    if verbose:
        table = Table(title="Layer metrics", expand=False)
        table.add_column("#", justify="right")
        table.add_column("Type")
        table.add_column("Cmds", justify="right")
        table.add_column("Δt (s)", justify="right")
        table.add_column("Tow (m)", justify="right")
        for metric in result.layers:
            table.add_row(
                str(metric.index),
                metric.wind_type,
                str(metric.commands),
                f"{metric.time_s:.2f}",
                f"{metric.tow_m:.3f}",
            )
        console.print(table)
        console.print(
            f"[cyan]Totals[/cyan] time={result.total_time_s:.2f}s tow={result.total_tow_m:.3f}m"
        )
        console.print(wind_definition.model_dump(mode="json"))
