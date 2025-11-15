"""Simple machine state helpers used by the planner."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class MachineState:
    mandrel_diameter_mm: float
    wind_length_mm: float
    tow_width_mm: float
    feed_rate_mmpm: float

    carriage_mm: float = 0.0
    mandrel_degrees: float = 0.0
    delivery_head_degrees: float = 0.0

    def reset_axes(self) -> None:
        self.carriage_mm = 0.0
        self.mandrel_degrees = 0.0
        self.delivery_head_degrees = 0.0
