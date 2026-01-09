from __future__ import annotations

from pathlib import Path

from typer.testing import CliRunner

from fiberpath_cli.main import app


def test_stream_command_dry_run(tmp_path: Path) -> None:
    gcode_file = tmp_path / "test.gcode"
    gcode_file.write_text("; header\nG0 X1\n", encoding="utf-8")

    runner = CliRunner()
    result = runner.invoke(app, ["stream", str(gcode_file), "--dry-run"])

    assert result.exit_code == 0
    assert "Dry-run" in result.output
