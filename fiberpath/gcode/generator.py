"""Utilities for generating and persisting G-code programs."""

from __future__ import annotations

from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from pathlib import Path


@dataclass(slots=True)
class GCodeProgram:
    commands: list[str]

    def as_text(self) -> str:
        return "\n".join(self.commands) + "\n"


def sanitize_program(commands: Iterable[str]) -> list[str]:
    sanitized: list[str] = []
    for line in commands:
        stripped = line.strip()
        if stripped:
            sanitized.append(stripped)
    return sanitized


def write_gcode(program: GCodeProgram | Sequence[str], destination: str | Path) -> Path:
    target = Path(destination)
    lines = program.commands if isinstance(program, GCodeProgram) else list(program)
    target.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return target
