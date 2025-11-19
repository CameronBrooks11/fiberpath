"""Pydantic schemas shared by API routes."""

from __future__ import annotations

from pydantic import BaseModel, Field


class FilePathRequest(BaseModel):
    path: str = Field(..., description="Absolute or workspace path to an input file.")


class PlanLayer(BaseModel):
    index: int
    wind_type: str
    commands: int
    time_s: float
    cumulative_time_s: float
    tow_m: float
    cumulative_tow_m: float
    terminal: bool


class PlanResponse(BaseModel):
    commands: int
    output: str
    timeSeconds: float
    towMeters: float
    layers: list[PlanLayer]


class SimulationResponse(BaseModel):
    commands: int
    moves: int
    estimated_time_s: float
    total_distance_mm: float
    tow_length_mm: float
    average_feed_rate_mmpm: float


class ValidateResponse(BaseModel):
    status: str
    path: str
