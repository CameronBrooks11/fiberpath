from pathlib import Path

import pytest

from fiberpath.config import load_wind_definition
from fiberpath.config.schemas import WindDefinition
from fiberpath.planning import LayerValidationError, plan_wind

REFERENCE_ROOT = Path(__file__).parents[1] / "cyclone_reference_runs"
REFERENCE_INPUTS = REFERENCE_ROOT / "inputs"
REFERENCE_OUTPUTS = REFERENCE_ROOT / "outputs"


def _reference_definition(name: str = "simple-hoop") -> WindDefinition:
    return load_wind_definition(REFERENCE_INPUTS / f"{name}.wind")


def _reference_output(name: str = "simple-hoop") -> list[str]:
    return (REFERENCE_OUTPUTS / name / "output.gcode").read_text().splitlines()


def test_plan_wind_returns_commands():
    result = plan_wind(_reference_definition())

    assert result.commands[0].startswith("; Parameters")
    assert result.total_time_s > 0
    assert result.layers[0].commands > 0
    assert result.commands[-1] == _reference_output()[-1]


@pytest.mark.parametrize(
    "case",
    [
        "simple-hoop",
        "helical-balanced",
        "skip-bias",
    ],
)
def test_plan_wind_matches_cyclone_reference(case: str):
    result = plan_wind(_reference_definition(case))
    assert result.commands == _reference_output(case)


def test_plan_wind_rejects_layers_after_terminal():
    definition = WindDefinition.model_validate(
        {
            "layers": [
                {"windType": "hoop", "terminal": True},
                {"windType": "skip", "mandrelRotation": 30.0},
            ],
            "mandrelParameters": {"diameter": 70.0, "windLength": 100.0},
            "towParameters": {"width": 7.0, "thickness": 0.5},
            "defaultFeedRate": 9000.0,
        }
    )

    with pytest.raises(LayerValidationError):
        plan_wind(definition)


def test_plan_wind_rejects_invalid_skip_index():
    definition = WindDefinition.model_validate(
        {
            "layers": [
                {
                    "windType": "helical",
                    "windAngle": 35.0,
                    "patternNumber": 4,
                    "skipIndex": 2,
                    "lockDegrees": 180.0,
                    "leadInMM": 5.0,
                    "leadOutDegrees": 15.0,
                }
            ],
            "mandrelParameters": {"diameter": 70.0, "windLength": 100.0},
            "towParameters": {"width": 7.0, "thickness": 0.5},
            "defaultFeedRate": 9000.0,
        }
    )

    with pytest.raises(LayerValidationError):
        plan_wind(definition)
