"""Tests for JSON export utilities."""

from __future__ import annotations

import json
from pathlib import Path

from fiberpath.visualization.export_json import gcode_to_json


def test_gcode_to_json_creates_valid_json(tmp_path: Path) -> None:
    """Verify that gcode_to_json writes valid JSON with command array."""
    commands = ["G0 X10", "G1 Y20 F1000", "; comment", "G0 Z5"]
    output = tmp_path / "output.json"

    result = gcode_to_json(commands, output)

    assert result == output
    assert output.exists()

    data = json.loads(output.read_text(encoding="utf-8"))
    assert "commands" in data
    assert data["commands"] == ["G0 X10", "G1 Y20 F1000", "; comment", "G0 Z5"]


def test_gcode_to_json_strips_whitespace(tmp_path: Path) -> None:
    """Verify that gcode_to_json strips leading/trailing whitespace."""
    commands = ["  G0 X10  ", "\tG1 Y20\n", ""]
    output = tmp_path / "stripped.json"

    gcode_to_json(commands, output)

    data = json.loads(output.read_text(encoding="utf-8"))
    # Empty lines and pure whitespace should be filtered
    assert data["commands"] == ["G0 X10", "G1 Y20"]


def test_gcode_to_json_handles_empty_input(tmp_path: Path) -> None:
    """Verify that gcode_to_json handles empty command lists."""
    commands: list[str] = []
    output = tmp_path / "empty.json"

    gcode_to_json(commands, output)

    data = json.loads(output.read_text(encoding="utf-8"))
    assert data["commands"] == []


def test_gcode_to_json_uses_indent(tmp_path: Path) -> None:
    """Verify that output JSON is pretty-printed with indentation."""
    commands = ["G0 X10", "G0 Y20"]
    output = tmp_path / "indented.json"

    gcode_to_json(commands, output)

    content = output.read_text(encoding="utf-8")
    # Should have newlines and indentation
    assert "\n" in content
    assert "  " in content  # 2-space indent from json.dumps(indent=2)
