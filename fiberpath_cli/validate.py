"""CLI validate command."""

from __future__ import annotations

from pathlib import Path

import typer
from fiberpath.config import WindFileError, load_wind_definition

WIND_FILE_ARGUMENT = typer.Argument(..., exists=True, readable=True)


def validate_command(wind_file: Path = WIND_FILE_ARGUMENT) -> None:
    try:
        load_wind_definition(wind_file)
    except WindFileError as exc:  # pragma: no cover - CLI glue
        raise typer.BadParameter(str(exc)) from exc

    typer.echo(f"{wind_file} is valid.")
