"""Feed-rate aware simulator for generated G-code programs."""

from __future__ import annotations

import json
import math
from collections.abc import Iterable, Sequence
from dataclasses import dataclass


class SimulationError(RuntimeError):
    """Raised when a program cannot be simulated."""


@dataclass(slots=True)
class SimulationResult:
    commands_executed: int
    moves: int
    estimated_time_s: float
    total_distance_mm: float
    tow_length_mm: float
    average_feed_rate_mmpm: float


HEADER_PREFIX = "; Parameters "
DEFAULT_FEED_RATE = 6000.0


def simulate_program(
    commands: Iterable[str],
    *,
    default_feed_rate: float = DEFAULT_FEED_RATE,
) -> SimulationResult:
    """Estimate execution time/tow usage for a G-code program.

    Parameters
    ----------
    commands:
        Iterable of G-code lines (typically `plan_wind(...).commands`).
    default_feed_rate:
        Fallback feed rate to use until the program sets one explicitly.
    """

    program = list(commands)
    if not program:
        raise SimulationError("Program is empty")

    metadata = _extract_metadata(program)
    mandrel_circumference = math.pi * metadata["mandrel_diameter"]

    feed_rate = default_feed_rate
    if feed_rate <= 0:
        raise SimulationError("Default feed rate must be positive")

    last_x = 0.0
    last_y = 0.0
    last_z = 0.0

    commands_executed = 0
    moves = 0
    total_distance = 0.0
    tow_length = 0.0
    total_time = 0.0

    for raw_line in program:
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith(";"):
            commands_executed += 1
            continue

        parts = line.split()
        opcode = parts[0]
        commands_executed += 1

        if opcode not in {"G0", "G1"}:
            # Control commands still count toward execution but contain no motion.
            for token in parts[1:]:
                if token.startswith("F"):
                    feed_rate = float(token[1:])
            continue

        next_x = last_x
        next_y = last_y
        next_z = last_z

        for token in parts[1:]:
            axis = token[0]
            value = token[1:]
            if axis in {"X", "Y", "Z"}:
                coord = float(value)
                if axis == "X":
                    next_x = coord
                elif axis == "Y":
                    next_y = coord
                else:
                    next_z = coord
            elif axis == "F":
                feed_rate = float(value)

        carriage_delta = next_x - last_x
        mandrel_delta_deg = next_y - last_y
        delivery_delta = next_z - last_z

        mandrel_delta_mm = mandrel_delta_deg / 360.0 * mandrel_circumference
        distance_sq = carriage_delta**2 + mandrel_delta_mm**2
        tow_length_sq = carriage_delta**2 + mandrel_delta_mm**2

        if math.isclose(distance_sq, 0.0) and math.isclose(delivery_delta, 0.0):
            last_x, last_y, last_z = next_x, next_y, next_z
            continue

        distance = math.sqrt(distance_sq)
        if feed_rate <= 0:
            raise SimulationError("Encountered non-positive feed rate during simulation")

        total_time += distance / feed_rate * 60.0
        total_distance += distance
        tow_length += math.sqrt(tow_length_sq)
        moves += 1

        last_x, last_y, last_z = next_x, next_y, next_z

    average_feed_rate = total_distance / total_time * 60.0 if total_time > 0 else feed_rate

    return SimulationResult(
        commands_executed=commands_executed,
        moves=moves,
        estimated_time_s=total_time,
        total_distance_mm=total_distance,
        tow_length_mm=tow_length,
        average_feed_rate_mmpm=average_feed_rate,
    )


def _extract_metadata(program: Sequence[str]) -> dict[str, float]:
    for line in program:
        stripped = line.strip()
        if stripped.startswith(HEADER_PREFIX):
            payload = stripped[len(HEADER_PREFIX) :]
            data = json.loads(payload)
            mandrel = data["mandrel"]
            return {"mandrel_diameter": float(mandrel["diameter"])}
    raise SimulationError("Unable to locate Parameters header in program")
