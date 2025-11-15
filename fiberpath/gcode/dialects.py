"""Dialects encapsulate controller-specific behavior."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class MarlinDialect:
    units: str = "mm"
    feed_mode: str = "G94"  # Units per minute

    def prologue(self) -> list[str]:
        return ["G21" if self.units == "mm" else "G20", self.feed_mode]
