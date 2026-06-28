"""Request/response schemas specific to the API surface.

Compute *results* (plan/simulate) use the shared versioned wire schema in
``fiberpath.wire``. This module holds only the API-local request bodies and the
validation status response.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class GcodeRequest(BaseModel):
    gcode: str = Field(
        ...,
        max_length=10_000_000,
        description="G-code program to process, newline separated.",
    )


class ValidateResponse(BaseModel):
    valid: bool


class ApiError(BaseModel):
    """Error envelope returned for 4xx responses (``{"detail": "..."}``)."""

    detail: str


# Reusable OpenAPI declaration for the 400 the compute routes can return when the
# engine rejects otherwise well-formed input (PlanningError/SimulationError/
# PlotError -> 400 via the app's exception handlers). Declaring it makes the
# contract explicit and lets the generated client type the error body.
BAD_REQUEST_RESPONSE: dict[int | str, dict[str, Any]] = {
    400: {"model": ApiError, "description": "Input rejected by the compute engine."}
}


# -- machine-control surface ----------------------------------------------------


class PortInfoOut(BaseModel):
    """One serial port discovered on the host."""

    port: str
    description: str
    hwid: str


class ConnectRequest(BaseModel):
    port: str
    baud_rate: int = 250000
    timeout: float = 10.0


class ConnectionInfoOut(BaseModel):
    """Connection banner for the #146 connection-info panel."""

    state: str
    port: str
    baud_rate: int
    firmware: str
    capabilities: dict[str, bool]


class CommandRequest(BaseModel):
    gcode: str = Field(..., description="A single G-code command to run manually.")


class CommandResponse(BaseModel):
    responses: list[str]


class StartJobRequest(BaseModel):
    gcode: str = Field(
        ...,
        max_length=10_000_000,
        description="G-code program to stream, newline separated.",
    )


class StartJobResponse(BaseModel):
    job_id: str
    total: int


class JobEventOut(BaseModel):
    """One entry from a job's monotonic event log."""

    seq: int
    type: str
    sent: int | None = None
    total: int | None = None
    command: str | None = None
    action: str | None = None
    message: str | None = None


class JobStatusOut(BaseModel):
    id: str
    state: str
    sent: int
    total: int
    error: str | None = None
    cursor: int
    events: list[JobEventOut]
