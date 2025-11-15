"""Curve primitives for tow paths."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class CurveProfile:
    axial_mm: float
    mandrel_degrees: float


@dataclass(slots=True)
class HelicalCurve(CurveProfile):
    delivery_head_angle: float
