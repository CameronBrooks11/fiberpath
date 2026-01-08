"""G-code aware machine abstraction used for planning."""

from __future__ import annotations

import math
from collections.abc import Mapping
from typing import TYPE_CHECKING

from fiberpath.math_utils import strip_precision

from .helpers import Axis, get_axis_letter, interpolate_coordinates, serialize_coordinate

if TYPE_CHECKING:
    from fiberpath.gcode.dialects import MarlinDialect


class WinderMachine:
    def __init__(
        self,
        mandrel_diameter: float,
        verbose_output: bool = False,
        dialect: MarlinDialect | None = None,
    ) -> None:
        self._verbose = verbose_output
        self._gcode: list[str] = []
        self._feed_rate_mmpm = 0.0
        self._total_time_s = 0.0
        self._total_tow_length_mm = 0.0
        self._last_position: dict[Axis, float] = {
            Axis.CARRIAGE: 0.0,
            Axis.MANDREL: 0.0,
            Axis.DELIVERY_HEAD: 0.0,
        }
        self._mandrel_diameter = mandrel_diameter

        # Import here to avoid circular dependency
        if dialect is None:
            from fiberpath.gcode.dialects import MARLIN_XYZ_LEGACY

            dialect = MARLIN_XYZ_LEGACY
        self._dialect = dialect

    def get_gcode(self) -> list[str]:
        return self._gcode.copy()

    def add_raw_gcode(self, command: str) -> None:
        self._gcode.append(command)

    def insert_comment(self, text: str) -> None:
        self._gcode.append(f"; {text}")

    def set_feed_rate(self, feed_rate_mmpm: float) -> None:
        self._feed_rate_mmpm = feed_rate_mmpm
        self._gcode.append(f"G0 F{strip_precision(feed_rate_mmpm)}")

    def move(self, position: Mapping[Axis, float]) -> None:
        complete_end = self._last_position.copy()
        complete_end.update(position)
        do_segment_move = not math.isclose(
            self._last_position[Axis.CARRIAGE], complete_end[Axis.CARRIAGE], abs_tol=1e-6
        )
        if not do_segment_move:
            if self._verbose:
                self.insert_comment(
                    "Move "
                    f"{serialize_coordinate(self._last_position)} -> "
                    f"{serialize_coordinate(complete_end)}"
                )
            # Pass complete_end so all axes are included in the G-code command
            self._move_segment(complete_end)
            return

        carriage_delta = abs(self._last_position[Axis.CARRIAGE] - complete_end[Axis.CARRIAGE])
        num_segments = int(round(carriage_delta)) + 1
        if self._verbose:
            self.insert_comment(
                "Segmented move "
                f"{serialize_coordinate(self._last_position)} -> "
                f"{serialize_coordinate(complete_end)} in {num_segments} steps"
            )
        for intermediate in interpolate_coordinates(
            self._last_position, complete_end, num_segments
        ):
            self._move_segment(intermediate)

    def set_position(self, position: Mapping[Axis, float]) -> None:
        command_parts = ["G92"]
        for axis, value in position.items():
            axis_letter = get_axis_letter(axis, self._dialect.axis_mapping)
            command_parts.append(f"{axis_letter}{strip_precision(value)}")
            self._last_position[axis] = value
        self._gcode.append(" ".join(command_parts))

    def zero_axes(self, current_angle_degrees: float) -> None:
        self.set_position(
            {
                Axis.CARRIAGE: 0.0,
                Axis.MANDREL: current_angle_degrees % 360.0,
                Axis.DELIVERY_HEAD: 0.0,
            }
        )
        self.move({Axis.MANDREL: 360.0})
        self.set_position({Axis.MANDREL: 0.0})

    def get_gcode_time_s(self) -> float:
        return self._total_time_s

    def get_tow_length_m(self) -> float:
        return self._total_tow_length_mm / 1000.0

    def set_mandrel_diameter(self, mandrel_diameter: float) -> None:
        self._mandrel_diameter = mandrel_diameter

    def get_mandrel_diameter(self) -> float:
        return self._mandrel_diameter

    def _move_segment(self, position: Mapping[Axis, float]) -> None:
        command_parts = ["G0"]
        total_distance_sq = 0.0
        tow_length_sq = 0.0
        for axis, value in position.items():
            axis_letter = get_axis_letter(axis, self._dialect.axis_mapping)
            command_parts.append(f"{axis_letter}{strip_precision(value)}")
            move_component = value - self._last_position[axis]

            # Distance calculation depends on whether axis is truly rotational in Marlin
            if axis == Axis.MANDREL:
                # For XYZ legacy: Y/Z configured as linear in Marlin
                # For XAB standard: A/B are rotational in Marlin
                # In both cases, use degree value directly for distance calculation
                total_distance_sq += move_component**2
                # For tow length, always convert to arc length
                arc_length = move_component / 360.0 * self._mandrel_diameter * math.pi
                tow_length_sq += arc_length**2
            elif axis == Axis.CARRIAGE:
                # Carriage: always linear in mm
                total_distance_sq += move_component**2
                tow_length_sq += move_component**2
            elif axis == Axis.DELIVERY_HEAD:
                # Delivery head: use value directly for distance
                total_distance_sq += move_component**2
                # Delivery head rotation doesn't contribute to tow length

            self._last_position[axis] = value

        if self._feed_rate_mmpm <= 0:
            raise RuntimeError("Feed rate must be set before moving the machine")

        self._total_time_s += math.sqrt(total_distance_sq) / self._feed_rate_mmpm * 60.0
        self._total_tow_length_mm += math.sqrt(tow_length_sq)
        self._gcode.append(" ".join(command_parts))
