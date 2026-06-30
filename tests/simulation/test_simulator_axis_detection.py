"""Tests for axis detection at the G-code reader boundary (feeding simulation).

Dialect auto-detection moved from the simulator into ``read_program`` (S-bnd of
#136): the reader is the single text parser, so detection/rejection happen there
and the simulator consumes the already-typed IR.
"""

from pathlib import Path

import pytest
from fiberpath.config import load_wind_definition
from fiberpath.config.schemas import WindDefinition
from fiberpath.gcode import ProgramReadError, read_program
from fiberpath.gcode.dialects import MARLIN_XAB_STANDARD, AxisMapping, MarlinDialect
from fiberpath.planning import LayerValidationError, PlanOptions, plan_wind
from fiberpath.simulation import simulate_program

REFERENCE_ROOT = Path(__file__).parents[1] / "cyclone_reference_runs"
REFERENCE_INPUTS = REFERENCE_ROOT / "inputs"
XYZ_HEADER = (
    '; Parameters {"mandrel":{"diameter":50,"windLength":500},"tow":{"width":8,"thickness":0.4}}'
)


def _reference_definition(name: str = "simple-hoop") -> WindDefinition:
    return load_wind_definition(REFERENCE_INPUTS / f"{name}.wind")


def test_detect_xab_format() -> None:
    """Verify auto-detection recognizes XAB format."""
    definition = _reference_definition("simple-hoop")
    plan_result = plan_wind(definition, PlanOptions())

    result = simulate_program(read_program(plan_result.commands))
    assert result.estimated_time_s > 0


def test_detect_xyz_program_is_rejected() -> None:
    """Verify auto-detection rejects legacy XYZ axis programs."""
    xyz_program = [
        XYZ_HEADER,
        "G0 X0 Y0 Z0",
        "G0 F6000",
        "G0 X10 Y180 Z0",
    ]

    with pytest.raises(ProgramReadError, match="unsupported XYZ axis program"):
        read_program(xyz_program)


def test_explicit_custom_dialect_can_simulate_nonstandard_program() -> None:
    """Explicit dialect bypasses auto-detection for custom compatibility use-cases."""
    xyz_program = [
        XYZ_HEADER,
        "G0 X0 Y0 Z0",
        "G0 F6000",
        "G0 X10 Y180 Z0",
    ]
    custom_xyz = MarlinDialect(
        axis_mapping=AxisMapping(carriage="X", mandrel="Y", delivery_head="Z")
    )

    result = simulate_program(read_program(xyz_program, dialect=custom_xyz))
    assert result.estimated_time_s > 0
    assert result.moves > 0


def test_auto_detect_and_explicit_xab_produce_same_results() -> None:
    """Verify explicit and detected XAB reads simulate identically."""
    definition = _reference_definition("simple-hoop")
    xab_plan = plan_wind(definition, PlanOptions())

    auto_result = simulate_program(read_program(xab_plan.commands))
    explicit_result = simulate_program(read_program(xab_plan.commands, dialect=MARLIN_XAB_STANDARD))

    assert abs(auto_result.estimated_time_s - explicit_result.estimated_time_s) < 1e-6
    assert auto_result.moves == explicit_result.moves
    assert abs(auto_result.total_distance_mm - explicit_result.total_distance_mm) < 1e-6


def test_helical_balanced_rejected_by_divisibility_validation() -> None:
    """Legacy helical-balanced fixture is invalid under strict divisibility checks."""
    definition = _reference_definition("helical-balanced")

    with pytest.raises(LayerValidationError, match="not divisible by patternNumber"):
        plan_wind(definition, PlanOptions())
