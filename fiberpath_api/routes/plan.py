"""Planning endpoints."""

from __future__ import annotations

from dataclasses import asdict
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fiberpath.config import WindFileError, load_wind_definition
from fiberpath.gcode import write_gcode
from fiberpath.planning import plan_wind

from ..schemas import FilePathRequest, PlanLayer, PlanResponse

router = APIRouter()


@router.post("/from-file", response_model=PlanResponse)
def plan_from_file(payload: FilePathRequest) -> PlanResponse:
    file_path = Path(payload.path)
    try:
        definition = load_wind_definition(file_path)
    except WindFileError as exc:  # pragma: no cover - HTTP glue
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    result = plan_wind(definition)
    temp_file = write_gcode(result.commands, file_path.with_suffix(".gcode"))
    layers = [PlanLayer(**asdict(metric)) for metric in result.layers]
    return PlanResponse(
        commands=len(result.commands),
        output=str(temp_file),
        timeSeconds=result.total_time_s,
        towMeters=result.total_tow_m,
        layers=layers,
    )
