"""Feed-rate aware simulator for Motion IR programs.

The simulator consumes a typed :class:`~fiberpath.planning.ir.Program` (produced
by ``plan_wind`` or parsed from text by ``read_program`` at the CLI/API
boundary) — it no longer parses G-code text. The time/tow estimate here is still
the simulator's own pass and is deliberately **G92-blind** (``SET_POSITION`` is
ignored), matching the pre-IR output; S3 (#136) replaces this pass with the
shared :func:`~fiberpath.planning.metrics.nominal_metrics`, which is G92-aware
and ends the planner/simulator divergence.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

from fiberpath.planning.helpers import Axis
from fiberpath.planning.ir import MoveKind, Program


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


DEFAULT_FEED_RATE = 6000.0


def simulate_program(
    program: Program,
    *,
    default_feed_rate: float = DEFAULT_FEED_RATE,
) -> SimulationResult:
    """Estimate execution time/tow usage for a Motion IR program.

    Parameters
    ----------
    program:
        The Motion IR program (``plan_wind(...)`` or ``read_program(...)``).
    default_feed_rate:
        Feed rate used until the program sets one explicitly.
    """

    if not program.moves:
        raise SimulationError("Program is empty")

    feed_rate = default_feed_rate
    if feed_rate <= 0:
        raise SimulationError("Default feed rate must be positive")

    mandrel_circumference = math.pi * program.meta.mandrel_diameter

    last_carriage = 0.0
    last_mandrel = 0.0
    last_delivery = 0.0

    # The header line is one executed command; each Move is one more (matching the
    # pre-IR per-line count for generated programs).
    commands_executed = 1
    moves = 0
    total_distance = 0.0
    tow_length = 0.0
    total_time = 0.0

    for move in program.moves:
        commands_executed += 1
        if move.kind is MoveKind.SET_FEED:
            assert move.feed is not None
            feed_rate = move.feed
            continue
        if move.kind is MoveKind.COMMENT:
            continue
        if move.kind is MoveKind.SET_POSITION:
            # minimal: G92 left blind to preserve the pre-IR estimate; S3 swaps this
            # whole pass for the G92-aware nominal_metrics.
            continue

        next_carriage = move.targets.get(Axis.CARRIAGE, last_carriage)
        next_mandrel = move.targets.get(Axis.MANDREL, last_mandrel)
        next_delivery = move.targets.get(Axis.DELIVERY_HEAD, last_delivery)

        carriage_delta = next_carriage - last_carriage
        mandrel_delta_deg = next_mandrel - last_mandrel
        delivery_delta = next_delivery - last_delivery

        mandrel_delta_mm = mandrel_delta_deg / 360.0 * mandrel_circumference
        distance_sq = carriage_delta**2 + mandrel_delta_mm**2

        if math.isclose(distance_sq, 0.0) and math.isclose(delivery_delta, 0.0):
            last_carriage, last_mandrel, last_delivery = next_carriage, next_mandrel, next_delivery
            continue

        distance = math.sqrt(distance_sq)
        if feed_rate <= 0:
            raise SimulationError("Encountered non-positive feed rate during simulation")

        total_time += distance / feed_rate * 60.0
        total_distance += distance
        # tow length per move equals the Euclidean carriage+mandrel distance
        tow_length += distance
        moves += 1

        last_carriage, last_mandrel, last_delivery = next_carriage, next_mandrel, next_delivery

    average_feed_rate = total_distance / total_time * 60.0 if total_time > 0 else feed_rate

    return SimulationResult(
        commands_executed=commands_executed,
        moves=moves,
        estimated_time_s=total_time,
        total_distance_mm=total_distance,
        tow_length_mm=tow_length,
        average_feed_rate_mmpm=average_feed_rate,
    )
