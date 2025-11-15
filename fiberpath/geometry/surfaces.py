"""Surface primitives used by the planner."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class CylindricalSurface:
    """Represents a straight cylindrical mandrel."""

    diameter_mm: float
    length_mm: float

    @property
    def circumference_mm(self) -> float:
        return self.diameter_mm * 3.141592653589793
