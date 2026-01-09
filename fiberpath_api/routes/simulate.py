"""Simulation endpoints."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException

from fiberpath.simulation import simulate_program

from ..schemas import FilePathRequest, SimulationResponse

router = APIRouter()


@router.post("/from-file", response_model=SimulationResponse)
def simulate_from_file(payload: FilePathRequest) -> SimulationResponse:
    target = Path(payload.path)
    if not target.exists():
        raise HTTPException(status_code=404, detail=f"No file found at {payload.path}")
    commands = target.read_text(encoding="utf-8").splitlines()
    result = simulate_program(commands)
    return SimulationResponse(
        commands=result.commands_executed,
        moves=result.moves,
        estimated_time_s=result.estimated_time_s,
        total_distance_mm=result.total_distance_mm,
        tow_length_mm=result.tow_length_mm,
        average_feed_rate_mmpm=result.average_feed_rate_mmpm,
    )
