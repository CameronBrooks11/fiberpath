"""Simulation endpoints."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException
from fiberpath.simulation import simulate_program

router = APIRouter()


@router.post("/from-file")
def simulate_from_file(path: str) -> dict[str, float | int]:
    target = Path(path)
    if not target.exists():
        raise HTTPException(status_code=404, detail=f"No file found at {path}")
    commands = target.read_text(encoding="utf-8").splitlines()
    result = simulate_program(commands)
    return {
        "commands": result.commands_executed,
        "estimated_time_s": result.estimated_time_s,
    }
