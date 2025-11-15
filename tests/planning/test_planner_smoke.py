from fiberpath.config.schemas import WindDefinition
from fiberpath.planning import plan_wind


def test_plan_wind_returns_commands():
    definition = WindDefinition.model_validate(
        {
            "layers": [
                {"windType": "hoop", "terminal": False},
            ],
            "mandrelParameters": {"diameter": 70.0, "windLength": 100.0},
            "towParameters": {"width": 7.0, "thickness": 0.5},
            "defaultFeedRate": 9000.0,
        }
    )

    commands = plan_wind(definition)

    assert commands[0].startswith("; Parameters")
    assert commands[-1].startswith("M2")
