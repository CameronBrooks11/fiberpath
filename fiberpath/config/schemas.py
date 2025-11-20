"""Typed configuration models shared across the FiberPath toolchain."""

from __future__ import annotations

import json
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, PositiveFloat, PositiveInt


class BaseFiberPathModel(BaseModel):
    """Base class that applies shared Pydantic configuration."""

    model_config = ConfigDict(populate_by_name=True, str_strip_whitespace=True)


class MandrelParameters(BaseFiberPathModel):
    diameter: PositiveFloat
    wind_length: PositiveFloat = Field(alias="windLength")


class TowParameters(BaseFiberPathModel):
    width: PositiveFloat
    thickness: PositiveFloat


class HoopLayer(BaseFiberPathModel):
    wind_type: Literal["hoop"] = Field(alias="windType", default="hoop")
    terminal: bool = False


class HelicalLayer(BaseFiberPathModel):
    wind_type: Literal["helical"] = Field(alias="windType", default="helical")
    wind_angle: PositiveFloat = Field(alias="windAngle")
    pattern_number: PositiveInt = Field(alias="patternNumber")
    skip_index: PositiveInt = Field(alias="skipIndex")
    lock_degrees: PositiveFloat = Field(alias="lockDegrees")
    lead_in_mm: PositiveFloat = Field(alias="leadInMM")
    lead_out_degrees: PositiveFloat = Field(alias="leadOutDegrees")
    skip_initial_near_lock: bool | None = Field(default=None, alias="skipInitialNearLock")


class SkipLayer(BaseFiberPathModel):
    wind_type: Literal["skip"] = Field(alias="windType", default="skip")
    mandrel_rotation: float = Field(alias="mandrelRotation")


LayerModel = Annotated[
    HoopLayer | HelicalLayer | SkipLayer,
    Field(discriminator="wind_type"),
]


class WindDefinition(BaseFiberPathModel):
    layers: list[LayerModel]
    mandrel_parameters: Annotated[MandrelParameters, Field(alias="mandrelParameters")]
    tow_parameters: Annotated[TowParameters, Field(alias="towParameters")]
    default_feed_rate: PositiveFloat = Field(alias="defaultFeedRate")

    def dump_header(self) -> str:
        def _normalize(value: object) -> object:
            if isinstance(value, float) and value.is_integer():
                return int(value)
            if isinstance(value, dict):
                return {k: _normalize(v) for k, v in value.items()}
            return value

        payload = {
            "mandrel": _normalize(self.mandrel_parameters.model_dump(by_alias=True)),
            "tow": _normalize(self.tow_parameters.model_dump(by_alias=True)),
        }
        return f"; Parameters {json.dumps(payload, separators=(',', ':'))}"
