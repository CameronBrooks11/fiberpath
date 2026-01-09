"""CLI validate command."""

from __future__ import annotations

from pathlib import Path

import typer

from fiberpath.config import WindFileError, load_wind_definition

from .output import echo_json

WIND_FILE_ARGUMENT = typer.Argument(..., exists=True, readable=True)
JSON_OPTION = typer.Option(False, "--json", help="Emit machine-readable JSON summary")


def validate_command(
    wind_file: Path = WIND_FILE_ARGUMENT, json_output: bool = JSON_OPTION
) -> None:
    try:
        load_wind_definition(wind_file)
    except WindFileError as exc:  # pragma: no cover - CLI glue
        raise typer.BadParameter(str(exc)) from exc

    if json_output:
        echo_json({"status": "ok", "path": str(wind_file)})
        return

    typer.echo(f"{wind_file} is valid.")
