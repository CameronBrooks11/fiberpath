# Testing Documentation

## Overview

This project has a comprehensive test suite covering all critical functionality with 113 tests across 5 test files.

## Test Coverage

### Unit Tests (106 tests)

#### 1. Schema Validation Tests (`src/lib/schemas.test.ts` - 43 tests)

Tests for Zod schemas and error utilities:

- Tauri command response schemas (PlanSummary, SimulationSummary, StreamSummary, PlotPreview, ValidationResult)
- Wind file structure schemas (Mandrel, Tow, Layers, WindDefinition)
- Validation helpers (validateData, isValidData)
- Custom error classes (FiberPathError, FileError, ValidationError, CommandError, ConnectionError)
- Error parsing utilities (parseError, isRetryableError)

#### 2. Data Conversion Tests (`src/types/converters.test.ts` - 17 tests)

Tests for data transformation functions:

- Layer conversion (UI ↔ Wind schema)
  - Hoop layers with defaults
  - Helical layers with full parameters
  - Skip layers
- Project conversion (Project ↔ WindDefinition)
  - Complete conversion including visible layer count
  - Edge cases (empty projects, single layer)
- Round-trip conversion (data preservation)

#### 3. State Management Tests (`src/state/projectStore.test.ts` - 29 tests)

Tests for Zustand store mutations:

- Project lifecycle (initialize, load, new project)
- Mandrel updates (diameter, wind_length)
- Tow updates (width, thickness)
- Machine settings (feed rate, axis format)
- Layer operations (add, remove, update, duplicate, reorder)
- UI state (active layer selection)
- Dirty state management
- File metadata (filePath, lastModified)

#### 4. Validation Tests (`src/lib/validation.test.ts` - 17 tests)

Tests for input validation:

- Number validation (positive, range, integer)
- Mandrel parameter validation
- Tow parameter validation
- Layer parameter validation by type

### Integration Tests (7 tests)

#### Workflow Tests (`src/tests/integration/workflows.test.ts` - 7 tests)

End-to-end workflow tests:

1. **New → Add → Save → Load**: Complete project lifecycle
2. **Load → Edit → Save**: Modify existing project
3. **Layer Operations**: Complex multi-layer manipulations
4. **Export**: Visible layer count filtering
5. **State Persistence**: Dirty state tracking
6. **Error Recovery**: Invalid data and non-existent layers

## Running Tests

```bash
# Run tests once
npm test -- --run

# Run tests in watch mode
npm test

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test -- src/lib/schemas.test.ts
```

## Test Architecture

### Test Setup

- **Framework**: Vitest v2.1.9
- **Environment**: jsdom (for React Testing Library)
- **Matchers**: vitest + @testing-library/jest-dom
- **Setup File**: `src/tests/setup.ts`

### Coverage Requirements

- Statements: 70%
- Branches: 70%
- Functions: 70%
- Lines: 70%

Coverage reports are generated in:

- Text: Console output
- JSON: `coverage/coverage-final.json`
- HTML: `coverage/index.html`
- LCOV: `coverage/lcov.info` (for CI/Codecov)

### Test Patterns

#### State Management Tests

```typescript
beforeEach(() => {
  // CRITICAL: Create fresh project for each test
  useProjectStore.setState({ project: createEmptyProject() });
  vi.clearAllMocks();
});

it("should handle mutations", () => {
  // Get initial state
  let state = useProjectStore.getState();

  // Perform mutation
  state.updateMandrel({ diameter: 150 });

  // IMPORTANT: Refresh state after mutation
  state = useProjectStore.getState();

  // Assert on refreshed state
  expect(state.project.mandrel.diameter).toBe(150);
});
```

#### Schema Validation Tests

```typescript
it("should validate valid data", () => {
  const validData = {
    /* ... */
  };
  const result = validateData(MySchema, validData, "test");
  expect(result).toEqual(validData);
});

it("should throw ValidationError for invalid data", () => {
  const invalidData = {
    /* ... */
  };
  expect(() => validateData(MySchema, invalidData, "test")).toThrow(
    ValidationError
  );
});
```

