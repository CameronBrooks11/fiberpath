# State Management Architecture

Complete guide to Zustand state management in FiberPath GUI.

## Overview

FiberPath GUI uses **Zustand** for centralized state management with a single store architecture. All project data, UI state, and metadata are managed through `projectStore.ts`.

## Why Single Store?

**Rationale:**

- GUI is project-centric (one project open at a time)
- No complex cross-entity relationships
- Simpler reasoning about state flow
- No store coordination overhead

**Alternative Considered:**
Split stores (projectStore, uiStore, streamStore) were analyzed but rejected because:

- Increased synchronization complexity
- No performance benefit at current scale
- Harder to reason about state dependencies

See `fiberpath_gui/docs-old/STORE_SPLITTING_ANALYSIS.md` for historical analysis.

## Store Structure

### State Schema

```typescript
interface ProjectState {
  // Project data
  project: FiberPathProject;

  // Project management
  loadProject: (project: FiberPathProject) => void;
  newProject: () => void;

  // Mandrel & Tow
  updateMandrel: (mandrel: Partial<Mandrel>) => void;
  updateTow: (tow: Partial<Tow>) => void;

  // Machine settings
  updateDefaultFeedRate: (feedRate: number) => void;
  setAxisFormat: (format: "xab" | "xyz") => void;

  // Layer operations
  addLayer: (type: LayerType) => string;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, props: Partial<Layer>) => void;
  reorderLayers: (startIndex: number, endIndex: number) => void;
  duplicateLayer: (id: string) => string;

  // UI state
  setActiveLayerId: (id: string | null) => void;

  // Dirty state
  markDirty: () => void;
  clearDirty: () => void;

  // File metadata
  setFilePath: (path: string | null) => void;
}
```

### FiberPathProject Type

```typescript
interface FiberPathProject {
  schemaVersion: "1.0";
  mandrel: Mandrel;
  tow: Tow;
  defaultFeedRate: number;
  axisFormat: "xab" | "xyz";
  layers: Layer[];
  activeLayerId: string | null;
  isDirty: boolean;
  filePath: string | null;
}
```

## Store Creation

### Definition (`src/state/projectStore.ts`)

```typescript
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const useProjectStore = create<ProjectState>()(
  devtools(
    (set, get) => ({
      project: createEmptyProject(),

      loadProject: (project) => {
        set({ project });
      },

      newProject: () => {
        set({ project: createEmptyProject() });
      },

      updateMandrel: (mandrel) => {
        set((state) => ({
          project: {
            ...state.project,
            mandrel: { ...state.project.mandrel, ...mandrel },
            isDirty: true,
          },
        }));
      },

      // ...more actions
    }),
    { name: "ProjectStore" } // DevTools name
  )
);
```

**Key Points:**

- `create()()` double-call syntax for middleware
- `devtools()` enables Redux DevTools integration
- `set()` accepts updater function for derived state
- `get()` available for accessing current state in actions

## Usage Patterns

### Component Access

#### ❌ Bad: Entire State

```typescript
function PlanForm() {
  const state = useProjectStore();  // Re-renders on ANY state change

  return <input value={state.project.mandrel.diameter} />;
}
```

**Problem:** Component re-renders when unrelated state changes (e.g., active layer).

#### ✅ Good: Shallow Selector

```typescript
import { shallow } from "zustand/shallow";

function PlanForm() {
  const mandrel = useProjectStore(
    (state) => state.project.mandrel,
    shallow
  );

  return <input value={mandrel.diameter} />;
}
```

**Benefit:** Re-renders only when `mandrel` object changes (reference equality).

#### ✅ Better: Primitive Selector

```typescript
function DiameterInput() {
  const diameter = useProjectStore(
    (state) => state.project.mandrel.diameter
  );

  return <input value={diameter} />;
}
```

**Benefit:** Re-renders only when `diameter` value changes.

#### ✅ Best: Multiple Selectors

```typescript
function PlanForm() {
  const diameter = useProjectStore((s) => s.project.mandrel.diameter);
  const windLength = useProjectStore((s) => s.project.mandrel.windLength);
  const updateMandrel = useProjectStore((s) => s.updateMandrel);

  return (
    <>
      <input value={diameter} onChange={(e) => updateMandrel({ diameter: +e.target.value })} />
      <input value={windLength} onChange={(e) => updateMandrel({ windLength: +e.target.value })} />
    </>
  );
}
```

**Benefit:** Each input re-renders independently.

### Action Patterns

#### Update Partial State

```typescript
updateMandrel: (mandrel: Partial<Mandrel>) => {
  set((state) => ({
    project: {
      ...state.project,
      mandrel: { ...state.project.mandrel, ...mandrel },
      isDirty: true,
    },
  }));
};
```

**Pattern:** Spread existing state + new values. Always mark `isDirty`.

#### Add to Array

```typescript
addLayer: (type: LayerType) => {
  const newLayer = createLayer(type);
  set((state) => ({
    project: {
      ...state.project,
      layers: [...state.project.layers, newLayer],
      activeLayerId: newLayer.id,
      isDirty: true,
    },
  }));
  return newLayer.id;
};
```

**Pattern:** Spread existing array + new item. Return new ID for UI.

#### Remove from Array

