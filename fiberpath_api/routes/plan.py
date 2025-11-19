"""Planning endpoints."""

from __future__ import annotations

from dataclasses import asdict
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fiberpath.config import WindFileError, load_wind_definition
from fiberpath.gcode import write_gcode
from fiberpath.planning import plan_wind

router = APIRouter()


@router.post("/from-file")
def plan_from_file(path: str) -> dict[str, str | int | float | list[dict[str, str | int | float]]]:
    try:
        definition = load_wind_definition(Path(path))
    except WindFileError as exc:  # pragma: no cover - HTTP glue
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    result = plan_wind(definition)
    temp_file = write_gcode(result.commands, Path(path).with_suffix(".gcode"))
    return {
        "commands": len(result.commands),
        "output": str(temp_file),
        "timeSeconds": result.total_time_s,
        "towMeters": result.total_tow_m,
        "layers": [asdict(metric) for metric in result.layers],
    }
