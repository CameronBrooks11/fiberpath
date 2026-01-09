"""Integration tests for axis format selection in plan command."""

from __future__ import annotations

import json
import re
from pathlib import Path

from fiberpath_cli.main import app
from typer.testing import CliRunner

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT.parent / "examples"
SIMPLE_WIND = EXAMPLES / "simple_cylinder" / "input.wind"


def test_plan_xab_format_json(tmp_path: Path) -> None:
    """Test that XAB format is properly reported in JSON output."""
    runner = CliRunner()
    output_file = tmp_path / "out_xab.gcode"

    result = runner.invoke(
        app,
        [
            "plan",
            str(SIMPLE_WIND),
            "--output",
            str(output_file),
            "--axis-format",
            "xab",
            "--json",
        ],
    )

    assert result.exit_code == 0, result.output
    payload = json.loads(result.stdout)
    assert payload["axisFormat"] == "xab"
    assert payload["output"] == str(output_file)
    assert payload["commands"] > 0


def test_plan_xyz_format_json(tmp_path: Path) -> None:
    """Test that XYZ format is properly reported in JSON output."""
    runner = CliRunner()
    output_file = tmp_path / "out_xyz.gcode"

    result = runner.invoke(
        app,
        [
            "plan",
            str(SIMPLE_WIND),
            "--output",
            str(output_file),
            "--axis-format",
            "xyz",
            "--json",
        ],
    )

    assert result.exit_code == 0, result.output
    payload = json.loads(result.stdout)
    assert payload["axisFormat"] == "xyz"
    assert payload["output"] == str(output_file)
    assert payload["commands"] > 0


def test_plan_default_format_is_xab(tmp_path: Path) -> None:
    """Test that default axis format is XAB when not specified."""
    runner = CliRunner()
    output_file = tmp_path / "out_default.gcode"

    result = runner.invoke(
        app,
        ["plan", str(SIMPLE_WIND), "--output", str(output_file), "--json"],
    )

    assert result.exit_code == 0, result.output
    payload = json.loads(result.stdout)
    assert payload["axisFormat"] == "xab"


def test_xab_gcode_contains_rotational_axes(tmp_path: Path) -> None:
    """Test that XAB format produces G-code with A and B rotational axes."""
    runner = CliRunner()
    output_file = tmp_path / "xab_test.gcode"

    result = runner.invoke(
        app,
        [
            "plan",
            str(SIMPLE_WIND),
            "--output",
            str(output_file),
            "--axis-format",
            "xab",
        ],
    )

    assert result.exit_code == 0, result.output
    gcode = output_file.read_text(encoding="utf-8")

    # Check that G-code contains A and B axes (rotational)
    assert re.search(
        r"G[01].*\sA[\d\.-]+", gcode
    ), "XAB format should contain A axis moves"
    assert re.search(
        r"G[01].*\sB[\d\.-]+", gcode
    ), "XAB format should contain B axis moves"

    # Check that G-code does NOT contain Y or Z axes in move commands
    # (they might appear in comments but not in actual move commands)
    move_lines = [
        line
        for line in gcode.split("\n")
        if line.strip().startswith("G0") or line.strip().startswith("G1")
    ]
    for line in move_lines:
        if not line.startswith(";"):  # Ignore comments
            assert (
                " Y" not in line
            ), f"XAB format should not contain Y axis in moves: {line}"
            assert (
                " Z" not in line
            ), f"XAB format should not contain Z axis in moves: {line}"


def test_xyz_gcode_contains_linear_axes(tmp_path: Path) -> None:
    """Test that XYZ format produces G-code with Y and Z linear axes (legacy mode)."""
    runner = CliRunner()
    output_file = tmp_path / "xyz_test.gcode"

    result = runner.invoke(
        app,
        [
            "plan",
            str(SIMPLE_WIND),
            "--output",
            str(output_file),
            "--axis-format",
            "xyz",
        ],
    )

    assert result.exit_code == 0, result.output
    gcode = output_file.read_text(encoding="utf-8")

    # Check that G-code contains Y and Z axes (legacy linear)
    assert re.search(
        r"G[01].*\sY[\d\.-]+", gcode
    ), "XYZ format should contain Y axis moves"
    assert re.search(
        r"G[01].*\sZ[\d\.-]+", gcode
    ), "XYZ format should contain Z axis moves"

    # Check that G-code does NOT contain A or B axes in move commands
    move_lines = [
        line
        for line in gcode.split("\n")
        if line.strip().startswith("G0") or line.strip().startswith("G1")
    ]
    for line in move_lines:
        if not line.startswith(";"):  # Ignore comments
            assert (
                " A" not in line
            ), f"XYZ format should not contain A axis in moves: {line}"
            assert (
                " B" not in line
            ), f"XYZ format should not contain B axis in moves: {line}"


def test_both_formats_produce_same_metrics(tmp_path: Path) -> None:
    """Test that XAB and XYZ formats produce identical planning metrics (just diff axis letters)."""
    runner = CliRunner()
    output_xab = tmp_path / "compare_xab.gcode"
    output_xyz = tmp_path / "compare_xyz.gcode"

    result_xab = runner.invoke(
        app,
        [
            "plan",
            str(SIMPLE_WIND),
            "--output",
            str(output_xab),
            "--axis-format",
            "xab",
            "--json",
        ],
    )
    result_xyz = runner.invoke(
        app,
        [
            "plan",
            str(SIMPLE_WIND),
            "--output",
            str(output_xyz),
            "--axis-format",
            "xyz",
            "--json",
        ],
    )

    assert result_xab.exit_code == 0, result_xab.output
    assert result_xyz.exit_code == 0, result_xyz.output

    payload_xab = json.loads(result_xab.stdout)
    payload_xyz = json.loads(result_xyz.stdout)

    # Both should have same number of commands
    assert payload_xab["commands"] == payload_xyz["commands"]

    # Both should have same time and tow usage
    assert payload_xab["timeSeconds"] == payload_xyz["timeSeconds"]
    assert payload_xab["towMeters"] == payload_xyz["towMeters"]

    # Both should have same layer structure
    assert len(payload_xab["layers"]) == len(payload_xyz["layers"])
