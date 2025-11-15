"""High-level wind planning orchestration."""

from __future__ import annotations

from dataclasses import dataclass

from fiberpath.config import WindDefinition
from fiberpath.gcode.generator import sanitize_program

from .layer_strategies import build_layer_summary, dispatch_layer
from .machine import WinderMachine


@dataclass(slots=True)
class PlanOptions:
    verbose: bool = False
    dialect: str = "marlin"


def plan_wind(definition: WindDefinition, options: PlanOptions | None = None) -> list[str]:
    options = options or PlanOptions()
    machine = WinderMachine(
        mandrel_diameter=definition.mandrel_parameters.diameter,
        verbose_output=options.verbose,
    )
    machine.set_feed_rate(definition.default_feed_rate)

    program: list[str] = [definition.dump_header(), "G21", "G90"]

    for index, layer in enumerate(definition.layers, start=1):
        summary = build_layer_summary(index, len(definition.layers), layer)
        machine.insert_comment(summary)
        dispatch_layer(
            machine,
            layer,
            definition.mandrel_parameters,
            definition.tow_parameters,
        )

    machine.add_raw_gcode("M2 ; End of program")

    program.extend(machine.get_gcode())

    if options.verbose:
        program.insert(0, "; Verbose output enabled")

    return sanitize_program(program)
