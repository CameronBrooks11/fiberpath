"""High-level wind planning orchestration."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING

from fiberpath.config import WindDefinition
from fiberpath.config.schemas import MandrelParameters
from fiberpath.gcode.serializer import serialize

from .calculations import HelicalKinematics
from .helpers import Axis
from .ir import Move, MoveKind, Program, ProgramMeta
from .layer_strategies import build_layer_summary, dispatch_layer
from .machine import WinderMachine
from .metrics import nominal_metrics
from .validators import validate_layer, validate_layer_sequence

if TYPE_CHECKING:
    from fiberpath.gcode.dialects import MarlinDialect


@dataclass(slots=True)
class PlanOptions:
    verbose: bool = False
    dialect: MarlinDialect = field(default_factory=lambda: _get_default_dialect())  # noqa: E731


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


def plan_wind(definition: WindDefinition, options: PlanOptions | None = None) -> PlanResult:
    options = options or PlanOptions()
    machine = WinderMachine(
        mandrel_diameter=definition.mandrel_parameters.diameter,
        verbose_output=options.verbose,
        dialect=options.dialect,
    )

    machine.set_feed_rate(definition.default_feed_rate)
    encountered_terminal = False
    mandrel_diameter = definition.mandrel_parameters.diameter

    # (index, wind_type, terminal, pre_count, post_count) per layer; metrics are
    # computed from the recorded Moves after the loop via the single O1 model.
    layer_records: list[tuple[int, str, bool, int, int]] = []

    for index, layer in enumerate(definition.layers, start=1):
        validate_layer_sequence(index, encountered_terminal)

        current_mandrel = MandrelParameters(
            diameter=mandrel_diameter,
            windLength=definition.mandrel_parameters.wind_length,
        )

        # One validation surface over the declarative primitive; returns the
        # helical kinematics (reused by dispatch) or None for hoop/skip.
        helical_kinematics: HelicalKinematics | None = validate_layer(
            index, layer, current_mandrel, definition.tow_parameters
        )

        summary = build_layer_summary(index, len(definition.layers), layer)
        machine.insert_comment(summary)

        pre_count = len(machine.get_moves())
        dispatch_layer(
            machine,
            layer,
            current_mandrel,
            definition.tow_parameters,
            helical_kinematics=helical_kinematics,
        )
        terminal = bool(getattr(layer, "terminal", False))
        layer_records.append(
            (index, layer.wind_type, terminal, pre_count, len(machine.get_moves()))
        )
        if terminal:
            encountered_terminal = True

    moves = machine.get_moves()

    # Per-layer metrics: cumulative O1 metrics at each layer boundary, differenced.
    # (Between layers only a summary comment is recorded, which accrues no
    # time/tow, so cumulative-at-pre equals cumulative-at-previous-post.)
    layer_metrics: list[LayerMetrics] = []
    prev_time = 0.0
    prev_dist = 0.0
    for index, wind_type, terminal, pre_count, post_count in layer_records:
        cumulative = nominal_metrics(moves[:post_count], mandrel_diameter)
        layer_metrics.append(
            LayerMetrics(
                index=index,
                wind_type=wind_type,
                commands=post_count - pre_count,
                time_s=cumulative.time_s - prev_time,
                cumulative_time_s=cumulative.time_s,
                tow_m=(cumulative.distance_mm - prev_dist) / 1000.0,
                cumulative_tow_m=cumulative.distance_mm / 1000.0,
                terminal=terminal,
            )
        )
        prev_time = cumulative.time_s
        prev_dist = cumulative.distance_mm

    total = nominal_metrics(moves, mandrel_diameter)

    # The init move (all-zero rapid) is the program's first line; the header is
    # carried structurally in ProgramMeta and rendered by serialize().
    init_move = Move(
        MoveKind.RAPID,
        targets={Axis.CARRIAGE: 0.0, Axis.MANDREL: 0.0, Axis.DELIVERY_HEAD: 0.0},
    )
    meta = ProgramMeta(
        mandrel_diameter=definition.mandrel_parameters.diameter,
        wind_length=definition.mandrel_parameters.wind_length,
        tow_width=definition.tow_parameters.width,
        tow_thickness=definition.tow_parameters.thickness,
    )
    program = Program(meta=meta, moves=[init_move, *moves])
    commands = serialize(program, options.dialect)
    if options.verbose:
        commands.insert(0, "; Verbose output enabled")

    return PlanResult(
        commands=commands,
        total_time_s=total.time_s,
        total_tow_m=total.distance_mm / 1000.0,
        layers=layer_metrics,
    )