```typescript
removeLayer: (id: string) => {
  set((state) => {
    const layers = state.project.layers.filter((l) => l.id !== id);
    const activeLayerId =
      state.project.activeLayerId === id
        ? layers.length > 0
          ? layers[0].id
          : null
        : state.project.activeLayerId;

    return {
      project: {
        ...state.project,
        layers,
        activeLayerId,
        isDirty: true,
      },
    };
  });
};
```

**Pattern:** Filter array + update related state (active selection).

#### Reorder Array

```typescript
reorderLayers: (startIndex: number, endIndex: number) => {
  set((state) => {
    const layers = [...state.project.layers];
    const [removed] = layers.splice(startIndex, 1);
    layers.splice(endIndex, 0, removed);

    return {
      project: {
        ...state.project,
        layers,
        isDirty: true,
      },
    };
  });
};
```

**Pattern:** Clone array, mutate clone, replace in state.

### Computed Values

#### In Component

```typescript
function LayerCount() {
  const layerCount = useProjectStore((s) => s.project.layers.length);

  return <div>Total Layers: {layerCount}</div>;
}
```

**When:** Simple derivation, used in one place.

#### In Selector

```typescript
const useLayerCount = () =>
  useProjectStore((s) => s.project.layers.length);

function LayerCount() {
  const count = useLayerCount();
  return <div>Total Layers: {count}</div>;
}
```

**When:** Reused across multiple components.

#### In Store (if complex)

```typescript
getHelicalLayers: () => {
  const { project } = get();
  return project.layers.filter((l) => l.type === "helical");
};
```

**When:** Complex computation, needs store access.

## Testing Store

### Reset Before Each Test

```typescript
import { beforeEach } from "vitest";
import { useProjectStore } from "./projectStore";

beforeEach(() => {
  useProjectStore.setState({
    project: createEmptyProject(),
  });
});
```

### Test Actions

```typescript
it("should update mandrel diameter", () => {
  const store = useProjectStore.getState();

  store.updateMandrel({ diameter: 200 });

  expect(store.project.mandrel.diameter).toBe(200);
  expect(store.project.isDirty).toBe(true);
});
```

### Test Derived State

```typescript
it("should update active layer on removal", () => {
  const store = useProjectStore.getState();

  const layer1Id = store.addLayer("hoop");
  const layer2Id = store.addLayer("helical");

  store.setActiveLayerId(layer1Id);
  store.removeLayer(layer1Id);

  expect(store.project.activeLayerId).toBe(layer2Id);
});
```

## DevTools Integration

### Enable DevTools

```typescript
import { devtools } from "zustand/middleware";

export const useProjectStore = create<ProjectState>()(
  devtools(
    (set, get) => ({
      /* state */
    }),
    { name: "ProjectStore" }
  )
);
```

### Use in Browser

1. Install Redux DevTools extension
2. Run `npm run tauri dev`
3. Open DevTools → Redux panel
4. See all actions and state changes

**Benefits:**

- Time-travel debugging
- Action replay
- State inspection
- Performance monitoring

## Performance Optimization

### Shallow Comparison

```typescript
import { shallow } from "zustand/shallow";

const mandrel = useProjectStore((s) => s.project.mandrel, shallow);
```

**When:** Selecting object/array that recreates on every render.

### Memoization

```typescript
import { useMemo } from "react";

function LayerList() {
  const layers = useProjectStore((s) => s.project.layers);

  const sortedLayers = useMemo(
    () => [...layers].sort((a, b) => a.index - b.index),
    [layers]
  );

  return <div>{sortedLayers.map(/* render */)}</div>;
}
```

**When:** Expensive computation on store data.

### Splitting Selectors

```typescript
// ❌ Bad: One selector for multiple values
const { mandrel, tow } = useProjectStore(
  (s) => ({
    mandrel: s.project.mandrel,
    tow: s.project.tow,
  }),
  shallow
);

// ✅ Good: Separate selectors
const mandrel = useProjectStore((s) => s.project.mandrel, shallow);
const tow = useProjectStore((s) => s.project.tow, shallow);
```

**Benefit:** Independent re-render triggers.

## Migration from Redux

If coming from Redux:

| Redux             | Zustand               |
| ----------------- | --------------------- |
| `useSelector`     | `useStore(selector)`  |
| `useDispatch`     | Store action directly |
| `mapStateToProps` | Multiple selectors    |
| `combineReducers` | Single store          |
| Actions           | Methods on store      |
| Reducers          | `set()` calls         |
| Middleware        | Zustand middleware    |
| DevTools          | `devtools()` wrapper  |

## Common Pitfalls

### ❌ Mutating State

```typescript
updateLayer: (id, props) => {
  set((state) => {
    const layer = state.project.layers.find((l) => l.id === id);
    layer.props = { ...layer.props, ...props }; // Mutation!
    return state;
  });
};
```

**Fix:** Create new objects/arrays.

### ❌ Selecting Too Much

```typescript
const project = useProjectStore((s) => s.project); // Entire project
```

**Fix:** Select only what you need.

### ❌ Missing Dirty Flag

```typescript
updateMandrel: (mandrel) => {
  set((state) => ({
    project: {
      ...state.project,
      mandrel: { ...state.project.mandrel, ...mandrel },
      // Missing isDirty: true
    },
  }));
};
```

**Fix:** Always set `isDirty: true` on mutations.

## Next Steps

- [CLI Integration](cli-integration.md) - Store → CLI bridge
- [Schema Validation](../guides/schemas.md) - Zod integration
- [Testing Guide](../testing.md) - Store testing patterns
