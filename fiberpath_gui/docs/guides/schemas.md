# Schema Validation Guide

Complete guide to Zod runtime validation in FiberPath GUI.

## Overview

FiberPath GUI uses **Zod** for runtime validation of:

- User input from forms
- CLI responses from Tauri commands
- .wind file structure
- Configuration data

**Why Runtime Validation?**

- TypeScript only validates at compile time
- CLI responses are unknown at compile time
- User can provide invalid data
- .wind files can be hand-edited

## Schema Organization

### File Structure (`src/lib/schemas.ts`)

```typescript
// Tauri Command Response Schemas
export const PlanSummarySchema = z.object({
  /* ... */
});
export const SimulationSummarySchema = z.object({
  /* ... */
});
export const PlotPreviewPayloadSchema = z.object({
  /* ... */
});

// Wind File Structure Schemas (camelCase for backend)
export const MandrelParametersSchema = z.object({
  /* ... */
});
export const TowParametersSchema = z.object({
  /* ... */
});
export const WindHoopLayerSchema = z.object({
  /* ... */
});
export const WindHelicalLayerSchema = z.object({
  /* ... */
});

// TypeScript Types (inferred from schemas)
export type PlanSummary = z.infer<typeof PlanSummarySchema>;
export type MandrelParameters = z.infer<typeof MandrelParametersSchema>;
```

**Convention:** Schema name = Type name + "Schema" suffix.

## Defining Schemas

### Basic Object Schema

```typescript
export const MandrelParametersSchema = z.object({
  diameter: z.number().positive(),
  windLength: z.number().positive(),
});

export type MandrelParameters = z.infer<typeof MandrelParametersSchema>;
```

**Validation Rules:**

- `diameter`: Must be a number and > 0
- `windLength`: Must be a number and > 0

### Optional Fields

```typescript
export const PlanSummarySchema = z.object({
  output: z.string(),
  commands: z.number().int().nonnegative(),
  layers: z.number().int().nonnegative().optional(), // Can be undefined
  metadata: z.record(z.unknown()).optional(), // Can be undefined
});
```

**Behavior:** Optional fields can be missing from input.

### Discriminated Unions (Layer Types)

```typescript
export const WindHoopLayerSchema = z.object({
  windType: z.literal("hoop"),
  terminal: z.boolean(),
  skipEvery: z.number().int().positive().optional(),
});

export const WindHelicalLayerSchema = z.object({
  windType: z.literal("helical"),
  windAngle: z.number().min(1).max(89),
  terminal: z.boolean(),
  skipEvery: z.number().int().positive().optional(),
});

export const WindLayerSchema = z.discriminatedUnion("windType", [
  WindHoopLayerSchema,
  WindHelicalLayerSchema,
]);

export type WindLayer = z.infer<typeof WindLayerSchema>;
```

**Discrimination:** Parser checks `windType` field to determine which schema to use.

**Usage:**

```typescript
const layer: WindLayer = { windType: "hoop", terminal: false };

if (layer.windType === "hoop") {
  // TypeScript knows layer is HoopLayer (no windAngle)
} else if (layer.windType === "helical") {
  // TypeScript knows layer is HelicalLayer (has windAngle)
}
```

### Arrays

```typescript
export const FiberPathProjectSchema = z.object({
  schemaVersion: z.literal("1.0"),
  mandrelParameters: MandrelParametersSchema,
  towParameters: TowParametersSchema,
  defaultFeedRate: z.number().positive(),
  layers: z.array(WindLayerSchema), // Array of layers
});
```

### Nested Objects

```typescript
export const ComplexSchema = z.object({
  mandrel: MandrelParametersSchema, // Nested object
  tow: TowParametersSchema, // Nested object
  settings: z.object({
    // Inline nested object
    axisFormat: z.enum(["xab", "xyz"]),
    dryRun: z.boolean(),
  }),
});
```

### Enums

```typescript
export const AxisFormatSchema = z.enum(["xab", "xyz"]);
export type AxisFormat = z.infer<typeof AxisFormatSchema>;

// Usage
const format: AxisFormat = "xab"; // Valid
const format: AxisFormat = "abc"; // Type error
```

