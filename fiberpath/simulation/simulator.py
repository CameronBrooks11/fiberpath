"""Feed-rate aware simulator for Motion IR programs.

The simulator consumes a typed :class:`~fiberpath.planning.ir.Program` (produced
by ``plan_wind`` or parsed from text by ``read_program`` at the CLI/API boundary)
and derives its time/tow estimate from the **single** O1 motion model,
:func:`~fiberpath.planning.metrics.nominal_metrics` — the same implementation the
planner uses. There is no motion math here: the simulator only counts commands
and reports the shared metrics, so the planner's and simulator's reported time
agree by construction (the historical divergence is closed).
"""

from __future__ import annotations

from dataclasses import dataclass

from fiberpath.planning.ir import Program
from fiberpath.planning.metrics import nominal_metrics


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


def simulate_program(program: Program) -> SimulationResult:
    """Estimate execution time/tow usage for a Motion IR program."""
    if not program.moves:
        raise SimulationError("Program is empty")

    try:
        metrics = nominal_metrics(program.moves, program.meta.mandrel_diameter)
    except ValueError as exc:
        raise SimulationError(str(exc)) from exc

    # The header line is one executed command; each Move is one more (matching the
    # pre-IR per-line count for generated programs).
    commands_executed = 1 + len(program.moves)

    # Degenerate once the model is unified: with a single feed it just recovers the
    # feed rate; it stays for output-shape compatibility (calibration is #130).
    average_feed_rate = metrics.distance_mm / metrics.time_s * 60.0 if metrics.time_s > 0 else 0.0

    return SimulationResult(
        commands_executed=commands_executed,
        moves=metrics.move_count,
        estimated_time_s=metrics.time_s,
        total_distance_mm=metrics.distance_mm,
        tow_length_mm=metrics.distance_mm,
        average_feed_rate_mmpm=average_feed_rate,
    )
