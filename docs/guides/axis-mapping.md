# Axis Mapping Guide

FiberPath uses a flexible axis mapping system that separates planning logic from G-code output format. This allows the same winding pattern to work with different machine configurations.

## Overview

The planner operates on three **logical axes**:

- **Carriage:** Linear motion along the mandrel's longitudinal axis (mm)
- **Mandrel:** Mandrel rotation (degrees)
- **Delivery Head:** Delivery head rotation for tow feed (degrees)

These logical axes are mapped to **physical controller axes** via the selected dialect. FiberPath supports two axis formats.

## XAB Format (Standard Rotational)

**Recommended for all new projects.**

Uses Marlin's native rotational axis support:

- `X` = Carriage (linear, mm)
- `A` = Mandrel rotation (rotational, degrees)
- `B` = Delivery head rotation (rotational, degrees)

**Advantages:**

- Marlin recognizes A and B as rotational axes
- Correct acceleration profiles for rotation
- Proper movement semantics and homing
- Industry-standard axis naming

**When to use:**

- New machine setups
- Systems with Marlin configured for rotational axes
- When you want optimal performance and correctness

## XYZ Format (Legacy)

**Compatibility format for legacy systems.**

Treats rotational axes as linear in G-code output:

- `X` = Carriage (linear, mm)
- `Y` = Mandrel rotation (treated as linear, degrees)
- `Z` = Delivery head rotation (treated as linear, degrees)

**Limitations:**

- Marlin treats Y/Z as linear axes, not rotational
- May not use optimal acceleration profiles
- Historical format from early FiberPath development

**When to use:**

- Legacy systems (e.g., Cyclone) where rotational axes are configured as linear
- Backward compatibility with existing G-code files
- Migration period from old to new configurations

## Specifying Axis Format

### CLI

Use the `--axis-format` flag:

```sh
# XAB format (default)
fiberpath plan input.wind -o output.gcode

# Explicit XAB
fiberpath plan input.wind -o output.gcode --axis-format xab

# XYZ legacy format
fiberpath plan input.wind -o output.gcode --axis-format xyz
```

### API

Include `axis_format` in the request body:

```json
{
  "path": "/path/to/input.wind",
  "axis_format": "xab"
}
```

Available values: `"xab"` (default), `"xyz"`

### GUI

The GUI automatically uses the CLI default (XAB). Future versions may add format selection in the UI.

## Example Comparison

For a simple G1 move command, here's how the formats differ:

**XAB Format:**

```gcode
G1 X50.0 A180.0 B90.0 F2000
```

**XYZ Format:**

```gcode
G1 X50.0 Y180.0 Z90.0 F2000
```

Both represent the same logical operation:

- Move carriage to 50mm
- Rotate mandrel to 180°
- Rotate delivery head to 90°
- At 2000 mm/min feed rate

## Migration Guide

### From XYZ to XAB

If you're currently using XYZ format and want to migrate:

1. **Update Marlin Configuration:**

   - Configure A and B axes as rotational in Marlin firmware
   - Set appropriate steps/mm for rotational axes
   - Configure acceleration and jerk for rotation

2. **Regenerate G-code:**

   ```sh
   fiberpath plan input.wind -o output_xab.gcode --axis-format xab
   ```

3. **Test thoroughly:**

   - Use dry-run mode first: `fiberpath stream output_xab.gcode --dry-run`
   - Test with small movements before full patterns
   - Verify homing and axis limits

4. **Update documentation/scripts:**
   - Change any hardcoded `--axis-format xyz` flags
   - Update team documentation

### Maintaining Both Formats

If you need to support both legacy and new systems:

```sh
# Generate both formats
fiberpath plan input.wind -o output_xab.gcode --axis-format xab
fiberpath plan input.wind -o output_xyz.gcode --axis-format xyz

# Use appropriate file for each machine
fiberpath stream output_xab.gcode --port COM3  # New machine
fiberpath stream output_xyz.gcode --port COM4  # Legacy machine
```

## Technical Details

For developers and advanced users, see [Axis System Architecture](../architecture/axis-system.md) for:

- How the AxisMapping class works
- MarlinDialect implementation
- Adding custom dialects
- Code structure and extension points

## Troubleshooting

**Machine moves incorrectly with XAB format**:

- Verify Marlin is configured for rotational A/B axes
- Check steps/mm settings for rotational axes
- Test axis directions with small manual movements
- Consider using XYZ format if hardware configuration can't be changed

**Need to support multiple machine types**:

- Generate separate G-code files for each axis format
- Document which file goes to which machine
- Consider CI automation to generate both formats

**Plotting shows unexpected results**:

- Plotting extracts mandrel parameters from G-code header
- Axis format doesn't affect plot output (uses logical coordinates)
- Verify the G-code header contains correct parameters
