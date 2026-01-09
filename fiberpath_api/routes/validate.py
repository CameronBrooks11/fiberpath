"""Validation endpoints."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fiberpath.config import WindFileError, load_wind_definition

from ..schemas import FilePathRequest, ValidateResponse

router = APIRouter()


@router.post("/from-file", response_model=ValidateResponse)
def validate_from_file(payload: FilePathRequest) -> ValidateResponse:
    try:
        load_wind_definition(Path(payload.path))
    except WindFileError as exc:  # pragma: no cover - HTTP glue
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return ValidateResponse(status="ok", path=payload.path)
