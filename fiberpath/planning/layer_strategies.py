"""Layer-specific planning helpers."""

from __future__ import annotations

import math

from fiberpath.config.schemas import (
    HelicalLayer,
    HoopLayer,
    LayerModel,
    MandrelParameters,
    SkipLayer,
    TowParameters,
)
from fiberpath.math_utils import rad_to_deg

from .calculations import HelicalKinematics, compute_helical_kinematics
from .developed import build_developed_path, lower_developed_path
from .helpers import Axis
from .machine import WinderMachine
from .pattern import pattern_spec


def build_layer_summary(index: int, total: int, layer: LayerModel) -> str:
    return f"Layer {index} of {total}: {layer.wind_type}"


def dispatch_layer(
    machine: WinderMachine,
    layer: LayerModel,
    mandrel_parameters: MandrelParameters,
    tow_parameters: TowParameters,
    *,
    helical_kinematics: HelicalKinematics | None = None,
) -> None:
    if isinstance(layer, HoopLayer):
        plan_hoop_layer(machine, layer, mandrel_parameters, tow_parameters)
        return
    if isinstance(layer, HelicalLayer):
        plan_helical_layer(
            machine,
            layer,
            mandrel_parameters,
            tow_parameters,
            helical_kinematics=helical_kinematics,
        )
        return
    if isinstance(layer, SkipLayer):
        plan_skip_layer(machine, layer)
        return
    raise TypeError(f"Unsupported layer type: {layer}")


def plan_hoop_layer(
    machine: WinderMachine,
    layer: HoopLayer,
    mandrel_parameters: MandrelParameters,
    tow_parameters: TowParameters,
) -> None:
    lock_degrees = 180.0
    # The hoop wind angle is ~90 deg by definition; this is the *delivery-head
    # lean* that lays the tow flat at that wrap, derived from the tow geometry.
    # It is not a fiber/wind angle -- see PatternSpec.alpha_deg in planning.pattern.
    delivery_head_lean = 90.0 - rad_to_deg(
        math.atan(mandrel_parameters.diameter / tow_parameters.width)
    )
    mandrel_rotations = mandrel_parameters.wind_length / tow_parameters.width
    far_mandrel = lock_degrees + mandrel_rotations * 360.0
    far_lock = far_mandrel + lock_degrees
    near_mandrel = far_lock + mandrel_rotations * 360.0
    near_lock = near_mandrel + lock_degrees

    machine.move({Axis.CARRIAGE: 0.0, Axis.MANDREL: lock_degrees, Axis.DELIVERY_HEAD: 0.0})
    machine.move({Axis.DELIVERY_HEAD: -delivery_head_lean})
    machine.move({Axis.CARRIAGE: mandrel_parameters.wind_length, Axis.MANDREL: far_mandrel})
    machine.move({Axis.MANDREL: far_lock, Axis.DELIVERY_HEAD: 0.0})

    if layer.terminal:
        return

    machine.move({Axis.DELIVERY_HEAD: delivery_head_lean})
    machine.move({Axis.CARRIAGE: 0.0, Axis.MANDREL: near_mandrel})
    machine.move({Axis.MANDREL: near_lock, Axis.DELIVERY_HEAD: 0.0})
    machine.zero_axes(near_lock)


def plan_helical_layer(
    machine: WinderMachine,
    layer: HelicalLayer,
    mandrel_parameters: MandrelParameters,
    tow_parameters: TowParameters,
    *,
    helical_kinematics: HelicalKinematics | None = None,
) -> None:
    # Cut over to the developed-surface primitive (S2 #296): build the (z, theta)
    # path from the declarative spec + the single kinematics source, then lower it
    # to Motion IR. Byte-identical to the prior imperative emitter.
    kinematics = helical_kinematics or compute_helical_kinematics(
        layer, mandrel_parameters, tow_parameters
    )
    path = build_developed_path(pattern_spec(layer), kinematics, mandrel_parameters)
    lower_developed_path(machine, path)


def plan_skip_layer(machine: WinderMachine, layer: SkipLayer) -> None:
    machine.move(
        {
            Axis.CARRIAGE: 0.0,
            Axis.MANDREL: layer.mandrel_rotation,
            Axis.DELIVERY_HEAD: 0.0,
        }
    )
    machine.set_position({Axis.MANDREL: 0.0})
