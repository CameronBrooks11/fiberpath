"""Tests for XYZ/XAB axis mapping functionality."""

from pathlib import Path

import pytest
from fiberpath.config import load_wind_definition
from fiberpath.config.schemas import WindDefinition
from fiberpath.gcode.dialects import (
    MARLIN_XAB_STANDARD,
    MARLIN_XYZ_LEGACY,
    AxisMapping,
    MarlinDialect,
)
from fiberpath.planning import PlanOptions, plan_wind

REFERENCE_ROOT = Path(__file__).parents[1] / "cyclone_reference_runs"
REFERENCE_INPUTS = REFERENCE_ROOT / "inputs"
REFERENCE_OUTPUTS = REFERENCE_ROOT / "outputs"


def _reference_definition(name: str = "simple-hoop") -> WindDefinition:
    return load_wind_definition(REFERENCE_INPUTS / f"{name}.wind")


def _reference_output(name: str = "simple-hoop") -> list[str]:
    return (REFERENCE_OUTPUTS / name / "output.gcode").read_text().splitlines()


# Test 1: Verify XYZ format maintains Cyclone reference parity
@pytest.mark.parametrize(
    "case",
    [
        "simple-hoop",
        "helical-balanced",
        "skip-bias",
    ],
)
def test_xyz_format_maintains_cyclone_reference_parity(case: str):
    """Ensure XYZ format with MARLIN_XYZ_LEGACY still matches Cyclone output."""
    options = PlanOptions(dialect=MARLIN_XYZ_LEGACY)
    result = plan_wind(_reference_definition(case), options)
    assert result.commands == _reference_output(case)


# Test 2: Verify XAB format generates correct axis letters
def test_xab_format_generates_correct_axis_letters():
    """Verify XAB format uses A and B axes instead of Y and Z."""
    options = PlanOptions(dialect=MARLIN_XAB_STANDARD)
    result = plan_wind(_reference_definition("simple-hoop"), options)

    # Check initial command uses XAB
    init_cmd = result.commands[1]
    assert "G0 X0 A0 B0" == init_cmd, f"Expected 'G0 X0 A0 B0', got '{init_cmd}'"

    # Check subsequent move commands use A and B, not Y and Z
    move_commands = [
        cmd for cmd in result.commands[2:] if cmd.startswith("G0") and not cmd.startswith("G0 F")
    ]

    assert len(move_commands) > 0, "No move commands found"

    for cmd in move_commands:
        # Should have A or B or X
        has_valid_axis = any(axis in cmd for axis in ["A", "B", "X"])
        assert has_valid_axis, f"Command '{cmd}' missing valid axis (X/A/B)"

        # Should never have Y or Z (except in comments)
        assert "Y" not in cmd, f"Command '{cmd}' should not contain Y axis in XAB format"
        assert "Z" not in cmd, f"Command '{cmd}' should not contain Z axis in XAB format"


# Test 3: Test AxisMapping properties
def test_axis_mapping_rotational_properties():
    """Verify AxisMapping property methods correctly identify rotational axes."""
    # XYZ mapping - no rotational axes
    xyz = AxisMapping(carriage="X", mandrel="Y", delivery_head="Z")
    assert not xyz.is_rotational_mandrel
    assert not xyz.is_rotational_delivery

    # XAB mapping - mandrel and delivery are rotational
    xab = AxisMapping(carriage="X", mandrel="A", delivery_head="B")
    assert xab.is_rotational_mandrel
    assert xab.is_rotational_delivery

    # Custom mapping - only mandrel rotational
    custom1 = AxisMapping(carriage="X", mandrel="C", delivery_head="Y")
    assert custom1.is_rotational_mandrel
    assert not custom1.is_rotational_delivery

    # Another custom - only delivery rotational
    custom2 = AxisMapping(carriage="X", mandrel="Y", delivery_head="A")
    assert not custom2.is_rotational_mandrel
    assert custom2.is_rotational_delivery


# Test 4: Verify predefined dialects have correct configuration
def test_predefined_dialects_configuration():
    """Ensure predefined dialect constants have correct axis mappings."""
    # MARLIN_XYZ_LEGACY
    assert MARLIN_XYZ_LEGACY.axis_mapping.carriage == "X"
    assert MARLIN_XYZ_LEGACY.axis_mapping.mandrel == "Y"
    assert MARLIN_XYZ_LEGACY.axis_mapping.delivery_head == "Z"

    # MARLIN_XAB_STANDARD
    assert MARLIN_XAB_STANDARD.axis_mapping.carriage == "X"
    assert MARLIN_XAB_STANDARD.axis_mapping.mandrel == "A"
    assert MARLIN_XAB_STANDARD.axis_mapping.delivery_head == "B"


# Test 5: Test G92 (set_position) commands use correct axes
def test_set_position_uses_correct_axes():
    """Verify G92 commands use the correct axis letters."""
    # Simple definition that will trigger G92 commands
    definition = WindDefinition.model_validate(
        {
            "layers": [{"windType": "hoop"}],
            "mandrelParameters": {"diameter": 70.0, "windLength": 100.0},
            "towParameters": {"width": 7.0, "thickness": 0.5},
            "defaultFeedRate": 9000.0,
        }
    )

    # XYZ format
    result_xyz = plan_wind(definition, PlanOptions(dialect=MARLIN_XYZ_LEGACY))
    g92_xyz = [cmd for cmd in result_xyz.commands if cmd.startswith("G92")]
    if g92_xyz:  # If any G92 commands present
        for cmd in g92_xyz:
            # Should have Y and/or Z in XYZ format
            has_xyz = "X" in cmd or "Y" in cmd or "Z" in cmd
            assert has_xyz, f"G92 command '{cmd}' should use X/Y/Z axes"

    # XAB format
    result_xab = plan_wind(definition, PlanOptions(dialect=MARLIN_XAB_STANDARD))
    g92_xab = [cmd for cmd in result_xab.commands if cmd.startswith("G92")]
    if g92_xab:  # If any G92 commands present
        for cmd in g92_xab:
            # Should have A and/or B in XAB format
            has_xab = "X" in cmd or "A" in cmd or "B" in cmd
            assert has_xab, f"G92 command '{cmd}' should use X/A/B axes"
            # Should not have Y or Z
            assert "Y" not in cmd, f"G92 command '{cmd}' should not use Y in XAB format"
            assert "Z" not in cmd, f"G92 command '{cmd}' should not use Z in XAB format"


