"""Validation endpoints."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fiberpath.config import WindFileError, load_wind_definition

router = APIRouter()


@router.post("/from-file")
def validate_from_file(path: str) -> dict[str, str]:
    try:
        load_wind_definition(Path(path))
    except WindFileError as exc:  # pragma: no cover - HTTP glue
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"status": "ok"}