### Records (Dynamic Keys)

```typescript
export const MetadataSchema = z.record(z.unknown());

// Accepts any object with string keys
const metadata = { foo: 123, bar: "abc", baz: true };
```

### Refinements (Custom Validation)

```typescript
export const PositiveEvenNumberSchema = z
  .number()
  .positive()
  .refine((n) => n % 2 === 0, {
    message: "Must be an even number",
  });
```

## Validating Data

### Safe Parse (Preferred)

```typescript
import { MandrelParametersSchema } from "./schemas";

const result = MandrelParametersSchema.safeParse(data);

if (result.success) {
  console.log("Valid:", result.data);
  // result.data is typed as MandrelParameters
} else {
  console.error("Invalid:", result.error.issues);
  // result.error contains validation errors
}
```

**Benefit:** No exceptions, explicit error handling.

### Parse (Throws on Error)

```typescript
try {
  const mandrel = MandrelParametersSchema.parse(data);
  console.log("Valid:", mandrel);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Validation errors:", error.issues);
  }
}
```

**Use Case:** When you want to abort on invalid data.

### Validation Helper

```typescript
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    const errors = result.error.issues.map(
      (issue) => `${issue.path.join(".")}: ${issue.message}`
    );
    throw new ValidationError(
      `Invalid ${context}: ${errors.join(", ")}`,
      result.error.issues
    );
  }

  return result.data;
}

// Usage
const summary = validateData(PlanSummarySchema, response, "plan_wind response");
```

## Common Patterns

### Validating CLI Responses

```typescript
export const planWind = async (inputPath: string): Promise<PlanSummary> => {
  const result = await invoke("plan_wind", { inputPath });
  return validateData(PlanSummarySchema, result, "plan_wind response");
};
```

**Flow:**

1. Call Tauri command (returns `unknown`)
2. Validate with schema
3. Return typed data or throw `ValidationError`

### Validating User Input

```typescript
function MandrelForm({ onSubmit }: { onSubmit: (m: MandrelParameters) => void }) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const formData = {
      diameter: Number(e.target.diameter.value),
      windLength: Number(e.target.windLength.value),
    };

    const result = MandrelParametersSchema.safeParse(formData);

    if (!result.success) {
      setErrors(result.error.issues);
      return;
    }

    onSubmit(result.data);
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Partial Updates

```typescript
export const PartialMandrelSchema = MandrelParametersSchema.partial();

// Now all fields are optional
const update: z.infer<typeof PartialMandrelSchema> = { diameter: 200 };
```

**Use Case:** Updating only some fields in store actions.

### Default Values

```typescript
export const ConfigSchema = z.object({
  axisFormat: z.enum(["xab", "xyz"]).default("xab"),
  dryRun: z.boolean().default(false),
});

const config = ConfigSchema.parse({});
// Result: { axisFormat: "xab", dryRun: false }
```

## Error Handling

### Error Structure

```typescript
const result = MandrelParametersSchema.safeParse({ diameter: -10 });

if (!result.success) {
  console.log(result.error.issues);
  // [
  //   {
  //     code: 'too_small',
  //     minimum: 0,
  //     type: 'number',
  //     inclusive: false,
  //     path: ['diameter'],
  //     message: 'Number must be greater than 0'
  //   }
  // ]
}
```

**Fields:**

- `code`: Error type (too_small, invalid_type, etc.)
- `path`: Field path (e.g., ['layers', 0, 'windAngle'])
- `message`: Human-readable error message

### Displaying Errors

```typescript
function ValidationErrors({ errors }: { errors: z.ZodIssue[] }) {
  return (
    <ul>
      {errors.map((err, i) => (
        <li key={i}>
          <strong>{err.path.join('.')}</strong>: {err.message}
        </li>
      ))}
    </ul>
  );
}
```

### Custom Error Messages

```typescript
export const MandrelParametersSchema = z.object({
  diameter: z
    .number({
      required_error: "Diameter is required",
      invalid_type_error: "Diameter must be a number",
    })
    .positive("Diameter must be positive"),

  windLength: z.number().positive("Wind length must be positive"),
});
```

## Testing Schemas

### Valid Cases

```typescript
import { describe, it, expect } from "vitest";
import { MandrelParametersSchema } from "./schemas";

