"""Integration tests for XAB-only plan command behavior."""

from __future__ import annotations

import json
import re
from pathlib import Path

from fiberpath_cli.main import app
from typer.testing import CliRunner

ROOT = Path(__file__).resolve().parents[1]
EXAMPLES = ROOT.parent / "examples"
SIMPLE_WIND = EXAMPLES / "simple_cylinder" / "input.wind"


def test_plan_json_output_fields(tmp_path: Path) -> None:
    """JSON output should include planning metrics without axis format metadata."""
    runner = CliRunner()
    output_file = tmp_path / "out.gcode"

    result = runner.invoke(
        app,
        ["plan", str(SIMPLE_WIND), "--output", str(output_file), "--json"],
    )

    assert result.exit_code == 0, result.output
    payload = json.loads(result.stdout)

    assert payload["output"] == str(output_file)
    assert payload["commands"] > 0
    assert payload["timeSeconds"] > 0
    assert payload["towMeters"] > 0
    assert "axisFormat" not in payload


def test_plan_rejects_removed_axis_format_flag(tmp_path: Path) -> None:
    """CLI should reject the removed --axis-format flag."""
    runner = CliRunner()
    output_file = tmp_path / "out.gcode"

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

    assert result.exit_code != 0
    assert "No such option" in result.output


def test_gcode_contains_rotational_axes(tmp_path: Path) -> None:
    """Generated G-code should use rotational A/B axes."""
    runner = CliRunner()
    output_file = tmp_path / "xab_test.gcode"

    result = runner.invoke(
        app,
        [
            "plan",
            str(SIMPLE_WIND),
            "--output",
            str(output_file),
        ],
    )

    assert result.exit_code == 0, result.output
    gcode = output_file.read_text(encoding="utf-8")

    assert re.search(r"G[01].*\sA[\d\.-]+", gcode)
    assert re.search(r"G[01].*\sB[\d\.-]+", gcode)

    move_lines = [
        line
        for line in gcode.split("\n")
        if line.strip().startswith("G0") or line.strip().startswith("G1")
    ]
    for line in move_lines:
        if not line.startswith(";"):
            assert " Y" not in line
            assert " Z" not in line
