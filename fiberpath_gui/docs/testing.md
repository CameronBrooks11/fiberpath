# Testing Guide

Comprehensive testing documentation for FiberPath GUI test suite.

## Test Stack

- **Framework:** Vitest (Vite-native test runner)
- **Assertions:** Expect API (Jest-compatible)
- **React Testing:** @testing-library/react
- **Environment:** jsdom (simulated DOM)
- **Coverage:** v8 provider

## Running Tests

### All Tests

```sh
npm test
```

Runs all tests in `src/**/*.{test,spec}.{ts,tsx}` and displays summary.

### Watch Mode

```sh
npm test -- --watch
```

Re-runs tests on file changes. Useful during development.

### Specific Test File

```sh
npm test -- schemas.test.ts
npm test -- validation.test.ts
npm test -- projectStore.test.ts
```

### With Coverage

```sh
npm test -- --coverage
```

Generates coverage report in `coverage/` directory.

### UI Mode

```sh
npm test -- --ui
```

Opens interactive test UI in browser for exploring tests and results.

## Test Organization

### Current Test Suite

```sh
src/
├── lib/
│   ├── schemas.test.ts        # 43 tests - Zod schema validation
│   └── validation.test.ts     # JSON schema validation (AJV)
├── state/
│   └── projectStore.test.ts   # Zustand store actions
├── types/
│   └── converters.test.ts     # Type conversion utilities
└── tests/
    └── integration/
        └── workflows.test.ts  # End-to-end workflows
```

### Test Counts

- **Schema validation:** 43 tests (Zod runtime validation)
- **State management:** ~15 tests (store actions)
- **Validation:** ~25 tests (JSON schema)
- **Type converters:** ~10 tests
- **Integration:** ~5 tests

**Total:** ~100 tests, all passing ✅

## Writing Tests

### Schema Validation Tests

**Purpose:** Verify Zod schemas accept valid data and reject invalid data.

```typescript
import { describe, it, expect } from "vitest";
import { MandrelParametersSchema } from "./schemas";

describe("MandrelParametersSchema", () => {
  it("should validate correct mandrel parameters", () => {
    const valid = {
      diameter: 150,
      windLength: 800,
    };

    const result = MandrelParametersSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject negative diameter", () => {
    const invalid = {
      diameter: -10,
      windLength: 800,
    };

    const result = MandrelParametersSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("positive");
    }
  });
});
```

### Store Tests

**Purpose:** Verify Zustand actions correctly update state.

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useProjectStore } from "./projectStore";

describe("projectStore", () => {
  beforeEach(() => {
    // Reset store to initial state
    useProjectStore.setState({
      project: null,
      activeLayerId: null,
      isDirty: false,
      filePath: null,
    });
  });

  it("should create new project", () => {
    const store = useProjectStore.getState();
    store.newProject();

    expect(store.project).not.toBeNull();
    expect(store.project?.layers).toHaveLength(1);
    expect(store.isDirty).toBe(false);
  });

  it("should mark project as dirty after update", () => {
    const store = useProjectStore.getState();
    store.newProject();
    store.updateMandrel({ diameter: 200 });

    expect(store.isDirty).toBe(true);
  });
});
```

### Component Tests

**Purpose:** Verify React components render correctly and handle interactions.

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render with props', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should handle click', () => {
    const onClick = vi.fn();
    render(<MyComponent onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

### Integration Tests

**Purpose:** Test complete workflows across multiple components/stores.

```typescript
import { describe, it, expect } from "vitest";
import { useProjectStore } from "../state/projectStore";

