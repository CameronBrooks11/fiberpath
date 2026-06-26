"""Tests for the sidecar readiness endpoint."""

from __future__ import annotations

from fastapi.testclient import TestClient
from fiberpath_api.main import create_app


def test_health_returns_ok() -> None:
    client = TestClient(create_app())
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
