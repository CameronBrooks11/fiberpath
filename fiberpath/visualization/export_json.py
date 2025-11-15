"""Convert G-code streams into a lightweight JSON representation."""

from __future__ import annotations

import json
from collections.abc import Iterable
from pathlib import Path


def gcode_to_json(commands: Iterable[str], destination: str | Path) -> Path:
    target = Path(destination)
    payload = {"commands": [line.strip() for line in commands if line.strip()]}
    target.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return target