describe("Plan Workflow", () => {
  it("should create project, add layer, and update mandrel", () => {
    const store = useProjectStore.getState();

    // Step 1: New project
    store.newProject();
    expect(store.project).not.toBeNull();

    // Step 2: Add helical layer
    store.addLayer({
      windType: "helical",
      windAngle: 45,
      terminal: false,
    });
    expect(store.project?.layers).toHaveLength(2);

    // Step 3: Update mandrel
    store.updateMandrel({ diameter: 200, windLength: 1000 });
    expect(store.project?.mandrelParameters.diameter).toBe(200);

    // Verify dirty state
    expect(store.isDirty).toBe(true);
  });
});
```

## Test Patterns

### Valid/Invalid Data Pairs

For every schema, test both valid and invalid inputs:

```typescript
describe("HelicalLayerSchema", () => {
  const validCases = [
    { windAngle: 45, terminal: false },
    { windAngle: 30, terminal: true, skipEvery: 2 },
  ];

  const invalidCases = [
    { windAngle: 100, terminal: false }, // Angle > 90
    { windAngle: -10, terminal: false }, // Negative angle
    { windAngle: 45 }, // Missing terminal
  ];

  validCases.forEach((data, i) => {
    it(`should accept valid case ${i + 1}`, () => {
      const result = HelicalLayerSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  invalidCases.forEach((data, i) => {
    it(`should reject invalid case ${i + 1}`, () => {
      const result = HelicalLayerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});
```

### Mocking Tauri Commands

When testing components that call Tauri commands:

```typescript
import { vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

it("should call plan command", async () => {
  vi.mocked(invoke).mockResolvedValue({ success: true });

  const result = await planProject(projectData);

  expect(invoke).toHaveBeenCalledWith("plan_project", {
    windDef: expect.any(Object),
  });
});
```

### Testing Error Handling

Verify components handle errors gracefully:

```typescript
it('should display error message on validation failure', () => {
  const invalidData = { diameter: -10 };

  render(<MandrelForm initialData={invalidData} />);

  expect(screen.getByText(/diameter must be positive/i)).toBeInTheDocument();
});
```

## Coverage Goals

### Target Coverage

- **Statements:** 80%+
- **Branches:** 75%+
- **Functions:** 80%+
- **Lines:** 80%+

### Critical Areas (100% coverage required)

- Schema validation (`src/lib/schemas.ts`)
- Error handling (`src/lib/validation.ts`)
- State management (`src/state/projectStore.ts`)

### Lower Priority (50%+ acceptable)

- UI components (focus on critical paths)
- Styling modules
- Type definitions

## Debugging Tests

### View Test Output

```sh
npm test -- --reporter=verbose
```

Shows individual test names and durations.

### Debug Single Test

Add `.only` to focus one test:

```typescript
it.only("should validate mandrel", () => {
  // This is the only test that will run
});
```

### Print Debug Info

```typescript
it("should update state", () => {
  store.updateMandrel({ diameter: 200 });

  console.log("State:", store.project); // Visible in test output

  expect(store.project?.mandrelParameters.diameter).toBe(200);
});
```

### Use Vitest UI

```sh
npm test -- --ui
```

Opens browser UI showing:

- Test hierarchy
- Pass/fail status
- Console output
- Code coverage
- Re-run buttons

## CI Integration

Tests run automatically on every push and PR via GitHub Actions:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test -- --run
```

**PR Requirements:**

- ✅ All tests must pass
- ✅ No new TypeScript errors
- ✅ Coverage must not decrease

## Common Issues

### "Cannot find module '@/lib/schemas'"

**Solution:** Check path alias in `vitest.config.ts`:

```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### Tests fail but code works

**Solution:** May be testing implementation details. Focus on behavior:

```typescript
// Bad: Testing internal state
expect(component.state.count).toBe(1);

// Good: Testing visible behavior
expect(screen.getByText("Count: 1")).toBeInTheDocument();
```

### Mock not working

**Solution:** Ensure mock is hoisted before imports:

```typescript
vi.mock("@tauri-apps/api/core"); // Must be at top

import { MyComponent } from "./MyComponent";
```

## Next Steps

- [Schema Validation Guide](guides/schemas.md) - Writing schemas
- [State Management](architecture/state-management.md) - Store patterns
- [Type Safety](reference/type-safety.md) - TypeScript patterns
