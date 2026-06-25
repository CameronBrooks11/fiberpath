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
        raw = location.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError) as exc:
        # Directory, unreadable file, or non-UTF-8/binary content. Surface as a
        # WindFileError so callers map it to a 4xx / clean CLI error instead of
        # leaking a raw IsADirectoryError / UnicodeDecodeError (HTTP 500).
        raise WindFileError(f"Could not read wind definition at {location}: {exc}") from exc
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise WindFileError(f"Invalid JSON in {location}: {exc}") from exc

    try:
        return WindDefinition.model_validate(payload)
    except ValidationError as exc:
        raise WindFileError(f"Wind definition at {location} failed validation: {exc}") from exc
