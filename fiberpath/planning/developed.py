"""Developed-surface representation of a winding layer and its Motion IR lowering.

On a cylinder, a constant-angle (``alpha``) helical path is a straight line in
the unwrapped ``(z, theta)`` development (closed-form, no ODE). This module turns
a :class:`~fiberpath.planning.pattern.PatternSpec` into a
:class:`DevelopedPath` -- an ordered polyline of machine *states* on the
developed surface -- and lowers that path to Motion IR through
:class:`~fiberpath.planning.machine.WinderMachine`.

Stage 2 / S2 (#296), helical only. The lowering deliberately *mirrors* the
legacy ``plan_helical_layer`` emission (same move order, comments, framing, and
the exact additive ``theta`` accumulation) so the developed-surface path is the
single geometry source while the emitted bytes stay identical to the committed
goldens until they are regenerated. The clean structural collapse (one move per
vertex) is deferred to a later slice behind the now-validated equivalence
harness. The lowering is geometry-agnostic: a cone is a denser polyline of the
same :class:`Waypoint` s reusing :func:`lower_developed_path`.
"""

from __future__ import annotations

from dataclasses import dataclass

from fiberpath.config.schemas import MandrelParameters

from .calculations import HelicalKinematics
from .helpers import Axis
from .machine import WinderMachine
from .pattern import PatternSpec

#: Delivery-head lift applied at each pass start/end before/after the laying lean.
PASS_START_LEAN_DEG = -10.0

# Axis -> developed-surface coordinate on a Waypoint.
_AXIS_ORDER = (Axis.CARRIAGE, Axis.MANDREL, Axis.DELIVERY_HEAD)


@dataclass(frozen=True, slots=True)
class Waypoint:
    """One machine state on the developed surface.

    ``z`` (axial mm), ``theta`` (circumferential deg, unwrapped/monotonic) and
    ``lean`` (delivery-head deg) are the full state; ``emit`` is the subset of
    axes this step actually writes (the others inherit their previous value, as
    :class:`WinderMachine` does). ``lay`` marks a fiber-laying segment endpoint.
    ``comment`` is emitted immediately before this step's move when set.
    """

    z: float
    theta: float
    lean: float
    lay: bool
    emit: frozenset[Axis]
    comment: str | None = None


@dataclass(frozen=True, slots=True)
class DevelopedPath:
    """A winding layer as an ordered polyline on the developed cylinder."""

    waypoints: tuple[Waypoint, ...]
    emit_initial_near_lock: bool
    initial_lock_degrees: float
    final_angle: float


