"""Unit tests for planner validation helpers."""

from __future__ import annotations

import pytest
from fiberpath.config.schemas import HelicalLayer, MandrelParameters, TowParameters
from fiberpath.planning.exceptions import LayerValidationError
from fiberpath.planning.validators import validate_helical_layer

MANDREL = MandrelParameters.model_validate({"diameter": 70.0, "windLength": 100.0})
BASE_LAYER = {
    "windAngle": 35.0,
    "patternNumber": 31,
    "skipIndex": 1,
    "lockDegrees": 180.0,
    "leadInMM": 5.0,
    "leadOutDegrees": 15.0,
}


def test_validate_helical_layer_rejects_skip_index_ge_pattern() -> None:
    layer = HelicalLayer.model_validate({**BASE_LAYER, "skipIndex": 4, "patternNumber": 4})
    tow = TowParameters.model_validate({"width": 6.0, "thickness": 0.5})

    with pytest.raises(LayerValidationError):
        validate_helical_layer(1, layer, MANDREL, tow)


def test_validate_helical_layer_rejects_non_divisible_circuit_pattern() -> None:
    # With this fixture geometry/tow width, num_circuits computes to 31.
    # patternNumber=4 must fail because 31 % 4 != 0.
    layer = HelicalLayer.model_validate({**BASE_LAYER, "patternNumber": 4, "skipIndex": 1})
    tow = TowParameters.model_validate({"width": 6.0, "thickness": 0.5})

    with pytest.raises(LayerValidationError, match="not divisible by patternNumber"):
        validate_helical_layer(2, layer, MANDREL, tow)


def test_validate_helical_layer_allows_valid_parameters() -> None:
    layer = HelicalLayer.model_validate(BASE_LAYER)
    tow = TowParameters.model_validate({"width": 6.0, "thickness": 0.5})

    result = validate_helical_layer(2, layer, MANDREL, tow)

    # Returned object comes directly from compute_helical_kinematics; ensure
    # we get a positive circuit count to prove the happy path executes.
    assert result.num_circuits > 0
