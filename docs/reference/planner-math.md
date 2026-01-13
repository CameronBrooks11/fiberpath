# Planner Math Notes

This document summarizes the key formulas and constraints used by the FiberPath planner so new
strategies can be implemented consistently.

## Coordinate Frames

FiberPath uses three logical axes that map to physical controller axes via the dialect configuration:

- **Carriage axis:** Linear motion along the mandrel's longitudinal axis (typically X). All axial movement is measured in millimeters.
- **Mandrel rotation:** Rotational movement of the mandrel (A in standard format, Y in legacy). Expressed in degrees; helical layers convert desired fiber angle into simultaneous carriage + mandrel rotation.
- **Delivery head rotation:** Rotational movement of the delivery head/tow feed (B in standard format, Z in legacy). Expressed in degrees.
- **Tow width (w):** Linear coverage per wrap; used to compute the number of passes per layer.

The planner operates on these logical axes independent of the physical G-code axis letters, which are determined by the selected dialect (XAB standard or XYZ legacy).

## Hoop Layers

For hoop-only layers (pure circumferential wraps):

- Number of commands = `ceil(length / w)` where `length` is the mandrel axial span.
- Feed rate uses the configured surface speed: `F = rpm * 2πr` converted to mm/min.
- Layer time is `(commands * 2πr) / F`.

## Helical Layers

Given mandrel radius `r`, target angle `α`, and carriage speed limit `v_max`:

- Axial advance per revolution: `Δz = 2πr * tan(α)` where z represents distance along the carriage axis.
- Required carriage velocity: `v_carriage = v_surface * tan(α)` with `v_surface = ω * r`.
- Clamp `v_carriage` to machine limits. If clamped, recompute the achievable angle `α' = arctan(v_carriage / v_surface)`.
- Number of passes to cover the mandrel: `passes = ceil(length / (w * cos(α')))`. Skip-layers adjust this by
  introducing an integer stride to satisfy coverage without overlap.

## Skip / Bias Patterns

Skip or bias patterns use a divisor `d` to skip every `n`th groove:

- Ensure `gcd(passes, d) == 1` to prevent repeating the same groove.
- Validate `d < passes` and that the resulting pattern still covers the surface.
- When computing commands, store the skip index so the simulator can reconstruct coverage.

## Layer Metrics

Each planned layer records:

- `time_s = total_distance / feed_rate`
- `tow_m = commands * w / 1000`
- `commands` emitted and the layer type (`hoop`, `helical`, `skip`)

These metrics roll up into the planner summary surfaced by the CLI/API/GUI and power the simulation
estimates.

## Numerical Guardrails

- Mandrel radius and tow width must be > 0.
- Wind angles constrained to `(0°, 90°]` for helical layers.
- Machine feed rates validated against per-axis maxima; exceeding them raises
  `fiberpath.planning.exceptions.FeedRateExceeded`.
- Pattern divisibility checks ensure skip layers align with mandrel symmetry.

Refer to `fiberpath/planning/calculations.py` and `fiberpath/planning/validators.py` for the exact
implementations. This note serves as a human-readable summary for future contributors.
