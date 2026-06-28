"""Machine-control endpoints (serial connection, manual commands, streaming jobs).

The sidecar owns the serial port via the :data:`fiberpath_api.machine.machine`
singleton. These handlers are thin: they translate request/response shapes and
map machine errors to HTTP status codes. ``MachineBusyError`` /
``MachineConflictError`` -> 409 and ``MachineNotFoundError`` -> 404 are mapped
here (not at app level) because the app-wide ``MachineError`` handler only knows
the 400 case.
"""

from __future__ import annotations

from typing import NoReturn

from fastapi import APIRouter, HTTPException, Response
from marlin_host import HostError

from ..machine import (
    MachineBusyError,
    MachineConflictError,
    MachineError,
    MachineNotFoundError,
    machine,
)
from ..schemas import (
    BAD_REQUEST_RESPONSE,
    CommandRequest,
    CommandResponse,
    ConnectionInfoOut,
    ConnectRequest,
    JobStatusOut,
    PortInfoOut,
    StartJobRequest,
    StartJobResponse,
)

router = APIRouter()


def _raise_http(exc: MachineError | HostError) -> NoReturn:
    """Translate a machine/host error into the matching HTTPException."""
    if isinstance(exc, MachineNotFoundError):
        raise HTTPException(status_code=404, detail=str(exc))
    if isinstance(exc, (MachineBusyError, MachineConflictError)):
        raise HTTPException(status_code=409, detail=str(exc))
    raise HTTPException(status_code=400, detail=str(exc))


@router.get("/ports", response_model=list[PortInfoOut])
def list_ports() -> list[PortInfoOut]:
    """Enumerate the serial ports available on the host."""
    return [
        PortInfoOut(port=p.port, description=p.description, hwid=p.hwid)
        for p in machine.list_serial_ports()
    ]


@router.post("/connection", response_model=ConnectionInfoOut, responses=BAD_REQUEST_RESPONSE)
def connect(body: ConnectRequest) -> ConnectionInfoOut:
    """Open the serial port and return the controller's connection banner."""
    try:
        info = machine.connect(body.port, body.baud_rate, body.timeout)
    except (MachineError, HostError) as exc:
        _raise_http(exc)
    return ConnectionInfoOut(**info)  # type: ignore[arg-type]


@router.delete("/connection", status_code=204)
def disconnect() -> Response:
    """Cancel any active job and close the serial port."""
    machine.disconnect()
    return Response(status_code=204)


@router.post("/commands", response_model=CommandResponse, responses=BAD_REQUEST_RESPONSE)
def send_command(body: CommandRequest) -> CommandResponse:
    """Run a single manual G-code command (rejected 409 while a job streams)."""
    try:
        responses = machine.send_command(body.gcode)
    except (MachineError, HostError) as exc:
        _raise_http(exc)
    return CommandResponse(responses=responses)


@router.post("/jobs", response_model=StartJobResponse, responses=BAD_REQUEST_RESPONSE)
def start_job(body: StartJobRequest) -> StartJobResponse:
    """Start streaming a G-code program on a background worker."""
    try:
        info = machine.start_job(body.gcode)
    except (MachineError, HostError) as exc:
        _raise_http(exc)
    return StartJobResponse(**info)  # type: ignore[arg-type]


@router.get("/jobs/{job_id}", response_model=JobStatusOut, responses=BAD_REQUEST_RESPONSE)
def get_job(job_id: str, since: int = 0) -> JobStatusOut:
    """Poll a job's status and the event log entries with ``seq > since``."""
    try:
        status = machine.get_job(job_id, since)
    except (MachineError, HostError) as exc:
        _raise_http(exc)
    return JobStatusOut(**status)  # type: ignore[arg-type]


@router.post("/jobs/{job_id}/pause", response_model=JobStatusOut, responses=BAD_REQUEST_RESPONSE)
def pause_job(job_id: str) -> JobStatusOut:
    """Pause a streaming job before its next line (host-side)."""
    try:
        status = machine.pause_job(job_id)
    except (MachineError, HostError) as exc:
        _raise_http(exc)
    return JobStatusOut(**status)  # type: ignore[arg-type]


@router.post("/jobs/{job_id}/resume", response_model=JobStatusOut, responses=BAD_REQUEST_RESPONSE)
def resume_job(job_id: str) -> JobStatusOut:
    """Resume a paused job."""
    try:
        status = machine.resume_job(job_id)
    except (MachineError, HostError) as exc:
        _raise_http(exc)
    return JobStatusOut(**status)  # type: ignore[arg-type]


@router.post("/jobs/{job_id}/cancel", response_model=JobStatusOut, responses=BAD_REQUEST_RESPONSE)
def cancel_job(job_id: str) -> JobStatusOut:
    """Stop a job gracefully; the connection stays open."""
    try:
        status = machine.cancel_job(job_id)
    except (MachineError, HostError) as exc:
        _raise_http(exc)
    return JobStatusOut(**status)  # type: ignore[arg-type]


@router.post("/estop", status_code=204)
def emergency_stop() -> Response:
    """Issue #196 safety stop: write M112 out-of-band, bypassing the lock."""
    try:
        machine.emergency_stop()
    except (MachineError, HostError) as exc:
        _raise_http(exc)
    return Response(status_code=204)