describe("MandrelParametersSchema", () => {
  it("should accept valid mandrel parameters", () => {
    const valid = {
      diameter: 150,
      windLength: 800,
    };

    const result = MandrelParametersSchema.safeParse(valid);
    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.diameter).toBe(150);
      expect(result.data.windLength).toBe(800);
    }
  });
});
```

### Invalid Cases

```typescript
describe("MandrelParametersSchema", () => {
  it("should reject negative diameter", () => {
    const invalid = { diameter: -10, windLength: 800 };

    const result = MandrelParametersSchema.safeParse(invalid);
    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["diameter"]);
      expect(result.error.issues[0].code).toBe("too_small");
    }
  });

  it("should reject missing fields", () => {
    const invalid = { diameter: 150 };

    const result = MandrelParametersSchema.safeParse(invalid);
    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["windLength"]);
    }
  });
});
```

### Discriminated Union Testing

```typescript
describe("WindLayerSchema", () => {
  it("should accept hoop layer", () => {
    const hoop = { windType: "hoop", terminal: false };
    expect(WindLayerSchema.safeParse(hoop).success).toBe(true);
  });

  it("should accept helical layer", () => {
    const helical = { windType: "helical", windAngle: 45, terminal: false };
    expect(WindLayerSchema.safeParse(helical).success).toBe(true);
  });

  it("should reject invalid windType", () => {
    const invalid = { windType: "unknown", terminal: false };
    expect(WindLayerSchema.safeParse(invalid).success).toBe(false);
  });
});
```

## Adding New Schemas

### Step-by-Step

1. **Define Schema** in `src/lib/schemas.ts`:

   ```typescript
   export const NewFeatureSchema = z.object({
     name: z.string().min(1),
     value: z.number().int().nonnegative(),
   });
   ```

2. **Infer Type**:

   ```typescript
   export type NewFeature = z.infer<typeof NewFeatureSchema>;
   ```

3. **Write Tests** in `src/lib/schemas.test.ts`:

   ```typescript
   describe("NewFeatureSchema", () => {
     it("should validate correct data", () => {
       const valid = { name: "test", value: 42 };
       expect(NewFeatureSchema.safeParse(valid).success).toBe(true);
     });

     it("should reject empty name", () => {
       const invalid = { name: "", value: 42 };
       expect(NewFeatureSchema.safeParse(invalid).success).toBe(false);
     });
   });
   ```

4. **Use in Code**:

   ```typescript
   import { NewFeatureSchema, NewFeature } from "./schemas";

   function processFeature(data: unknown): NewFeature {
     return validateData(NewFeatureSchema, data, "new feature");
   }
   ```

## Best Practices

### ✅ Do

- **Validate at boundaries:** CLI responses, user input, file loads
- **Use discriminated unions:** For layer types, state variants
- **Write tests:** For every schema (valid + invalid cases)
- **Provide custom messages:** For better UX
- **Infer types:** Don't manually define types when schema exists

### ❌ Don't

- **Over-validate:** Internal function calls don't need runtime validation
- **Forget optional:** Mark fields optional if they can be missing
- **Ignore errors:** Always handle safeParse() failure cases
- **Duplicate schemas:** Reuse schemas across frontend/backend when possible

## Migration Guide

### From Manual Validation

**Before:**

```typescript
function validateMandrel(data: any): MandrelParameters | null {
  if (typeof data.diameter !== "number") return null;
  if (data.diameter <= 0) return null;
  if (typeof data.windLength !== "number") return null;
  if (data.windLength <= 0) return null;
  return data as MandrelParameters;
}
```

**After:**

```typescript
const result = MandrelParametersSchema.safeParse(data);
return result.success ? result.data : null;
```

**Benefits:** 10x less code, better error messages, type inference.

## Next Steps

- [Type Safety Reference](../reference/type-safety.md) - Advanced patterns
- [Testing Guide](../testing.md) - Schema test patterns
- [CLI Integration](../architecture/cli-integration.md) - Using schemas with commands
