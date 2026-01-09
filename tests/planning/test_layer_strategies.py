from __future__ import annotations

from pathlib import Path

from fiberpath.config.schemas import (
    HelicalLayer,
    HoopLayer,
    MandrelParameters,
    SkipLayer,
    TowParameters,
)
from fiberpath.planning.layer_strategies import (
    plan_helical_layer,
    plan_hoop_layer,
    plan_skip_layer,
)
from fiberpath.planning.machine import WinderMachine

FIXTURE_DIR = Path(__file__).parent / "fixtures"


def _machine(diameter: float = 50.0) -> WinderMachine:
    machine = WinderMachine(diameter)
    machine.set_feed_rate(9000.0)
    return machine


def _mandrel(diameter: float = 50.0) -> MandrelParameters:
    return MandrelParameters.model_validate({"diameter": diameter, "windLength": 120.0})


def _tow() -> TowParameters:
    return TowParameters.model_validate({"width": 6.0, "thickness": 0.5})


def _load_fixture(name: str) -> list[str]:
    return (FIXTURE_DIR / name).read_text().splitlines()


def test_plan_hoop_layer_matches_fixture() -> None:
    machine = _machine()
    plan_hoop_layer(
        machine,
        HoopLayer(terminal=False),
        _mandrel(),
        _tow(),
    )

    assert machine.get_gcode() == _load_fixture("hoop_layer.gcode")


def test_plan_helical_layer_matches_fixture() -> None:
    machine = _machine(40.0)
    plan_helical_layer(
        machine,
        HelicalLayer.model_validate(
            {
                "windAngle": 35.0,
                "patternNumber": 3,
                "skipIndex": 2,
                "lockDegrees": 160.0,
                "leadInMM": 4.0,
                "leadOutDegrees": 12.0,
            }
        ),
        _mandrel(40.0),
        _tow(),
    )

    assert machine.get_gcode() == _load_fixture("helical_layer.gcode")


def test_plan_skip_layer_matches_fixture() -> None:
    machine = _machine()
    plan_skip_layer(
        machine,
        SkipLayer.model_validate({"mandrelRotation": 45.0}),
    )

    assert machine.get_gcode() == _load_fixture("skip_layer.gcode")
