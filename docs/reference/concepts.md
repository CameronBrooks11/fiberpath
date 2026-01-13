# Core Concepts

FiberPath terminology and key concepts for filament winding.

## Wind Definition

JSON structure describing mandrel geometry, tow material properties, and a sequence of winding layers. Defines the complete winding pattern for a composite part.

See [Wind Format Guide](../guides/wind-format.md) for full schema documentation.

## Layer Strategies

Algorithms that compute toolpaths for different winding patterns:

- **Hoop:** Circumferential wraps perpendicular to mandrel axis (90° wind angle)
- **Helical:** Angled wraps that advance along mandrel (0° < angle < 90°)
- **Skip:** Helical patterns with controlled gaps between passes for specific coverage patterns

Each strategy calculates feed rates, mandrel rotation, and carriage movement to achieve the desired fiber placement.

See [Planner Math](planner-math.md) for detailed formulas.

## Dialects

Controller-specific G-code output formats. FiberPath currently supports Marlin dialects with plans for FANUC and GRBL.

**Marlin dialects:**

- **XAB (Standard):** Uses native rotational axes (A, B)
- **XYZ (Legacy):** Treats rotational axes as linear (Y, Z) for backward compatibility

See [Axis Mapping Guide](../guides/axis-mapping.md) for choosing between dialects.

## Axis Mapping

Configurable mapping of logical planning axes to physical controller axes. Allows the same planning logic to produce G-code for different machine configurations.

**Logical axes:**

- **Carriage:** Linear motion along mandrel longitudinal axis (mm)
- **Mandrel:** Mandrel rotation (degrees)
- **Delivery Head:** Delivery head rotation (degrees)

**Physical mapping varies by dialect** - see [Axis Mapping Guide](../guides/axis-mapping.md) and [Axis System Architecture](../architecture/axis-system.md) for details.

## Pattern Parameters

### Wind Angle

Angle between fiber and mandrel axis (0° = longitudinal, 90° = hoop). Helical layers use wind angles between 0° and 90°.

### Pattern Number

Number of times the helical pattern repeats around the mandrel. Higher numbers create denser coverage with narrower helical bands.

### Skip Index

Integer stride for skip patterns. Controls spacing between helical passes. Must be coprime with pattern number to ensure full coverage.

### Lock Degrees

Mandrel rotation at layer boundaries for fiber termination and restart. Ensures consistent start/end positions between layers.

### Lead In/Out

Transition movements at layer start (lead in) and end (lead out). Measured in mm (lead in) or degrees (lead out) to create smooth fiber placement.

## Mandrel Parameters

- **Diameter:** Outer diameter of mandrel in mm
- **Wind Length:** Length of winding area along mandrel axis in mm

These define the cylindrical winding surface.

## Tow Parameters

- **Width:** Fiber tow width in mm (perpendicular to fiber direction)
- **Thickness:** Fiber tow thickness in mm (normal to mandrel surface)

Width determines spacing between passes and coverage calculations.

## Feed Rate

Speed of combined motion in mm/min or degrees/min depending on axis type. Balances production speed with fiber tension and machine capabilities.

- **Default Feed Rate:** Base speed for winding operations
- **Layer-specific rates:** Can be adjusted per layer for different wind angles

## Terminal Layers

Special hoop layers at start or end of winding sequence. May have different handling for fiber attachment and termination.

## Simulation Metrics

Estimates calculated from G-code without hardware execution:

- **Commands Executed:** Total G-code commands processed
- **Moves:** Movement commands (excludes setup/config)
- **Estimated Time:** Duration based on feed rates and distances
- **Total Distance:** Combined motion of all axes
- **Tow Length:** Total fiber material used
- **Average Feed Rate:** Mean speed across all moves
