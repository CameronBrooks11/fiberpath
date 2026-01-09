"""Entry point for the FiberPath FastAPI service."""

from __future__ import annotations

from fastapi import FastAPI

from .routes import plan, simulate, stream, validate


def create_app() -> FastAPI:
    application = FastAPI(title="FiberPath API", version="0.4.0")
    application.include_router(plan.router, prefix="/plan", tags=["planning"])
    application.include_router(simulate.router, prefix="/simulate", tags=["simulation"])
    application.include_router(validate.router, prefix="/validate", tags=["validation"])
    application.include_router(stream.router, prefix="/stream", tags=["stream"])
    return application


app = create_app()
