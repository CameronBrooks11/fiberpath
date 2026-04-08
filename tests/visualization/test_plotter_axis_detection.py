"""Tests for axis detection behavior in visualization."""

from pathlib import Path

import pytest
from fiberpath.config import load_wind_definition
from fiberpath.config.schemas import WindDefinition
from fiberpath.gcode.dialects import MARLIN_XAB_STANDARD, AxisMapping, MarlinDialect
from fiberpath.planning import LayerValidationError, PlanOptions, plan_wind
from fiberpath.visualization import PlotError, render_plot

REFERENCE_ROOT = Path(__file__).parents[1] / "cyclone_reference_runs"
REFERENCE_INPUTS = REFERENCE_ROOT / "inputs"
XYZ_HEADER = (
    '; Parameters {"mandrel":{"diameter":50,"windLength":500},"tow":{"width":8,"thickness":0.4}}'
)


def _reference_definition(name: str = "simple-hoop") -> WindDefinition:
    return load_wind_definition(REFERENCE_INPUTS / f"{name}.wind")


def test_render_detects_xab_format() -> None:
    """Verify render_plot auto-detects XAB format."""
    definition = _reference_definition("simple-hoop")
    plan_result = plan_wind(definition, PlanOptions(dialect=MARLIN_XAB_STANDARD))

    result = render_plot(plan_result.commands)
    assert result.image is not None


def test_render_rejects_xyz_program() -> None:
    """Verify render_plot rejects legacy XYZ programs when auto-detecting."""
    xyz_program = [
        XYZ_HEADER,
        "G0 X0 Y0 Z0",
        "G0 F6000",
        "G0 X10 Y180 Z0",
    ]

    with pytest.raises(PlotError, match="unsupported XYZ axis program"):
        render_plot(xyz_program)


def test_render_with_explicit_custom_dialect() -> None:
    """Verify explicit dialect allows plotting custom non-XAB programs."""
    xyz_program = [
        XYZ_HEADER,
        "G0 X0 Y0 Z0",
        "G0 F6000",
        "G0 X10 Y180 Z0",
    ]
    custom_xyz = MarlinDialect(
        axis_mapping=AxisMapping(carriage="X", mandrel="Y", delivery_head="Z")
    )

    result = render_plot(xyz_program, dialect=custom_xyz)
    assert result.image is not None


def test_render_with_explicit_xab_dialect() -> None:
    """Verify render works with explicit XAB dialect."""
    definition = _reference_definition("simple-hoop")
    plan_result = plan_wind(definition, PlanOptions(dialect=MARLIN_XAB_STANDARD))

    result = render_plot(plan_result.commands, dialect=MARLIN_XAB_STANDARD)
    assert result.image is not None


def test_helical_balanced_rejected_by_divisibility_validation() -> None:
    """Legacy helical-balanced fixture is invalid under strict divisibility checks."""
    definition = _reference_definition("helical-balanced")

    with pytest.raises(LayerValidationError, match="not divisible by patternNumber"):
        plan_wind(definition, PlanOptions(dialect=MARLIN_XAB_STANDARD))


def test_skip_bias_rejected_by_divisibility_validation() -> None:
    """Legacy skip-bias fixture is invalid under strict divisibility checks."""
    definition = _reference_definition("skip-bias")

    with pytest.raises(LayerValidationError, match="not divisible by patternNumber"):
        plan_wind(definition, PlanOptions(dialect=MARLIN_XAB_STANDARD))
