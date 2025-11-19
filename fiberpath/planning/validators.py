"""Validation helpers for planner inputs."""

from __future__ import annotations

from math import gcd

from fiberpath.config.schemas import HelicalLayer, LayerModel, MandrelParameters, TowParameters

from .calculations import HelicalKinematics, compute_helical_kinematics
from .exceptions import LayerValidationError

MIN_WIND_ANGLE = 1.0
MAX_WIND_ANGLE = 89.0


def validate_layer_sequence(layer_index: int, encountered_terminal: bool) -> None:
    if encountered_terminal:
        raise LayerValidationError(
            layer_index,
            "terminal layer must be the final entry in the definition",
        )


def validate_layer_numeric_bounds(layer_index: int, layer: LayerModel) -> None:
    wind_angle = getattr(layer, "wind_angle", None)
    if wind_angle is not None and not (MIN_WIND_ANGLE <= wind_angle <= MAX_WIND_ANGLE):
        raise LayerValidationError(
            layer_index,
            f"wind angle {wind_angle}° must be between {MIN_WIND_ANGLE}° and {MAX_WIND_ANGLE}°",
        )


def validate_helical_layer(
    layer_index: int,
    layer: HelicalLayer,
    mandrel: MandrelParameters,
    tow: TowParameters,
) -> HelicalKinematics:
    if layer.skip_index >= layer.pattern_number:
        raise LayerValidationError(
            layer_index,
            "skipIndex must be less than patternNumber",
        )

    if gcd(layer.skip_index, layer.pattern_number) != 1:
        raise LayerValidationError(
            layer_index,
            "skipIndex and patternNumber must be coprime for full coverage",
        )

    return compute_helical_kinematics(layer, mandrel, tow)
