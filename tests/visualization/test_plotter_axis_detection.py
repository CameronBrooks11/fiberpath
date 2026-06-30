"""Tests for axis detection at the reader boundary (feeding the plotter).

Dialect auto-detection moved from the plotter into ``read_program`` (S-bnd of
#136): the reader is the single text parser, so detection/rejection happen there
and the plotter consumes the already-typed IR.
"""

from pathlib import Path

import pytest
from fiberpath.config import load_wind_definition
from fiberpath.config.schemas import WindDefinition
from fiberpath.gcode import ProgramReadError, read_program
from fiberpath.gcode.dialects import MARLIN_XAB_STANDARD, AxisMapping, MarlinDialect
from fiberpath.planning import LayerValidationError, PlanOptions, plan_wind
from fiberpath.visualization import render_plot

REFERENCE_ROOT = Path(__file__).parents[1] / "cyclone_reference_runs"
REFERENCE_INPUTS = REFERENCE_ROOT / "inputs"
XYZ_HEADER = (
    '; Parameters {"mandrel":{"diameter":50,"windLength":500},"tow":{"width":8,"thickness":0.4}}'
)


def _reference_definition(name: str = "simple-hoop") -> WindDefinition:
    return load_wind_definition(REFERENCE_INPUTS / f"{name}.wind")


def test_render_detects_xab_format() -> None:
    """Verify the reader auto-detects XAB format and the plotter renders it."""
    definition = _reference_definition("simple-hoop")
    plan_result = plan_wind(definition, PlanOptions())

    result = render_plot(read_program(plan_result.commands))
    assert result.image is not None


def test_render_rejects_xyz_program() -> None:
    """Verify the reader rejects legacy XYZ programs when auto-detecting."""
    xyz_program = [
        XYZ_HEADER,
        "G0 X0 Y0 Z0",
        "G0 F6000",
        "G0 X10 Y180 Z0",
    ]

    with pytest.raises(ProgramReadError, match="unsupported XYZ axis program"):
        read_program(xyz_program)


def test_render_with_explicit_custom_dialect() -> None:
    """Verify an explicit dialect lets the reader+plotter handle custom programs."""
    xyz_program = [
        XYZ_HEADER,
        "G0 X0 Y0 Z0",
        "G0 F6000",
        "G0 X10 Y180 Z0",
    ]
    custom_xyz = MarlinDialect(
        axis_mapping=AxisMapping(carriage="X", mandrel="Y", delivery_head="Z")
    )

    result = render_plot(read_program(xyz_program, dialect=custom_xyz))
    assert result.image is not None


def test_render_with_explicit_xab_dialect() -> None:
    """Verify render works with an explicitly-read XAB dialect."""
    definition = _reference_definition("simple-hoop")
    plan_result = plan_wind(definition, PlanOptions())

    result = render_plot(read_program(plan_result.commands, dialect=MARLIN_XAB_STANDARD))
    assert result.image is not None


def test_helical_balanced_rejected_by_divisibility_validation() -> None:
    """Legacy helical-balanced fixture is invalid under strict divisibility checks."""
    definition = _reference_definition("helical-balanced")

    with pytest.raises(LayerValidationError, match="not divisible by patternNumber"):
        plan_wind(definition, PlanOptions())


def test_skip_bias_rejected_by_divisibility_validation() -> None:
    """Legacy skip-bias fixture is invalid under strict divisibility checks."""
    definition = _reference_definition("skip-bias")

    with pytest.raises(LayerValidationError, match="not divisible by patternNumber"):
        plan_wind(definition, PlanOptions())
