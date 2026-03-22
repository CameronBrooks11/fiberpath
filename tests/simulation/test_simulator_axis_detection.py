"""Tests for axis format auto-detection in simulation."""

from pathlib import Path

import pytest
from fiberpath.config import load_wind_definition
from fiberpath.config.schemas import WindDefinition
from fiberpath.gcode.dialects import MARLIN_XAB_STANDARD, MARLIN_XYZ_LEGACY
from fiberpath.planning import LayerValidationError, PlanOptions, plan_wind
from fiberpath.simulation import simulate_program

REFERENCE_ROOT = Path(__file__).parents[1] / "cyclone_reference_runs"
REFERENCE_INPUTS = REFERENCE_ROOT / "inputs"


def _reference_definition(name: str = "simple-hoop") -> WindDefinition:
    return load_wind_definition(REFERENCE_INPUTS / f"{name}.wind")


def test_detect_xyz_format() -> None:
    """Verify auto-detection recognizes XYZ format."""
    # Generate actual G-code with XYZ format
    definition = _reference_definition("simple-hoop")
    plan_result = plan_wind(definition, PlanOptions(dialect=MARLIN_XYZ_LEGACY))

    # Simulate without explicit dialect - should auto-detect XYZ
    result = simulate_program(plan_result.commands)

    # Should complete successfully
    assert result.estimated_time_s > 0


def test_detect_xab_format() -> None:
    """Verify auto-detection recognizes XAB format."""
    # Generate actual G-code with XAB format
    definition = _reference_definition("simple-hoop")
    plan_result = plan_wind(definition, PlanOptions(dialect=MARLIN_XAB_STANDARD))

    # Simulate without explicit dialect - should auto-detect XAB
    result = simulate_program(plan_result.commands)

    # Should complete successfully with A/B axes
    assert result.estimated_time_s > 0


def test_explicit_dialect_overrides_detection() -> None:
    """Verify explicit dialect parameter overrides auto-detection."""
    # Generate XAB G-code
    definition = _reference_definition("simple-hoop")
    plan_result = plan_wind(definition, PlanOptions(dialect=MARLIN_XAB_STANDARD))

    # Force XYZ interpretation (should still work with auto-detection)
    result = simulate_program(plan_result.commands, dialect=MARLIN_XYZ_LEGACY)

    # Should complete
    assert result.estimated_time_s > 0


def test_xyz_and_xab_produce_same_simulation_results() -> None:
    """Verify XYZ and XAB formats produce identical simulation metrics."""
    definition = _reference_definition("simple-hoop")

    # Generate and simulate with XYZ
    xyz_plan = plan_wind(definition, PlanOptions(dialect=MARLIN_XYZ_LEGACY))
    xyz_sim = simulate_program(xyz_plan.commands)

    # Generate and simulate with XAB
    xab_plan = plan_wind(definition, PlanOptions(dialect=MARLIN_XAB_STANDARD))
    xab_sim = simulate_program(xab_plan.commands)

    # Times should be identical
    assert abs(xyz_sim.estimated_time_s - xab_sim.estimated_time_s) < 1e-6

    # Moves count should be identical
    assert xyz_sim.moves == xab_sim.moves

    # Total distance should be identical
    assert abs(xyz_sim.total_distance_mm - xab_sim.total_distance_mm) < 1e-6


def test_helical_balanced_rejected_by_divisibility_validation() -> None:
    """Legacy helical-balanced fixture is invalid under strict divisibility checks."""
    definition = _reference_definition("helical-balanced")

    with pytest.raises(LayerValidationError, match="not divisible by patternNumber"):
        plan_wind(definition, PlanOptions(dialect=MARLIN_XYZ_LEGACY))

    with pytest.raises(LayerValidationError, match="not divisible by patternNumber"):
        plan_wind(definition, PlanOptions(dialect=MARLIN_XAB_STANDARD))
