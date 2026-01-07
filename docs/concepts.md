# Core Concepts

- _Wind Definition_: JSON structure describing mandrel, tow, and layer parameters.
- _Layer Strategies_: Algorithms per hoop/helical/skip layer that compute feed/angle/lock moves.
- _Dialects_: Controller-specific G-code flavors (Marlin first, FANUC/GRBL in backlog).
- _Axis Mapping_: Configurable mapping of logical axes to physical controller axes. FiberPath uses three logical axes:
  - **Carriage (X)**: Linear motion along the mandrel axis
  - **Mandrel**: Mandrel rotation (rotational)
  - **Delivery Head**: Delivery head rotation (rotational)

## Axis Formats

FiberPath supports two axis coordinate formats:

### XAB (Standard Rotational) - Default

The recommended format for modern filament winding machines using true rotational axes:

- `X` = Carriage (linear, mm)
- `A` = Mandrel rotation (rotational, degrees)
- `B` = Delivery head rotation (rotational, degrees)

Marlin firmware recognizes A/B as rotational axes and handles them properly with correct acceleration profiles and movement semantics.

### XYZ (Legacy)

Compatibility format for legacy systems (like Cyclone) where rotational axes were configured as linear in Marlin:

- `X` = Carriage (linear, mm)
- `Y` = Mandrel rotation (treated as linear, degrees)
- `Z` = Delivery head rotation (treated as linear, degrees)

This format was used when rotational axes were mapped to Y/Z in Marlin with linear kinematics. While functional, it doesn't leverage Marlin's native rotational axis support.

**Use `--axis-format xab` (CLI) or `"axis_format": "xab"` (API) for new projects.** Legacy format is retained for backward compatibility with existing `.gcode` files and reference runs.
