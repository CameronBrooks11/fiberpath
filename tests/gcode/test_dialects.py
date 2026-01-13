"""Tests for G-code dialect configurations."""

from __future__ import annotations

from fiberpath.gcode.dialects import (
    MARLIN_XAB_STANDARD,
    MARLIN_XYZ_LEGACY,
    AxisMapping,
    MarlinDialect,
)


def test_axis_mapping_defaults() -> None:
    """Verify AxisMapping default axis assignments."""
    mapping = AxisMapping()
    assert mapping.carriage == "X"
    assert mapping.mandrel == "Y"
    assert mapping.delivery_head == "Z"


def test_axis_mapping_rotational_detection() -> None:
    """Verify rotational axis detection for XAB format."""
    xyz_mapping = AxisMapping(carriage="X", mandrel="Y", delivery_head="Z")
    assert not xyz_mapping.is_rotational_mandrel
    assert not xyz_mapping.is_rotational_delivery

    xab_mapping = AxisMapping(carriage="X", mandrel="A", delivery_head="B")
    assert xab_mapping.is_rotational_mandrel
    assert xab_mapping.is_rotational_delivery


def test_marlin_dialect_predefined_xyz() -> None:
    """Verify MARLIN_XYZ_LEGACY dialect configuration."""
    assert MARLIN_XYZ_LEGACY.axis_mapping.carriage == "X"
    assert MARLIN_XYZ_LEGACY.axis_mapping.mandrel == "Y"
    assert MARLIN_XYZ_LEGACY.axis_mapping.delivery_head == "Z"
    assert not MARLIN_XYZ_LEGACY.axis_mapping.is_rotational_mandrel
    assert not MARLIN_XYZ_LEGACY.axis_mapping.is_rotational_delivery


def test_marlin_dialect_predefined_xab() -> None:
    """Verify MARLIN_XAB_STANDARD dialect configuration."""
    assert MARLIN_XAB_STANDARD.axis_mapping.carriage == "X"
    assert MARLIN_XAB_STANDARD.axis_mapping.mandrel == "A"
    assert MARLIN_XAB_STANDARD.axis_mapping.delivery_head == "B"
    assert MARLIN_XAB_STANDARD.axis_mapping.is_rotational_mandrel
    assert MARLIN_XAB_STANDARD.axis_mapping.is_rotational_delivery


def test_custom_marlin_dialect() -> None:
    """Verify that custom MarlinDialect instances can be created."""
    custom_axes = AxisMapping(carriage="X", mandrel="C", delivery_head="A")
    custom_dialect = MarlinDialect(axis_mapping=custom_axes)

    assert custom_dialect.axis_mapping.mandrel == "C"
    assert custom_dialect.axis_mapping.is_rotational_mandrel  # C is rotational


def test_marlin_dialect_prologue() -> None:
    """Verify that MarlinDialect generates correct prologue commands."""
    dialect = MarlinDialect()
    prologue = dialect.prologue()

    assert "G21" in prologue  # Millimeters
    assert "G94" in prologue  # Units per minute feed mode
