"""Nominal toolpath metrics over the Motion IR — the single time/tow model.

The **O1 surface-arc** model: for each motion, ``distance = Euclid(carriage_mm,
mandrel_arc_mm)`` with the delivery head **excluded** (it carries no tow and its
nominal contribution is not modelled); ``time = distance / feed``. ``SET_POSITION``
(G92) redefines the coordinate origin, so subsequent deltas are measured from the
reset position.

This is the one implementation consumed by the planner (``LayerMetrics``) and, from
S3, the simulator — eliminating the historical planner/simulator divergence (the
old planner summed raw *degrees* + delivery; the simulator ignored G92). Hardware
calibration of the nominal estimate is tracked separately (#130).
"""

from __future__ import annotations

import math
from collections.abc import Iterable
from dataclasses import dataclass

from .helpers import Axis
from .ir import Move, MoveKind


@dataclass(slots=True)
class NominalMetrics:
    time_s: float
    # Surface-arc tow length (carriage + mandrel arc, delivery excluded). For this
    # model total travel == tow, so it doubles as the nominal distance.
    distance_mm: float
    # Number of moves that produce surface motion (distance > 0); the simulator
    # reports this as its `moves` count without re-deriving distance.
    move_count: int = 0


def nominal_metrics(moves: Iterable[Move], mandrel_diameter: float) -> NominalMetrics:
    circumference = math.pi * mandrel_diameter
    feed_mmpm = 0.0
    last = {Axis.CARRIAGE: 0.0, Axis.MANDREL: 0.0, Axis.DELIVERY_HEAD: 0.0}
    time_s = 0.0
    distance_mm = 0.0
    move_count = 0

    for move in moves:
        if move.kind is MoveKind.SET_FEED:
            assert move.feed is not None
            feed_mmpm = move.feed
            continue
        if move.kind is MoveKind.SET_POSITION:
            for axis, value in move.targets.items():
                last[axis] = value
            continue
        if move.kind is MoveKind.COMMENT:
            continue

        # RAPID: surface-arc distance, delivery head excluded.
        carriage_delta = move.targets.get(Axis.CARRIAGE, last[Axis.CARRIAGE]) - last[Axis.CARRIAGE]
        mandrel_delta_deg = move.targets.get(Axis.MANDREL, last[Axis.MANDREL]) - last[Axis.MANDREL]
        mandrel_arc_mm = mandrel_delta_deg / 360.0 * circumference
        distance = math.sqrt(carriage_delta**2 + mandrel_arc_mm**2)
        if distance > 0.0:
            if feed_mmpm <= 0:
                raise ValueError("Feed rate must be set before moving the machine")
            time_s += distance / feed_mmpm * 60.0
            distance_mm += distance
            move_count += 1
        for axis, value in move.targets.items():
            last[axis] = value

    return NominalMetrics(time_s=time_s, distance_mm=distance_mm, move_count=move_count)
