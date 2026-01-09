"""High-level wind planning orchestration."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from fiberpath.config import WindDefinition
from fiberpath.config.schemas import HelicalLayer, MandrelParameters
from fiberpath.gcode.generator import sanitize_program

from .calculations import HelicalKinematics
from .layer_strategies import build_layer_summary, dispatch_layer
from .machine import WinderMachine
from .validators import (
    validate_helical_layer,
    validate_layer_numeric_bounds,
    validate_layer_sequence,
)

if TYPE_CHECKING:
    from fiberpath.gcode.dialects import MarlinDialect


@dataclass(slots=True)
class PlanOptions:
    verbose: bool = False
    dialect: MarlinDialect = field(
        default_factory=lambda: _get_default_dialect()
    )  # noqa: E731


def _get_default_dialect() -> MarlinDialect:
    """Import default dialect lazily to avoid circular imports."""
    from fiberpath.gcode.dialects import MARLIN_XAB_STANDARD

    return MARLIN_XAB_STANDARD


@dataclass(slots=True)
class LayerMetrics:
    index: int
    wind_type: str
    commands: int
    time_s: float
    cumulative_time_s: float
    tow_m: float
    cumulative_tow_m: float
    terminal: bool


@dataclass(slots=True)
class PlanResult:
    commands: list[str]
    total_time_s: float
    total_tow_m: float
    layers: list[LayerMetrics]


def plan_wind(
    definition: WindDefinition, options: PlanOptions | None = None
) -> PlanResult:
    options = options or PlanOptions()
    machine = WinderMachine(
        mandrel_diameter=definition.mandrel_parameters.diameter,
        verbose_output=options.verbose,
        dialect=options.dialect,
    )

    # Generate initial position command using correct axis letters
    mapping = options.dialect.axis_mapping
    init_cmd = f"G0 {mapping.carriage}0 {mapping.mandrel}0 {mapping.delivery_head}0"
    program: list[str] = [definition.dump_header(), init_cmd]

    machine.set_feed_rate(definition.default_feed_rate)
    layer_metrics: list[LayerMetrics] = []
    encountered_terminal = False
    mandrel_diameter = definition.mandrel_parameters.diameter

    for index, layer in enumerate(definition.layers, start=1):
        validate_layer_sequence(index, encountered_terminal)
        validate_layer_numeric_bounds(index, layer)

        current_mandrel = MandrelParameters(
            diameter=mandrel_diameter,
            windLength=definition.mandrel_parameters.wind_length,
        )
        machine.set_mandrel_diameter(current_mandrel.diameter)

        helical_kinematics: HelicalKinematics | None = None
        if isinstance(layer, HelicalLayer):
            helical_kinematics = validate_helical_layer(
                index, layer, current_mandrel, definition.tow_parameters
            )

        summary = build_layer_summary(index, len(definition.layers), layer)
        machine.insert_comment(summary)

        pre_commands = len(machine.get_gcode())
        pre_time = machine.get_gcode_time_s()
        pre_tow = machine.get_tow_length_m()

        dispatch_layer(
            machine,
            layer,
            current_mandrel,
            definition.tow_parameters,
            helical_kinematics=helical_kinematics,
        )

        layer_metrics.append(
            LayerMetrics(
                index=index,
                wind_type=layer.wind_type,
                commands=len(machine.get_gcode()) - pre_commands,
                time_s=machine.get_gcode_time_s() - pre_time,
                cumulative_time_s=machine.get_gcode_time_s(),
                tow_m=machine.get_tow_length_m() - pre_tow,
                cumulative_tow_m=machine.get_tow_length_m(),
                terminal=bool(getattr(layer, "terminal", False)),
            )
        )

        if getattr(layer, "terminal", False):
            encountered_terminal = True
    program.extend(machine.get_gcode())

    if options.verbose:
        program.insert(0, "; Verbose output enabled")

    sanitized_commands = sanitize_program(program)
    return PlanResult(
        commands=sanitized_commands,
        total_time_s=machine.get_gcode_time_s(),
        total_tow_m=machine.get_tow_length_m(),
        layers=layer_metrics,
    )