# Test 6: Test both formats produce same number of commands
def test_both_formats_produce_same_command_count():
    """Verify XYZ and XAB formats produce the same number of commands."""
    definition = _reference_definition("simple-hoop")

    result_xyz = plan_wind(definition, PlanOptions(dialect=MARLIN_XYZ_LEGACY))
    result_xab = plan_wind(definition, PlanOptions(dialect=MARLIN_XAB_STANDARD))

    assert len(result_xyz.commands) == len(result_xab.commands), (
        "XYZ and XAB should produce same number of commands"
    )


# Test 7: Test both formats produce same time and tow metrics
def test_both_formats_produce_same_metrics():
    """Verify planning metrics are identical regardless of axis format."""
    definition = _reference_definition("helical-balanced")

    result_xyz = plan_wind(definition, PlanOptions(dialect=MARLIN_XYZ_LEGACY))
    result_xab = plan_wind(definition, PlanOptions(dialect=MARLIN_XAB_STANDARD))

    # Time should be identical
    assert abs(result_xyz.total_time_s - result_xab.total_time_s) < 1e-6, (
        "Total time should be identical"
    )

    # Tow usage should be identical
    assert abs(result_xyz.total_tow_m - result_xab.total_tow_m) < 1e-6, (
        "Total tow usage should be identical"
    )

    # Layer metrics should match
    assert len(result_xyz.layers) == len(result_xab.layers), "Layer count should match"

    for layer_xyz, layer_xab in zip(result_xyz.layers, result_xab.layers, strict=True):
        assert layer_xyz.commands == layer_xab.commands, (
            f"Layer {layer_xyz.index} command count mismatch"
        )
        assert abs(layer_xyz.time_s - layer_xab.time_s) < 1e-6, (
            f"Layer {layer_xyz.index} time mismatch"
        )
        assert abs(layer_xyz.tow_m - layer_xab.tow_m) < 1e-6, (
            f"Layer {layer_xyz.index} tow usage mismatch"
        )


# Test 8: Test custom axis mapping
def test_custom_axis_mapping():
    """Verify custom axis mappings work correctly."""
    # Create a custom dialect with unusual mapping
    custom_dialect = MarlinDialect(
        axis_mapping=AxisMapping(carriage="X", mandrel="C", delivery_head="A")
    )

    definition = WindDefinition.model_validate(
        {
            "layers": [{"windType": "hoop"}],
            "mandrelParameters": {"diameter": 70.0, "windLength": 100.0},
            "towParameters": {"width": 7.0, "thickness": 0.5},
            "defaultFeedRate": 9000.0,
        }
    )

    result = plan_wind(definition, PlanOptions(dialect=custom_dialect))

    # Check initial command uses custom mapping
    init_cmd = result.commands[1]
    assert "G0 X0 C0 A0" == init_cmd, f"Expected custom axes, got '{init_cmd}'"

    # Check that C and A appear in move commands
    move_commands = [
        cmd for cmd in result.commands[2:] if cmd.startswith("G0") and not cmd.startswith("G0 F")
    ]

    for cmd in move_commands:
        # Should use our custom axes
        has_custom = any(axis in cmd for axis in ["X", "C", "A"])
        assert has_custom, f"Command should use custom axes: {cmd}"


# Test 9: Test default dialect is XYZ_LEGACY
def test_default_dialect_is_xyz_legacy():
    """Verify that not specifying a dialect defaults to XAB_STANDARD."""
    definition = _reference_definition("simple-hoop")

    # Plan with default options (no dialect specified)
    result_default = plan_wind(definition)

    # Plan with explicit XAB_STANDARD
    result_xab = plan_wind(definition, PlanOptions(dialect=MARLIN_XAB_STANDARD))

    # Should be identical
    assert result_default.commands == result_xab.commands, "Default should be XAB_STANDARD"


# Test 10: Test verbose mode works with both dialects
def test_verbose_mode_with_both_dialects():
    """Verify verbose mode produces comments with both dialects."""
    definition = WindDefinition.model_validate(
        {
            "layers": [{"windType": "hoop"}],
            "mandrelParameters": {"diameter": 70.0, "windLength": 100.0},
            "towParameters": {"width": 7.0, "thickness": 0.5},
            "defaultFeedRate": 9000.0,
        }
    )

    # XYZ verbose
    result_xyz = plan_wind(definition, PlanOptions(verbose=True, dialect=MARLIN_XYZ_LEGACY))
    comments_xyz = [cmd for cmd in result_xyz.commands if cmd.startswith(";")]
    assert len(comments_xyz) > 0, "Verbose mode should produce comments"

    # XAB verbose
    result_xab = plan_wind(definition, PlanOptions(verbose=True, dialect=MARLIN_XAB_STANDARD))
    comments_xab = [cmd for cmd in result_xab.commands if cmd.startswith(";")]
    assert len(comments_xab) > 0, "Verbose mode should produce comments"

    # Comment count should be same
    assert len(comments_xyz) == len(comments_xab), (
        "Both formats should produce same number of comments in verbose mode"
    )
