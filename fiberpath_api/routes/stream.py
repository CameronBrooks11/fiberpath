"""Serial streaming placeholder endpoints."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.post("/start")
def start_stream() -> dict[str, str]:
    raise HTTPException(status_code=501, detail="Streaming not implemented yet")
