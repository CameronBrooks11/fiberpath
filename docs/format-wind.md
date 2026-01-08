# `.wind` File Format

The `.wind` file format is a JSON-based configuration file that defines filament winding patterns for composite manufacturing. It specifies mandrel geometry, tow material properties, and a sequence of winding layers.

## Schema Version

Current schema version: **1.0**

The schema is formally defined in JSON Schema format and validated using [Pydantic](https://docs.pydantic.dev/) models in the CLI backend.

## File Structure

A `.wind` file is a JSON document with the following top-level structure:

```json
{
  "schemaVersion": "1.0",
  "mandrelParameters": { ... },
  "towParameters": { ... },
  "defaultFeedRate": 2000,
  "layers": [ ... ]
}
```

## Top-Level Fields

### `schemaVersion` (optional)

- **Type**: `string`
- **Default**: `"1.0"`
- **Description**: Version of the `.wind` file format schema. Allows for future format evolution and backwards compatibility detection.

### `mandrelParameters` (required)

- **Type**: `object`
- **Description**: Physical parameters of the mandrel (the part being wound)

#### Fields:

- `diameter` (required): Mandrel outer diameter in mm (must be > 0)
- `windLength` (required): Length of the winding area in mm (must be > 0)

**Example**:

```json
"mandrelParameters": {
  "diameter": 150,
  "windLength": 800
}
```

### `towParameters` (required)

- **Type**: `object`
- **Description**: Material properties of the fiber tow (carbon fiber, fiberglass, etc.)

#### Fields:

- `width` (required): Tow width in mm (must be > 0)
- `thickness` (required): Tow thickness in mm (must be > 0)

**Example**:

```json
"towParameters": {
  "width": 12,
  "thickness": 0.25
}
```

### `defaultFeedRate` (required)

- **Type**: `number`
- **Description**: Default feed rate for winding operations in mm/min (must be > 0)
- **Example**: `2000`

### `layers` (required)

- **Type**: `array`
- **Description**: Sequential list of winding layers to apply. Each layer is one of three types: `hoop`, `helical`, or `skip`.

## Layer Types

Layers are discriminated by the `windType` field. Each layer type has specific required and optional fields.

### Hoop Layer

A hoop layer winds perpendicular to the mandrel axis (90° angle). Used for circumferential reinforcement.

**Required Fields**:

- `windType`: Must be `"hoop"`

**Optional Fields**:

- `terminal` (default: `false`): Whether this is a terminal layer (first or last layer with special handling)

**Example**:

```json
{
  "windType": "hoop",
  "terminal": false
}
```

**Use Cases**:

- Pressure vessel end caps
- Circumferential reinforcement
- First/last layers of a winding pattern

### Helical Layer

A helical layer winds at a specified angle, creating a spiral pattern around the mandrel. This is the most complex layer type with geometric constraints.

**Required Fields**:

- `windType`: Must be `"helical"`
- `windAngle`: Wind angle in degrees (0° < angle ≤ 90°)
- `patternNumber`: Number of circuits in the pattern (must be > 0, integer)
- `skipIndex`: Skip index for pattern generation (must be > 0, integer, coprime with `patternNumber`)
- `lockDegrees`: Lock rotation in degrees (must be > 0)
- `leadInMM`: Lead-in distance in mm (must be > 0)
- `leadOutDegrees`: Lead-out rotation in degrees (must be > 0)

**Optional Fields**:

- `skipInitialNearLock` (default: `null`): Skip initial near-lock behavior

**Geometric Constraints**:

1. **Coprime Check**: `skipIndex` and `patternNumber` must be coprime (GCD = 1) to ensure full coverage
2. **Circuit Divisibility**: The calculated number of circuits must be evenly divisible by `patternNumber` for valid pattern generation
3. **Wind Angle**: Must be between 0° (exclusive) and 90° (inclusive)

**Example**:

```json
{
  "windType": "helical",
  "windAngle": 45,
  "patternNumber": 3,
  "skipIndex": 1,
  "lockDegrees": 10,
  "leadInMM": 5,
  "leadOutDegrees": 10,
  "skipInitialNearLock": null
}
```

**Common Issues**:

- If the planner outputs "Skipping helical layer: X circuits not divisible by pattern Y", adjust either:
  - The wind angle (changes circuit count)
  - The pattern number (must divide evenly into circuit count)
  - The mandrel diameter or wind length

**Use Cases**:

- Pressure vessel cylindrical sections
- Angled reinforcement (±45° for shear resistance)
- Complex geodesic patterns

### Skip Layer

A skip layer rotates the mandrel without winding, allowing for pattern repositioning or creating gaps.

**Required Fields**:

- `windType`: Must be `"skip"`
- `mandrelRotation`: Rotation amount in degrees

**Example**:

```json
{
  "windType": "skip",
  "mandrelRotation": 180
}
```

**Use Cases**:

- Pattern alignment between layers
- Creating intentional gaps
- Repositioning for non-geodesic patterns

## Validation Rules

The schema enforces the following validation rules:

### Type Validation

- All numeric fields must be numbers (integer or float as specified)
- Boolean fields must be `true` or `false`
- String fields must be strings
- Arrays must contain items of the correct type

### Range Validation

- All dimensions (diameter, windLength, width, thickness, etc.) must be **greater than zero** (exclusive minimum)
- Wind angles must be in the range (0°, 90°]
- Pattern numbers and skip indices must be positive integers

### Structural Validation

- All required fields must be present
- Layer discriminator (`windType`) must be one of: `"hoop"`, `"helical"`, `"skip"`
- Each layer type must include its required fields

### Geometric Validation (CLI)

The CLI performs additional validation beyond the schema:

- Coprime check for helical layers (`gcd(skipIndex, patternNumber) == 1`)
- Circuit divisibility check for helical patterns
- Terminal layer placement rules
- Physical feasibility checks

## Schema Management

### Schema Generation

The JSON Schema is automatically generated from Pydantic models:

```bash
cd fiberpath_gui
npm run schema:generate
```

This command:

1. Runs `scripts/generate_schema.py` to extract schema from Python
2. Generates TypeScript types using `json-schema-to-typescript`
3. Updates `schemas/wind-schema.json` and `src/types/wind-schema.ts`

### Schema Location

- **JSON Schema**: `fiberpath_gui/schemas/wind-schema.json`
- **TypeScript Types**: `fiberpath_gui/src/types/wind-schema.ts`
- **Python Models**: `fiberpath/config/schemas.py`
- **Validation**: `fiberpath/config/validator.py`

### Backwards Compatibility

The `schemaVersion` field allows for future format evolution:

- Version `1.0`: Initial schema with discriminated layer types
- Future versions may add new layer types or optional fields
- The CLI maintains backwards compatibility by making `schemaVersion` optional

## Example Files

### Minimal Hoop Pattern

```json
{
  "schemaVersion": "1.0",
  "mandrelParameters": {
    "diameter": 150,
    "windLength": 800
  },
  "towParameters": {
    "width": 12,
    "thickness": 0.25
  },
  "defaultFeedRate": 2000,
  "layers": [
    {
      "windType": "hoop",
      "terminal": false
    }
  ]
}
```

### Multi-Layer Helical Pattern

```json
{
  "schemaVersion": "1.0",
  "mandrelParameters": {
    "diameter": 150,
    "windLength": 800
  },
  "towParameters": {
    "width": 12,
    "thickness": 0.25
  },
  "defaultFeedRate": 2000,
  "layers": [
    {
      "windType": "hoop",
      "terminal": false
    },
    {
      "windType": "helical",
      "windAngle": 45,
      "patternNumber": 3,
      "skipIndex": 1,
      "lockDegrees": 10,
      "leadInMM": 5,
      "leadOutDegrees": 10,
      "skipInitialNearLock": null
    },
    {
      "windType": "skip",
      "mandrelRotation": 180
    },
    {
      "windType": "helical",
      "windAngle": 45,
      "patternNumber": 3,
      "skipIndex": 1,
      "lockDegrees": 10,
      "leadInMM": 5,
      "leadOutDegrees": 10,
      "skipInitialNearLock": null
    },
    {
      "windType": "hoop",
      "terminal": true
    }
  ]
}
```

## Related Documentation

- **[Architecture](architecture.md)**: System design and component interaction
- **[API Documentation](api.md)**: REST API endpoints for validation and planning
- **[Concepts](concepts.md)**: Winding theory and geometric calculations

## Validation Tools

### CLI Validation

```bash
fiberpath validate input.wind
```

### GUI Validation

The GUI automatically validates `.wind` files:

- On file open (before loading into editor)
- Before planning (before sending to CLI)
- On save (before writing to disk)

Validation errors are displayed with specific field paths and messages.

### Python API

```python
from fiberpath.config.validator import validate_wind_definition

errors = validate_wind_definition(wind_dict)
if errors:
    for error in errors:
        print(f"Error in {error.field}: {error.message}")
```

## Future Enhancements

Potential additions to future schema versions:

- Custom layer strategies beyond hoop/helical/skip
- Advanced material properties (resin content, fiber density)
- Multi-tow configurations
- Temperature and cure profiles
- Process parameters (tension, speed profiles)

Changes will maintain backwards compatibility through the `schemaVersion` field.
