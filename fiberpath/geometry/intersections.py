"""Intersection helpers for slicing tow curves into machine segments."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class IntersectionResult:
    axial_mm: float
    mandrel_degrees: float


def intersect_curve_with_plane(*_, **__) -> IntersectionResult:
    """Placeholder for the eventual intersection math."""

    raise NotImplementedError("Intersection computation is not yet implemented")
