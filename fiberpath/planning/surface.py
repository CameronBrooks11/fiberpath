"""Mandrel surface model — typed analytic profile segments.

A constant-angle winding path is closed-form on any *developable* surface: the
surface unrolls to a flat plane (cylinder) or sector (cone) with no distortion,
so no ODE/friction solver is needed. ``is_developable()`` is O(1) by type.

Stage 3a (#138) introduces this model. S1 (this slice) defines the types and
routes the existing cylinder geometry through it with no behavioural change;
the cone becomes plannable in S2 (z-dependent radius / unrolled-sector
development).
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from fiberpath.config.schemas import MandrelParameters


@dataclass(frozen=True, slots=True)
class Cylinder:
    """Constant-radius surface (the only surface planned before Stage 3a)."""

    radius: float

    def is_developable(self) -> bool:
        return True

    def radius_at(self, z: float) -> float:  # noqa: ARG002 - constant by definition
        return self.radius

    def diameter_at(self, z: float) -> float:
        # 2 * (d / 2) is bit-exact for all normal floats (both steps are pure
        # exponent shifts), so a Cylinder built from `diameter / 2` reproduces
        # the legacy `mandrel.diameter` reads exactly — this is what keeps the
        # S1 cut-over byte-identical.
        return 2.0 * self.radius_at(z)

    def circumference_at(self, z: float) -> float:
        return math.pi * self.diameter_at(z)


@dataclass(frozen=True, slots=True)
class Cone:
    """Frustum: radius varies linearly from ``r0`` (z=0) to ``r1`` (z=length).

    Defined in S1 but not yet planned; the z-dependent winding kinematics
    (varying circumference, pitch, dwell) land in S2.
    """

    r0: float
    r1: float
    length: float

    def is_developable(self) -> bool:
        return True

    def radius_at(self, z: float) -> float:
        # minimal: no length>0 / positivity guard — nothing constructs a Cone
        # from input yet. S2 validates these at the .wind schema boundary when
        # cones become plannable (length==0 would raise ZeroDivisionError here).
        return self.r0 + (self.r1 - self.r0) * (z / self.length)

    def diameter_at(self, z: float) -> float:
        return 2.0 * self.radius_at(z)

    def circumference_at(self, z: float) -> float:
        return math.pi * self.diameter_at(z)


Surface = Cylinder | Cone


def surface_from_mandrel(mandrel: MandrelParameters) -> Surface:
    """Map the .wind mandrel parameters onto the analytic surface model.

    A reducing ``endDiameter`` (set and below ``diameter``) yields a ``Cone``
    (large end ``diameter`` at z=0, small end ``endDiameter`` at z=windLength);
    an absent or equal ``endDiameter`` is a ``Cylinder``. A *larger* ``endDiameter``
    falls through to the cone branch so the layer validators reject it (expanding
    frusta are not supported yet) with a clear message.
    """
    if mandrel.end_diameter is not None and mandrel.end_diameter != mandrel.diameter:
        return Cone(
            r0=mandrel.diameter / 2.0,
            r1=mandrel.end_diameter / 2.0,
            length=mandrel.wind_length,
        )
    return Cylinder(radius=mandrel.diameter / 2.0)
