"""Plot/preview endpoint."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Response
from fiberpath.gcode import ProgramReadError, read_program
from fiberpath.visualization import render_plot

from ..schemas import BAD_REQUEST_RESPONSE, GcodeRequest

router = APIRouter()


@router.post("", responses={200: {"content": {"image/png": {}}}, **BAD_REQUEST_RESPONSE})
def plot(payload: GcodeRequest) -> Response:
    """Render an unwrapped 2D preview of a G-code program as a PNG."""
    lines = payload.gcode.splitlines()
    if not any(line.strip() for line in lines):
        raise HTTPException(status_code=400, detail="gcode contained no commands")
    try:
        program = read_program(lines)
    except ProgramReadError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    png = render_plot(program).to_png_bytes()
    return Response(content=png, media_type="image/png")