#### Integration Tests

```typescript
it("should complete full workflow", () => {
  let state = useProjectStore.getState();

  // Step 1: Setup
  state.updateMandrel({ diameter: 100, wind_length: 200 });
  state = useProjectStore.getState();

  // Step 2: Add layers
  const id = state.addLayer("hoop");
  state = useProjectStore.getState();

  // Step 3: Convert and validate
  const windDef = projectToWindDefinition(state.project);
  expect(windDef.mandrelParameters.diameter).toBe(100);
  expect(windDef.layers).toHaveLength(1);

  // Step 4: Load and verify
  const loadedProject = windDefinitionToProject(windDef);
  expect(loadedProject.mandrel.diameter).toBe(100);
});
```

## CI/CD Integration

Tests run automatically on:

- Push to `main` or `newgui` branches
- Pull requests to `main` or `newgui`

GitHub Actions workflow (`.github/workflows/gui-tests.yml`):

1. Type checking with `tsc --noEmit`
2. Test execution with coverage
3. Build verification
4. Codecov upload

## Test Quality Guidelines

### What Makes a Good Test

✅ **Tests business logic**, not implementation details  
✅ **Independent** - can run in any order  
✅ **Fast** - completes in milliseconds  
✅ **Clear intent** - obvious what's being tested  
✅ **Proper cleanup** - resets state between tests  
✅ **Meaningful assertions** - verifies actual behavior

### What to Avoid

❌ **Testing presentation logic** that TypeScript already validates  
❌ **Excessive mocking** that makes tests brittle  
❌ **Testing third-party libraries**  
❌ **Snapshot tests** without clear purpose  
❌ **Tests that require complex setup** for minimal value

## Test Results

Current status: **113/113 tests passing (100%)** ✅

Breakdown:

- `schemas.test.ts`: 43/43 passing
- `validation.test.ts`: 17/17 passing
- `projectStore.test.ts`: 29/29 passing
- `converters.test.ts`: 17/17 passing
- `workflows.test.ts`: 7/7 passing

## Future Testing Considerations

### Potential Additions

1. **E2E Tests**: Full application workflows with real Tauri backend
2. **Visual Regression**: Screenshot comparison for UI components
3. **Performance Tests**: Verify operations complete within time budgets
4. **Accessibility Tests**: axe-core integration for WCAG compliance

### Why Component Tests Were Removed

Component tests (MenuBar.test.tsx, LayerStack.test.tsx) were removed because:

- Required extensive mocking (Tauri, contexts, DnD library)
- Tested presentation logic already validated by TypeScript
- Business logic already covered by unit tests
- High maintenance burden for minimal value
- Made tests brittle and hard to understand

The decision aligns with testing best practices: focus on valuable tests that verify actual behavior, not implementation details.

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Invalid Chai property: toBeInTheDocument"  
**Solution**: Ensure `src/tests/setup.ts` is loaded and extends expect with jest-dom matchers

**Issue**: Integration tests fail with stale state  
**Solution**: Ensure `beforeEach` creates fresh project with `createEmptyProject()` and refresh state after mutations with `state = useProjectStore.getState()`

**Issue**: Schema validation tests fail unexpectedly  
**Solution**: Check that test data matches schema constraints exactly, including required fields and type constraints

### Debugging Tests

```bash
# Run tests with verbose output
npm test -- --reporter=verbose

# Run single test with debugging
npm test -- --reporter=verbose src/lib/schemas.test.ts -t "should validate"

# Check coverage for specific file
npm run test:coverage -- src/lib/schemas.ts
```

## Contributing

When adding new features:

1. Write tests **before** implementing (TDD)
2. Ensure tests are independent and fast
3. Cover edge cases and error conditions
4. Update this documentation if adding new test patterns
5. Verify all tests pass before committing
6. Aim for >70% coverage for new code
