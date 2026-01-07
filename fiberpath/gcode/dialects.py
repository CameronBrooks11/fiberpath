"""Dialects encapsulate controller-specific behavior."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(slots=True)
class AxisMapping:
    """Maps logical axes to G-code axis letters."""

    carriage: str = "X"  # Linear motion along mandrel
    mandrel: str = "Y"  # Mandrel rotation
    delivery_head: str = "Z"  # Delivery head rotation

    @property
    def is_rotational_mandrel(self) -> bool:
        """True if mandrel uses a rotational axis (A/B/C)."""
        return self.mandrel in {"A", "B", "C"}

    @property
    def is_rotational_delivery(self) -> bool:
        """True if delivery head uses a rotational axis (A/B/C)."""
        return self.delivery_head in {"A", "B", "C"}


@dataclass(slots=True)
class MarlinDialect:
    """G-code dialect configuration for Marlin controllers."""

    units: str = "mm"
    feed_mode: str = "G94"  # Units per minute
    axis_mapping: AxisMapping = field(default_factory=AxisMapping)

    def prologue(self) -> list[str]:
        """Return G-code commands for controller initialization."""
        return ["G21" if self.units == "mm" else "G20", self.feed_mode]


# Predefined dialects
MARLIN_XYZ_LEGACY = MarlinDialect(
    axis_mapping=AxisMapping(carriage="X", mandrel="Y", delivery_head="Z"),
)

MARLIN_XAB_STANDARD = MarlinDialect(
    axis_mapping=AxisMapping(carriage="X", mandrel="A", delivery_head="B"),
)
