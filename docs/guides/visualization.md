# Visualization Guide

FiberPath provides visualization tools to preview winding patterns before streaming to hardware. This helps verify toolpaths, catch issues early, and understand fiber placement.

## Plot Command

The `fiberpath plot` command generates an unwrapped mandrel view from G-code:

```sh
fiberpath plot output.gcode --output preview.png
```

### How It Works

1. **Reads G-code:** Parses the generated G-code file
2. **Extracts parameters:** Reads mandrel diameter and tow width from the G-code header
3. **Unwraps coordinates:** Converts cylindrical coordinates to 2D representation
4. **Renders image:** Creates a PNG showing fiber placement

The plot shows the mandrel surface "unwrapped" flat, with:

- **X-axis:** Mandrel circumference (0° to 360°)
- **Y-axis:** Mandrel length (carriage position)
- **Lines:** Fiber tow placement

## Command Options

### Basic Usage

```sh
# Generate full-size plot
fiberpath plot output.gcode --output preview.png

# Specify output file (inferred from extension)
fiberpath plot output.gcode -o preview.png
```

### Scale Control

Adjust image size with the `--scale` parameter (0.0 to 1.0):

```sh
# 50% size for quick preview
fiberpath plot output.gcode -o preview.png --scale 0.5

# 80% size (good balance of detail and file size)
fiberpath plot output.gcode -o preview.png --scale 0.8

# Full size (default, may be large)
fiberpath plot output.gcode -o preview.png --scale 1.0
```

**Tips:**

- Use lower scale values for quick iteration during development
- Use higher scale values for documentation and quality checks
- Full size plots can be several MB for complex patterns

## Reading Plots

### Hoop Layers

Appear as vertical lines (parallel to Y-axis). Each line represents one circumferential wrap.

### Helical Layers

Appear as diagonal lines crossing the mandrel at the specified wind angle. Multiple passes create a cross-hatch pattern.

### Skip Layers

Helical patterns with gaps between passes, creating distinct non-overlapping bands.

## GUI Preview

The desktop GUI provides real-time preview in the Plan tab:

1. **Load or create** a wind definition
2. **Click "Plan"** to generate G-code
3. **View preview** automatically displayed after planning
4. **Adjust scale** with the slider for different zoom levels

The GUI preview uses the same plotting engine as the CLI but provides interactive controls.

## Plot Parameters

The plot command extracts mandrel parameters from the G-code header:

```gcode
; Parameters - Mandrel Diameter: 100.0 mm, Tow Width: 12.0 mm
```

If this header is missing or malformed:

- Plot may fail or produce incorrect results
- Regenerate G-code with a recent FiberPath version
- Ensure you're plotting FiberPath-generated G-code

## Advanced Usage

### Batch Plotting

Generate plots for multiple files:

```sh
for file in *.gcode; do
  fiberpath plot "$file" -o "${file%.gcode}.png" --scale 0.8
done
```

### Integration with CI

Add plotting to CI for visual regression testing:

```yaml
- name: Generate reference plots
  run: |
    fiberpath plot examples/simple_cylinder/expected.gcode -o simple.png
    # Compare with reference image or commit for review
```

## Troubleshooting

**Error: "Could not extract mandrel parameters from G-code"**:

- The G-code header is missing or malformed
- Regenerate G-code with current FiberPath version
- Verify you're plotting FiberPath-generated files (not hand-edited)

**Plot looks wrong or distorted**:

- Check mandrel diameter in wind definition is correct
- Verify tow width is reasonable for mandrel size
- Try plotting with `--scale 1.0` for maximum detail

**Image file too large**:

- Use `--scale 0.5` or `--scale 0.8` for smaller files
- Optimize for web with external tools: `pngquant preview.png`

**Plot shows unexpected gaps**:

- This may be correct if using skip layers
- Verify skip indices in wind definition
- Check pattern number calculations (see [Planner Math](../reference/planner-math.md))

## Next Steps

- **Understand Wind Format:** [Wind Format Guide](wind-format.md)
- **Learn Layer Strategies:** [Planner Math](../reference/planner-math.md)
- **Stream to Hardware:** [Marlin Streaming Guide](marlin-streaming.md)
