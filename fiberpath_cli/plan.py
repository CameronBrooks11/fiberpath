"""CLI plan command."""

from __future__ import annotations

from dataclasses import asdict
from pathlib import Path

import typer
from rich.console import Console
from rich.table import Table

from fiberpath.config import WindFileError, load_wind_definition
from fiberpath.gcode import write_gcode
from fiberpath.gcode.dialects import MARLIN_XAB_STANDARD, MARLIN_XYZ_LEGACY
from fiberpath.planning import PlanOptions, plan_wind

from .output import echo_json

console = Console()

WIND_FILE_ARGUMENT = typer.Argument(
    ..., exists=True, readable=True, help="Input .wind file"
)
OUTPUT_OPTION = typer.Option(
    Path("output.gcode"), "--output", "-o", help="Destination for generated G-code"
)
VERBOSE_OPTION = typer.Option(
    False, "--verbose", "-v", help="Emit verbose planner output"
)
JSON_OPTION = typer.Option(
    False,
    "--json",
    help="Emit machine-readable JSON instead of human-readable text.",
)
AXIS_FORMAT_OPTION = typer.Option(
    "xab",
    "--axis-format",
    help="Axis coordinate format: xyz (legacy) or xab (standard rotational)",
)


def plan_command(
    wind_file: Path = WIND_FILE_ARGUMENT,
    output: Path = OUTPUT_OPTION,
    verbose: bool = VERBOSE_OPTION,
    json_output: bool = JSON_OPTION,
    axis_format: str = AXIS_FORMAT_OPTION,
) -> None:
    # Validate axis format
    if axis_format not in {"xyz", "xab"}:
        typer.echo(
            f"Invalid axis format: {axis_format}. Must be 'xyz' or 'xab'.", err=True
        )
        raise typer.Exit(code=1)

    # Select dialect based on axis format
    dialect = MARLIN_XAB_STANDARD if axis_format == "xab" else MARLIN_XYZ_LEGACY

    try:
        wind_definition = load_wind_definition(wind_file)
    except WindFileError as exc:  # pragma: no cover - CLI glue
        raise typer.BadParameter(str(exc)) from exc

    try:
        result = plan_wind(
            wind_definition, PlanOptions(verbose=verbose, dialect=dialect)
        )
    except Exception as exc:  # pragma: no cover - defensive guard
        typer.echo(f"Planning failed: {exc}", err=True)
        raise typer.Exit(code=1) from exc

    destination = write_gcode(result.commands, output)

    summary = {
        "output": str(destination),
        "commands": len(result.commands),
        "timeSeconds": result.total_time_s,
        "towMeters": result.total_tow_m,
        "axisFormat": axis_format,
        "layers": [asdict(metric) for metric in result.layers],
    }

    if json_output:
        echo_json(summary)
        return

    console.print(
        f"[green]Wrote[/green] {summary['commands']} commands to {destination}"
    )
    console.print(f"[dim]Axis format: {axis_format.upper()}[/dim]")

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
