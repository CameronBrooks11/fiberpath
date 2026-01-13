"""Tests for config validator utilities."""

from __future__ import annotations

from pathlib import Path

import pytest
from fiberpath.config.validator import WindFileError, load_wind_definition


def test_load_wind_definition_nonexistent_file() -> None:
    """Verify that loading a nonexistent .wind file raises WindFileError."""
    with pytest.raises(WindFileError, match="No wind definition found"):
        load_wind_definition("nonexistent.wind")


def test_load_wind_definition_invalid_json(tmp_path: Path) -> None:
    """Verify that malformed JSON in .wind file raises WindFileError."""
    bad_json = tmp_path / "bad.wind"
    bad_json.write_text("{not valid json", encoding="utf-8")

    with pytest.raises(WindFileError, match="Invalid JSON"):
        load_wind_definition(bad_json)


def test_load_wind_definition_invalid_schema(tmp_path: Path) -> None:
    """Verify that JSON not matching WindDefinition schema raises WindFileError."""
    bad_schema = tmp_path / "bad_schema.wind"
    bad_schema.write_text('{"invalid": "schema"}', encoding="utf-8")

    with pytest.raises(WindFileError, match="failed validation"):
        load_wind_definition(bad_schema)


def test_load_wind_definition_valid_file(tmp_path: Path) -> None:
    """Verify that a valid .wind file loads successfully."""
    valid_wind = tmp_path / "valid.wind"
    valid_wind.write_text(
        """
{
  "mandrelParameters": {"diameter": 100.0, "windLength": 500.0},
  "towParameters": {"width": 3.0, "thickness": 0.2},
  "defaultFeedRate": 1000.0,
  "layers": [
    {"windType": "hoop", "terminal": false}
  ]
}
""",
        encoding="utf-8",
    )

    definition = load_wind_definition(valid_wind)
    assert definition.mandrel_parameters.diameter == 100.0
    assert definition.mandrel_parameters.wind_length == 500.0
    assert len(definition.layers) == 1
