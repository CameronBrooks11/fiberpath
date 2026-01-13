# Examples

This directory contains example `.wind` files demonstrating FiberPath's winding patterns and configurations.

## Available Examples

### simple_cylinder/
Single hoop layer on a basic cylindrical mandrel. Good starting point for testing.

- **Mandrel**: 70mm diameter × 500mm length
- **Pattern**: Single hoop wrap
- **Use case**: Basic functionality testing, first-time setup

### multi_layer/
Multi-layer pattern combining hoop and helical layers.

- **Mandrel**: 69.75mm diameter × 940mm length
- **Pattern**: Hoop layer followed by 55° helical layer
- **Use case**: Demonstrates layer sequencing and helical winding

### sized_simple_cylinder/
Helical pattern on a cylinder with specific sizing.

- **Mandrel**: Custom-sized cylinder
- **Pattern**: Helical winding
- **Use case**: Size-specific applications

## Usage

Run any example with:

```sh
fiberpath plan examples/<example_name>/input.wind -o output.gcode
fiberpath plot output.gcode --output preview.png
```
