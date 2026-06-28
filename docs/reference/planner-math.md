# Planner Math Notes

This document summarizes the key formulas and constraints used by the FiberPath planner so new
strategies can be implemented consistently.

## Coordinate Frames

FiberPath uses three logical axes that map to physical controller axes via the dialect configuration:

- **Carriage axis:** Linear motion along the mandrel's longitudinal axis (typically X). All axial movement is measured in millimeters.
- **Mandrel rotation:** Rotational movement of the mandrel (A in standard format). Expressed in degrees; helical layers convert desired fiber angle into simultaneous carriage + mandrel rotation.
- **Delivery head rotation:** Rotational movement of the delivery head/tow feed (B in standard format). Expressed in degrees.
- **Tow width (w):** Linear coverage per wrap; used to compute the number of passes per layer.

The planner operates on these logical axes independent of the physical G-code axis letters, which are determined by the active dialect (XAB in built-in workflows).

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

## Pattern Parameters and the Circuit Count

The winding pattern is laid down as a whole number of **circuits** around the
mandrel circumference. This circuit count — distinct from the axial pass count
above — is what the pattern validation operates on, and it is where the
`computed circuit count is not divisible by patternNumber` error originates.

**Circuit count** (mirrors `compute_helical_kinematics`):

```text
tow_arc_length = w / cos(α)                  # circumferential footprint of one tow band
num_circuits   = ceil(π · d / tow_arc_length)
               = ceil(π · d · cos(α) / w)
```

where `d` is the mandrel diameter, `w` the tow width, and `α` the wind angle.

Three constraints relate the pattern parameters to this count:

- **Divisibility** — `num_circuits % patternNumber == 0`. The pattern number
  splits the circuits into equal bands, so it must divide them evenly.
- **Coprimality** — `gcd(skipIndex, patternNumber) == 1` and
  `skipIndex < patternNumber`. The skip index strides between bands each circuit;
  if it shares a factor with the pattern number, the stride revisits a subset of
  bands instead of visiting all of them.
- **Lock alignment** (only when `patternNumber > 1`) — the per-circuit mandrel
  advance from `lockDegrees`, `(2 · lockDegrees) mod 360°`, must be a multiple of
  the in-pattern slot width `360° / patternNumber`, and the resulting slot stride
  must stay coprime with the pattern number so circuits don't alias onto fewer
  positions.

**Worked example.** A 150 mm mandrel, 50 mm tow, 45° wind angle:

```text
tow_arc_length = 50 / cos(45°) ≈ 70.7 mm
num_circuits   = ceil(π · 150 / 70.7) = ceil(6.66) = 7
```

With `patternNumber = 3`, `7 % 3 ≠ 0`, so validation fails — choose a pattern
number that divides 7 (1 or 7), or adjust the angle / tow / diameter so the
circuit count lands on a multiple of 3. The desktop layer editor shows this
circuit count inline and flags the pattern-number field when it does not divide
evenly, so the relationship is visible before planning.

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