def build_developed_path(
    spec: PatternSpec,
    kinematics: HelicalKinematics,
    mandrel: MandrelParameters,
) -> DevelopedPath:
    """Build the developed-surface path for a helical layer.

    Reuses ``kinematics`` (the single motion-math source) verbatim and
    accumulates ``theta`` in the exact additive order of the legacy emitter, so
    the lowered output is byte-identical to the committed helical goldens.
    """
    lead_out_degrees = spec.lead_out_degrees
    wind_lead_in_mm = spec.lead_in_mm
    lock_degrees = spec.lock_degrees
    delivery_head_angle = -1.0 * (90.0 - spec.alpha_deg)
    pattern_number = spec.pattern_number
    wind_length = mandrel.wind_length

    num_circuits = kinematics.num_circuits
    pattern_step_degrees = kinematics.pattern_step_degrees
    pass_rotation_degrees = kinematics.pass_rotation_degrees
    lead_in_degrees = kinematics.lead_in_degrees
    main_pass_degrees = kinematics.main_pass_degrees
    number_of_patterns = num_circuits / pattern_number
    start_position_increment = spec.skip_index * (360.0 / pattern_number)
    # (delivery_head_sign, lead_in_end_mm, full_pass_end_mm) per pass direction.
    pass_parameters = (
        (1, wind_lead_in_mm, wind_length),
        (-1, wind_length - wind_lead_in_mm, 0.0),
    )

    waypoints: list[Waypoint] = []
    mandrel_position = 0.0
    z = 0.0
    patterns = int(number_of_patterns)
    for pattern_index in range(patterns):
        for in_pattern_index in range(pattern_number):
            comment = (
                f"\tPattern: {pattern_index + 1}/{patterns} "
                f"Circuit: {in_pattern_index + 1}/{pattern_number}"
            )
            for pass_index, (sign, lead_in_end_mm, full_pass_end_mm) in enumerate(pass_parameters):
                # (a) pass start: settle mandrel, zero the delivery-head lean.
                waypoints.append(
                    Waypoint(
                        z=z,
                        theta=mandrel_position,
                        lean=0.0,
                        lay=False,
                        emit=frozenset({Axis.MANDREL, Axis.DELIVERY_HEAD}),
                        comment=comment if pass_index == 0 else None,
                    )
                )
                # (b) lift the delivery head to the pass-start lean.
                waypoints.append(
                    Waypoint(
                        z=z,
                        theta=mandrel_position,
                        lean=sign * PASS_START_LEAN_DEG,
                        lay=False,
                        emit=frozenset({Axis.DELIVERY_HEAD}),
                    )
                )
                # (c) lead-in: ramp to the laying lean over the lead-in length.
                mandrel_position += lead_in_degrees
                z = lead_in_end_mm
                waypoints.append(
                    Waypoint(
                        z=z,
                        theta=mandrel_position,
                        lean=sign * delivery_head_angle,
                        lay=True,
                        emit=frozenset({Axis.CARRIAGE, Axis.MANDREL, Axis.DELIVERY_HEAD}),
                    )
                )
                # (d) main pass: hold the laying lean (inherited), traverse to the end.
                mandrel_position += main_pass_degrees
                z = full_pass_end_mm
                waypoints.append(
                    Waypoint(
                        z=z,
                        theta=mandrel_position,
                        lean=sign * delivery_head_angle,
                        lay=True,
                        emit=frozenset({Axis.CARRIAGE, Axis.MANDREL}),
                    )
                )
                # (e) lead-out: rotate through the lead-out, drop back to pass-start lean.
                mandrel_position += lead_out_degrees
                waypoints.append(
                    Waypoint(
                        z=z,
                        theta=mandrel_position,
                        lean=sign * PASS_START_LEAN_DEG,
                        lay=False,
                        emit=frozenset({Axis.MANDREL, Axis.DELIVERY_HEAD}),
                    )
                )
                # Per-pass turnaround dwell (no emitted move): the net of the lock,
                # the lead-out already taken, and the pass's circumferential wrap.
                mandrel_position += (
                    lock_degrees - lead_out_degrees - (pass_rotation_degrees % 360.0)
                )
            mandrel_position += start_position_increment
        mandrel_position += pattern_step_degrees

    # Closing lock move + the final mandrel angle handed to zero_axes.
    mandrel_position += lock_degrees
    waypoints.append(
        Waypoint(
            z=z,
            theta=mandrel_position,
            lean=0.0,
            lay=False,
            emit=frozenset({Axis.MANDREL, Axis.DELIVERY_HEAD}),
        )
    )

    return DevelopedPath(
        waypoints=tuple(waypoints),
        emit_initial_near_lock=not spec.skip_initial_near_lock,
        initial_lock_degrees=lock_degrees,
        final_angle=mandrel_position,
    )


def _targets(waypoint: Waypoint) -> dict[Axis, float]:
    value = {
        Axis.CARRIAGE: waypoint.z,
        Axis.MANDREL: waypoint.theta,
        Axis.DELIVERY_HEAD: waypoint.lean,
    }
    return {axis: value[axis] for axis in _AXIS_ORDER if axis in waypoint.emit}


def lower_developed_path(machine: WinderMachine, path: DevelopedPath) -> None:
    """Emit a developed-surface path to Motion IR via the machine.

    Endpoints only -- carriage segmentation, all-axis completion, and the
    inherited-axis carryover stay in :class:`WinderMachine`.
    """
    if path.emit_initial_near_lock:
        machine.move(
            {Axis.CARRIAGE: 0.0, Axis.MANDREL: path.initial_lock_degrees, Axis.DELIVERY_HEAD: 0.0}
        )
        machine.set_position({Axis.MANDREL: 0.0})

    for waypoint in path.waypoints:
        if waypoint.comment is not None:
            machine.insert_comment(waypoint.comment)
        machine.move(_targets(waypoint))

    machine.zero_axes(path.final_angle)
