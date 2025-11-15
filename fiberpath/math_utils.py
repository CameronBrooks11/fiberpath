"""Small math helpers shared across modules."""

from __future__ import annotations

import math


def deg_to_rad(degrees: float) -> float:
    return math.radians(degrees)


def rad_to_deg(radians: float) -> float:
    return math.degrees(radians)


def strip_precision(value: float, digits: int = 6) -> float:
    return float(f"{value:.{digits}f}")
