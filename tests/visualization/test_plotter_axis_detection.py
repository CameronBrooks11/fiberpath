"""Tests for axis format auto-detection in visualization."""

from pathlib import Path

from fiberpath.config import load_wind_definition
from fiberpath.config.schemas import WindDefinition
from fiberpath.gcode.dialects import MARLIN_XAB_STANDARD, MARLIN_XYZ_LEGACY
from fiberpath.planning import PlanOptions, plan_wind
from fiberpath.visualization import render_plot

REFERENCE_ROOT = Path(__file__).parents[1] / "cyclone_reference_runs"
REFERENCE_INPUTS = REFERENCE_ROOT / "inputs"


def _reference_definition(name: str = "simple-hoop") -> WindDefinition:
    return load_wind_definition(REFERENCE_INPUTS / f"{name}.wind")


def test_render_detects_xyz_format() -> None:
    """Verify render_plot auto-detects XYZ format."""
    definition = _reference_definition("simple-hoop")
    plan_result = plan_wind(definition, PlanOptions(dialect=MARLIN_XYZ_LEGACY))

    # Should auto-detect and render without error
    result = render_plot(plan_result.commands)
    assert result is not None
    assert result.image is not None


def test_render_detects_xab_format() -> None:
    """Verify render_plot auto-detects XAB format."""
    definition = _reference_definition("simple-hoop")
    plan_result = plan_wind(definition, PlanOptions(dialect=MARLIN_XAB_STANDARD))

    # Should auto-detect and render without error
    result = render_plot(plan_result.commands)
    assert result is not None
    assert result.image is not None


def test_render_with_explicit_xyz_dialect() -> None:
    """Verify render works with explicit XYZ dialect."""
    definition = _reference_definition("simple-hoop")
    plan_result = plan_wind(definition, PlanOptions(dialect=MARLIN_XYZ_LEGACY))

    result = render_plot(plan_result.commands, dialect=MARLIN_XYZ_LEGACY)
    assert result is not None
    assert result.image is not None


def test_render_with_explicit_xab_dialect() -> None:
    """Verify render works with explicit XAB dialect."""
    definition = _reference_definition("simple-hoop")
    plan_result = plan_wind(definition, PlanOptions(dialect=MARLIN_XAB_STANDARD))

    result = render_plot(plan_result.commands, dialect=MARLIN_XAB_STANDARD)
    assert result is not None
    assert result.image is not None


def test_xyz_and_xab_both_render_successfully() -> None:
    """Verify both XYZ and XAB formats render successfully."""
    definition = _reference_definition("simple-hoop")

    # Generate with XYZ
    xyz_plan = plan_wind(definition, PlanOptions(dialect=MARLIN_XYZ_LEGACY))
    result_xyz = render_plot(xyz_plan.commands)
    assert result_xyz is not None
    assert result_xyz.image is not None

    # Generate with XAB
    xab_plan = plan_wind(definition, PlanOptions(dialect=MARLIN_XAB_STANDARD))
    result_xab = render_plot(xab_plan.commands)
    assert result_xab is not None
    assert result_xab.image is not None


def test_helical_balanced_renders_with_both_formats() -> None:
    """Verify more complex wind patterns render with both formats."""
    definition = _reference_definition("helical-balanced")

    # XYZ format
    xyz_plan = plan_wind(definition, PlanOptions(dialect=MARLIN_XYZ_LEGACY))
    result_xyz = render_plot(xyz_plan.commands)
    assert result_xyz is not None
    assert result_xyz.image is not None

    # XAB format
    xab_plan = plan_wind(definition, PlanOptions(dialect=MARLIN_XAB_STANDARD))
    result_xab = render_plot(xab_plan.commands)
    assert result_xab is not None
    assert result_xab.image is not None


def test_skip_bias_renders_with_both_formats() -> None:
    """Verify skip-bias pattern renders with both formats."""
    definition = _reference_definition("skip-bias")

    # XYZ format
    xyz_plan = plan_wind(definition, PlanOptions(dialect=MARLIN_XYZ_LEGACY))
    result_xyz = render_plot(xyz_plan.commands)
    assert result_xyz is not None
    assert result_xyz.image is not None

    # XAB format
    xab_plan = plan_wind(definition, PlanOptions(dialect=MARLIN_XAB_STANDARD))
    result_xab = render_plot(xab_plan.commands)
    assert result_xab is not None
    assert result_xab.image is not None
