# JSON Schema Implementation

## Overview

Implemented a comprehensive JSON Schema system to ensure type safety between the Python CLI and TypeScript GUI. This eliminates manual field conversions and catches validation errors before sending data to the backend.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Python CLI (fiberpath/config/schemas.py)                     │
│ - Pydantic models define schema                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ scripts/generate_schema.py
                 │ (extracts using model_json_schema())
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ JSON Schema (fiberpath_gui/schemas/wind-schema.json)         │
│ - Single source of truth                                     │
│ - Standard JSON Schema format                                │
└────────────┬───────────────────────┬────────────────────────┘
             │                       │
             │ json-schema-to-       │ AJV validation
             │ typescript            │
             ▼                       ▼
┌────────────────────────┐  ┌─────────────────────────────────┐
│ TypeScript Types       │  │ Runtime Validation               │
│ (src/types/            │  │ (src/lib/validation.ts)          │
│  wind-schema.ts)       │  │ - validateWindDefinition()       │
│                        │  │ - Runs before backend calls      │
└────────────────────────┘  └─────────────────────────────────┘
```

## Files Created

### Core Files

1. **`scripts/generate_schema.py`**
   - Extracts JSON Schema from Pydantic `WindDefinition` model
   - Outputs to `fiberpath_gui/schemas/wind-schema.json`
   - Run via: `python scripts/generate_schema.py`

2. **`fiberpath_gui/schemas/wind-schema.json`**
   - Generated JSON Schema file
   - Contains all type definitions, constraints, and documentation
   - Never edit manually - always regenerate from Python

3. **`fiberpath_gui/src/types/wind-schema.ts`**
   - Auto-generated TypeScript interfaces
   - Matches JSON Schema exactly
   - Includes: `FiberPathWindDefinition`, `HoopLayer`, `HelicalLayer`, `SkipLayer`

4. **`fiberpath_gui/src/types/converters.ts`**
   - `convertLayerToWindSchema()` - Converts GUI layer format to schema format
   - `projectToWindDefinition()` - Converts full project to schema format
   - Uses generated types for safety

5. **`fiberpath_gui/src/lib/validation.ts`**
   - `validateWindDefinition()` - Validates data against schema using AJV
   - `isValidWindDefinition()` - Type guard function
   - Returns detailed error messages for validation failures

## Usage

### Regenerating Schema

Whenever Python Pydantic models change:

```bash
cd fiberpath_gui
npm run schema:generate
```

This runs both:

1. Python script to extract schema
2. TypeScript generator to create types

### In Code

```typescript
import { projectToWindDefinition } from "../types/converters";
import { validateWindDefinition } from "../lib/validation";

// Convert project to schema format
const windDefinition = projectToWindDefinition(project, visibleLayerCount);

// Validate before sending to backend
const validation = validateWindDefinition(windDefinition);
if (!validation.valid) {
  console.error("Validation errors:", validation.errors);
  return;
}

// Safe to send
const json = JSON.stringify(windDefinition);
await plotDefinition(json, visibleLayerCount);
```

## Benefits

✅ **Type Safety** - TypeScript knows exact structure, catches errors at compile time
✅ **Runtime Validation** - JSON Schema validates at runtime before backend calls
✅ **Single Source of Truth** - Python Pydantic models drive everything
✅ **Auto-Generated** - No manual field mapping, reduces errors
✅ **Better Error Messages** - Schema validation provides specific field errors
✅ **Future-Proof** - Easy to version and evolve schema over time

## Testing

Schema validation runs automatically in:

- **VisualizationCanvas** - Before plotting
- **Future File Operations** - Before saving .wind files
- **Future Import** - When loading .wind files

## Maintenance

### When Adding New Layer Types

1. Add Pydantic model in Python
2. Run `npm run schema:generate`
3. Add converter in `converters.ts`
4. Types automatically update

### When Changing Field Names

1. Update Python model
2. Run `npm run schema:generate`
3. TypeScript compiler will show all places needing updates

### When Adding Validation Rules

1. Add to Pydantic model (using Field validators)
2. Run `npm run schema:generate`
3. Validation automatically enforced in GUI

## Future Enhancements

- [ ] Add schema version field for backwards compatibility
- [ ] Add migration system for old .wind files
- [ ] Generate schema documentation automatically
- [ ] Add schema validation tests
- [ ] Consider GraphQL code generation for API layer
