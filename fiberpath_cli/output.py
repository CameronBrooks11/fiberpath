"""Utilities for CLI output modes."""

from __future__ import annotations

import json
from typing import Any

import typer


def echo_json(payload: Any) -> None:
    """Pretty-print payload as JSON."""

    typer.echo(json.dumps(payload, indent=2))
