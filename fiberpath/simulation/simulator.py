"""Minimal placeholder simulator."""

from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass


@dataclass(slots=True)
class SimulationResult:
    commands_executed: int
    estimated_time_s: float


def simulate_program(commands: Iterable[str]) -> SimulationResult:
    command_count = sum(1 for _ in commands)
    return SimulationResult(commands_executed=command_count, estimated_time_s=0.0)
