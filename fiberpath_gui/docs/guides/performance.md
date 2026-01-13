# Performance Guide

Complete guide to profiling and optimizing FiberPath GUI performance.

## Overview

FiberPath GUI is designed for responsiveness with lazy loading, memoization, and optimized renders. This guide covers profiling tools and optimization patterns.

## Profiling Tools

### React DevTools Profiler

**Installation:**

1. Install React DevTools extension (Chrome/Firefox)
2. Open DevTools → React tab → Profiler

**Recording a Session:**

1. Click record button (red circle)
2. Perform actions in GUI (e.g., add layers, update mandrel)
3. Stop recording
4. Analyze flamegraph

**Reading Flamegraph:**

- **Width:** Time spent rendering
- **Color:** Fast (green) vs slow (yellow/red)
- **Tooltip:** Component name, render duration
- **Drill down:** Click to see child components

**Example Findings:**

```text
PlanForm (12ms)
├─ MandrelSection (3ms)
├─ TowSection (2ms)
└─ LayerManager (7ms)
   └─ LayerItem (1ms × 7 layers)
```

### Chrome Performance Tab

**Recording:**

1. Open DevTools → Performance tab
2. Click record
3. Perform actions
4. Stop recording

**Analysis:**

- **Main thread:** JavaScript execution, layout, paint
- **Frames:** Green = good (60fps), red = dropped frames
- **Summary:** Time breakdown (scripting, rendering, painting)

**Look for:**

- Long tasks (>50ms)
- Layout thrashing
- Excessive repaints

### Vite Build Analyzer

**Analyze Bundle Size:**

```sh
npm run build
```

Generates `dist/assets/*.js` files with size reports.

**Identify Large Dependencies:**

```sh
npx vite-bundle-visualizer
```

Opens interactive visualization of bundle contents.

## Optimization Patterns

### 1. Memoization

#### useMemo for Expensive Computations

```typescript
import { useMemo } from 'react';

function LayerList() {
  const layers = useProjectStore((s) => s.project.layers);

  // ✅ Memoize expensive sort
  const sortedLayers = useMemo(
    () => [...layers].sort((a, b) => a.index - b.index),
    [layers]
  );

  return <div>{sortedLayers.map(/* render */)}</div>;
}
```

**When to use:**

- Sorting/filtering large arrays
- Complex calculations
- Object transformations

**When NOT to use:**

- Simple array maps (no transformation)
- Cheap operations (<1ms)

#### React.memo for Component Memoization

```typescript
import { memo } from 'react';

const LayerItem = memo(function LayerItem({ layer }: { layer: Layer }) {
  return <div>{layer.windType}: {layer.terminal ? 'Terminal' : 'Non-terminal'}</div>;
});
```

**Behavior:** Re-renders only if props change (shallow comparison).

**Use Cases:**

- List items that rarely update
- Expensive child components
- Pure presentation components

**Avoid for:**

- Components with frequent updates
- Components with object/array props (use custom comparison)

#### Custom Comparison

```typescript
const LayerItem = memo(
  function LayerItem({ layer }: { layer: Layer }) {
    return <div>...</div>;
  },
  (prevProps, nextProps) => {
    // Return true if props are equal (skip re-render)
    return prevProps.layer.id === nextProps.layer.id &&
           prevProps.layer.windType === nextProps.layer.windType;
  }
);
```

### 2. Zustand Shallow Selectors

```typescript
import { shallow } from "zustand/shallow";

// ❌ Bad: Re-renders on any state change
const state = useProjectStore();

// ✅ Good: Re-renders only when mandrel changes
const mandrel = useProjectStore((s) => s.project.mandrel, shallow);

// ✅ Better: Re-renders only when diameter changes
const diameter = useProjectStore((s) => s.project.mandrel.diameter);
```

**Shallow Comparison:**

- Compares object keys/values one level deep
- Prevents re-renders when object reference changes but content doesn't

**Best Practice:** Use primitive selectors when possible.

### 3. Virtualization (for Large Lists)

**Library:** `react-window` or `react-virtual`

```typescript
import { FixedSizeList } from 'react-window';

function LargeLayerList({ layers }: { layers: Layer[] }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={layers.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <LayerItem layer={layers[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

**Use Case:** Lists with 100+ items.

### 4. Debouncing

```typescript
import { useState, useEffect } from 'react';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
function DiameterInput() {
  const [diameter, setDiameter] = useState(150);
  const debouncedDiameter = useDebounce(diameter, 300);
  const updateMandrel = useProjectStore((s) => s.updateMandrel);

  useEffect(() => {
    updateMandrel({ diameter: debouncedDiameter });
  }, [debouncedDiameter]);

  return (
    <input
      type="number"
      value={diameter}
      onChange={(e) => setDiameter(Number(e.target.value))}
    />
  );
}
```

**Use Cases:**

- Search inputs
- Slider controls
- Auto-save

### 5. Code Splitting

```typescript
import { lazy, Suspense } from 'react';

// ✅ Lazy load heavy components
const PlotPanel = lazy(() => import('./components/PlotPanel'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlotPanel />
    </Suspense>
  );
}
```

**Benefit:** Reduces initial bundle size, faster startup.

### 6. Event Handler Optimization

```typescript
// ❌ Bad: Creates new function on every render
function PlanForm() {
  const updateMandrel = useProjectStore((s) => s.updateMandrel);

  return (
    <input onChange={(e) => updateMandrel({ diameter: Number(e.target.value) })} />
  );
}

