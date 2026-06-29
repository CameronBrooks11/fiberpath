"""Unit tests for the developed-surface path + lowering (Stage 2 / S2 #296)."""

from __future__ import annotations

import math
from pathlib import Path

from fiberpath.config.schemas import HelicalLayer, MandrelParameters, TowParameters
from fiberpath.planning.calculations import compute_helical_kinematics
from fiberpath.planning.developed import build_developed_path, lower_developed_path
from fiberpath.planning.machine import WinderMachine
from fiberpath.planning.pattern import pattern_spec

FIXTURE = Path(__file__).parent / "fixtures" / "helical_layer.gcode"

# The exact inputs _generate_fixtures.py uses for helical_layer.gcode.
MANDREL = MandrelParameters.model_validate({"diameter": 40.0, "windLength": 120.0})
TOW = TowParameters.model_validate({"width": 6.0, "thickness": 0.5})
FIXTURE_LAYER = {
    "windAngle": 35.0,
    "patternNumber": 3,
    "skipIndex": 2,
    "lockDegrees": 180.0,
    "leadInMM": 4.0,
    "leadOutDegrees": 12.0,
}


def _lower(layer: HelicalLayer, mandrel: MandrelParameters) -> list[str]:
    machine = WinderMachine(mandrel.diameter)
    machine.set_feed_rate(9000.0)
    kinematics = compute_helical_kinematics(layer, mandrel, TOW)
    path = build_developed_path(pattern_spec(layer), kinematics, mandrel)
    lower_developed_path(machine, path)
    return machine.get_gcode()


def test_lowering_is_byte_identical_to_committed_fixture() -> None:
    layer = HelicalLayer.model_validate(FIXTURE_LAYER)
    assert _lower(layer, MANDREL) == FIXTURE.read_text(encoding="utf-8").splitlines()


def test_no_negative_zero_tokens_emitted() -> None:
    lines = _lower(HelicalLayer.model_validate(FIXTURE_LAYER), MANDREL)
    assert not any(" -0" in line or line.endswith("-0") for line in lines)


def test_developed_waypoints_lie_at_the_wind_angle() -> None:
    layer = HelicalLayer.model_validate(FIXTURE_LAYER)
    kinematics = compute_helical_kinematics(layer, MANDREL, TOW)
    path = build_developed_path(pattern_spec(layer), kinematics, MANDREL)

    circumference = math.pi * MANDREL.diameter
    prev = None
    checked = 0
    for waypoint in path.waypoints:
        if prev is not None:
            d_z = waypoint.z - prev.z
            if abs(d_z) > 1e-9:
                arc_mm = (waypoint.theta - prev.theta) / 360.0 * circumference
                angle = math.degrees(math.atan2(abs(arc_mm), abs(d_z)))
                assert abs(angle - layer.wind_angle) < 1e-9
                checked += 1
        prev = waypoint
    assert checked > 0  # the path actually has laying (carriage-moving) segments


def test_high_angle_negative_tail_term_stays_byte_identical() -> None:
    # alpha=80 makes pass_rotation_degrees % 360 > 180, so the per-pass tail term
    # goes negative; exercises that the accumulation order is preserved.
    layer = HelicalLayer.model_validate(
        {**FIXTURE_LAYER, "windAngle": 80.0, "patternNumber": 1, "skipIndex": 1}
    )
    machine_new = WinderMachine(MANDREL.diameter)
    machine_new.set_feed_rate(9000.0)
    kinematics = compute_helical_kinematics(layer, MANDREL, TOW)
    lower_developed_path(
        machine_new, build_developed_path(pattern_spec(layer), kinematics, MANDREL)
    )

    from fiberpath.planning.layer_strategies import plan_helical_layer

    machine_old = WinderMachine(MANDREL.diameter)
    machine_old.set_feed_rate(9000.0)
    plan_helical_layer(machine_old, layer, MANDREL, TOW)

    assert machine_new.get_gcode() == machine_old.get_gcode()
