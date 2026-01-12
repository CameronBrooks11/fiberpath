"""Helpers for loading and validating FiberPath input files."""

from __future__ import annotations

import json
from pathlib import Path

from pydantic import ValidationError

from .schemas import WindDefinition


class WindFileError(RuntimeError):
    """Raised when a wind definition file cannot be parsed."""


def load_wind_definition(path: str | Path) -> WindDefinition:
    """Load, parse, and validate a ``.wind`` definition file."""

    location = Path(path)
    if not location.exists():
        raise WindFileError(f"No wind definition found at {location}")
    try:
        payload = json.loads(location.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:  # pragma: no cover - extremely rare
        raise WindFileError(f"Invalid JSON in {location}: {exc}") from exc

    try:
        return WindDefinition.model_validate(payload)
    except ValidationError as exc:
        raise WindFileError(f"Wind definition at {location} failed validation: {exc}") from exc