// ✅ Good: Stable function reference
import { useCallback } from 'react';

function PlanForm() {
  const updateMandrel = useProjectStore((s) => s.updateMandrel);

  const handleDiameterChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      updateMandrel({ diameter: Number(e.target.value) });
    },
    [updateMandrel]
  );

  return <input onChange={handleDiameterChange} />;
}
```

**When to use:** When handler is passed to memoized child component.

## Common Performance Issues

### Issue: Excessive Re-renders

**Symptom:** Component renders multiple times per user action.

**Diagnosis:**

```typescript
import { useEffect } from "react";

function MyComponent() {
  useEffect(() => {
    console.log("MyComponent rendered");
  });

  // ...
}
```

**Causes:**

- Selecting entire store instead of specific values
- Creating objects/arrays in render
- Prop changes triggering cascade

**Solution:**

- Use shallow selectors
- Memoize derived data
- Use React.memo for expensive children

### Issue: Slow List Rendering

**Symptom:** Adding layer takes >500ms.

**Diagnosis:** Profile in React DevTools, check LayerManager duration.

**Solutions:**

- Add `key` prop to list items (use stable IDs)
- Memoize LayerItem component
- Virtualize if 100+ items

### Issue: Large Bundle Size

**Symptom:** Initial load >5 seconds.

**Diagnosis:** Run `npx vite-bundle-visualizer`.

**Solutions:**

- Code split heavy components (PlotPanel)
- Tree-shake unused dependencies
- Use dynamic imports for CLI-heavy features

### Issue: Memory Leaks

**Symptom:** Memory grows over time, app becomes sluggish.

**Diagnosis:** Chrome DevTools → Memory → Heap Snapshot.

**Common Causes:**

- Event listeners not cleaned up
- Timers not cleared
- Zustand subscriptions not unsubscribed

**Solution:**

```typescript
useEffect(() => {
  const unlisten = listen("stream-progress", handleProgress);

  return () => {
    unlisten(); // Cleanup
  };
}, []);
```

## Performance Budgets

### Target Metrics

| Metric                 | Target | Critical |
| ---------------------- | ------ | -------- |
| First Contentful Paint | <1s    | <2s      |
| Time to Interactive    | <2s    | <3s      |
| Component Render       | <16ms  | <50ms    |
| Store Update           | <5ms   | <16ms    |
| Bundle Size (JS)       | <500KB | <1MB     |
| Memory Usage (idle)    | <100MB | <200MB   |

### Measuring

```typescript
// Render time
performance.mark("render-start");
// ...component render
performance.mark("render-end");
performance.measure("render", "render-start", "render-end");

const [measure] = performance.getEntriesByName("render");
console.log(`Render took ${measure.duration.toFixed(2)}ms`);
```

## Optimizing Tauri Commands

### Async All the Things

```typescript
// ❌ Bad: Blocking UI
const result = await planWind(inputPath);
setResult(result);

// ✅ Good: Show loading state
setIsLoading(true);
const result = await planWind(inputPath);
setResult(result);
setIsLoading(false);
```

### Debounce Preview Updates

```typescript
const debouncedScale = useDebounce(scale, 300);

useEffect(() => {
  if (gcodePath) {
    plotPreview(gcodePath, debouncedScale).then(setPreview);
  }
}, [gcodePath, debouncedScale]);
```

**Prevents:** Rapid fire CLI calls on slider drag.

## Testing Performance

### Automated Performance Tests

```typescript
import { render } from '@testing-library/react';
import { performance } from 'perf_hooks';

it('should render LayerList in <50ms', () => {
  const layers = Array.from({ length: 100 }, (_, i) => createLayer('hoop'));

  const start = performance.now();
  render(<LayerList layers={layers} />);
  const end = performance.now();

  expect(end - start).toBeLessThan(50);
});
```

### Synthetic Benchmarks

```typescript
describe("Store performance", () => {
  it("should handle 1000 layer adds in <100ms", () => {
    const store = useProjectStore.getState();

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      store.addLayer("hoop");
    }
    const end = performance.now();

    expect(end - start).toBeLessThan(100);
  });
});
```

## Profiling Checklist

Before optimizing:

- [ ] Profile with React DevTools Profiler
- [ ] Identify slowest component (>50ms)
- [ ] Check if component re-renders unnecessarily
- [ ] Verify selector granularity (primitive vs object)
- [ ] Check for inline object/array creation
- [ ] Confirm keys on list items are stable

After optimizing:

- [ ] Re-profile to verify improvement
- [ ] Test edge cases (100+ layers, large files)
- [ ] Ensure no new bugs introduced
- [ ] Document optimization in code comments

## Resources

- [React DevTools Profiler Docs](https://react.dev/reference/react/Profiler)
- [Zustand Performance Tips](https://docs.pmnd.rs/zustand/guides/performance)
- [Web Vitals](https://web.dev/vitals/)

## Next Steps

- [State Management](../architecture/state-management.md) - Optimizing store access
- [Tech Stack](../architecture/tech-stack.md) - Understanding Vite optimizations
- [Testing Guide](../testing.md) - Performance testing patterns
