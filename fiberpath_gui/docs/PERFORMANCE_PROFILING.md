# React Performance Profiling Guide

This guide explains how to profile the FiberPath GUI for performance issues using React DevTools.

## Setup

1. **Install React DevTools Browser Extension**
   - Chrome: [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
   - Firefox: [React Developer Tools](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)
   - Edge: Available in Edge Add-ons store

2. **Enable Profiling Mode**
   - Open the Tauri dev app: `npm run tauri dev`
   - Open browser DevTools (F12)
   - Click on "Profiler" tab (appears after installing React DevTools)

## Profiling Workflow

### 1. Record Performance

1. Click the **Record** button (red circle) in the Profiler tab
2. Perform the actions you want to profile:
   - Adding layers
   - Editing layer properties
   - Drag-and-drop reordering
   - Opening/saving files
   - Generating visualizations
3. Click **Stop** to end recording

### 2. Analyze Results

**Flamegraph View:**

- Shows component render tree
- Width = time spent rendering
- Color:
  - **Green/Yellow**: Fast renders (<5ms)
  - **Orange**: Moderate renders (5-10ms)
  - **Red**: Slow renders (>10ms)

**Ranked View:**

- Lists components by render duration
- Focus on top offenders first

**Component View:**

- Shows why a component re-rendered
- Look for:
  - "Props changed" (which props?)
  - "State changed" (expected?)
  - "Parent rendered" (can we optimize?)

### 3. Common Issues to Look For

#### Unnecessary Re-renders

- Components rendering without prop/state changes
- Parent updates triggering child updates unnecessarily
- **Fix**: Use `React.memo()`, `useMemo()`, `useCallback()`

#### Expensive Computations

- Heavy calculations in render functions
- Large data transformations on every render
- **Fix**: Use `useMemo()` to cache results

#### Large Render Trees

- Deep component hierarchies rendering together
- Many child components updating simultaneously
- **Fix**: Split into smaller components, use virtualization

#### State Management Issues

- Zustand store updates causing cascading renders
- Subscribing to entire store objects instead of specific values
- **Fix**: Use shallow comparison, select only needed values

## Performance Targets

### Acceptable Render Times

- **Interactive components** (buttons, inputs): <5ms
- **List items** (layer rows): <10ms
- **Complex panels** (layer editors, forms): <16ms (60 FPS)
- **Full app renders**: <50ms

### Red Flags

- ⚠️ Component rendering >50ms
- ⚠️ More than 100 components rendering per user action
- ⚠️ Same component rendering multiple times in one update
- ⚠️ Renders triggered by unrelated state changes

## Current Optimizations

### Implemented in Phase 3

1. **useMemo for createFileOperations** (App.tsx, MenuBar.tsx)
   - Prevents recreation of file operation handlers on every render
2. **Shallow comparison for Zustand selectors**
   - App.tsx: Multiple store values with shallow comparison
   - MenuBar.tsx: Multiple store values with shallow comparison
   - LayerStack.tsx: 7 selectors combined with shallow
   - StatusBar.tsx: Only extracts needed fields with shallow

### Areas Already Optimized

- **Layer rendering**: Individual layer rows are isolated components
- **Form inputs**: Controlled components with local state where appropriate
- **Canvas updates**: Debounced preview generation

## Profiling Specific Scenarios

### Test Case 1: Adding Layers

**Expected behavior:**

- LayerStack should re-render
- New LayerRow should render once
- Other components should NOT re-render

**Profile:**

```text
1. Record
2. Click "Add Layer" → Select "Helical"
3. Stop recording
4. Check: Did App.tsx re-render? (should not)
```

### Test Case 2: Editing Layer Properties

**Expected behavior:**

- Active layer editor should re-render
- VisualizationCanvas may re-render (debounced)
- LayerStack should NOT re-render

**Profile:**

```text
1. Record
2. Change wind_angle in HelicalLayerEditor
3. Stop recording
4. Check: Did unrelated components update?
```

### Test Case 3: Drag-Drop Reordering

**Expected behavior:**

- LayerStack re-renders
- All LayerRow components may update (indices change)
- Forms/editors should NOT re-render

**Profile:**

```text
1. Record
2. Drag layer from position 2 to position 5
3. Stop recording
4. Check render count and duration
```

## Next Steps if Issues Found

1. **Identify bottleneck** from profiler
2. **Check selector usage** - Using shallow where needed?
3. **Verify memoization** - Are callbacks/objects recreated?
4. **Consider React.memo** - For pure presentational components
5. **Check effect dependencies** - Are effects running too often?

## Tools for Advanced Profiling

- **React DevTools Profiler**: Component-level profiling
- **Chrome Performance Tab**: Overall app performance, including Tauri
- **Why Did You Render**: Library to detect unnecessary re-renders
- **React Query DevTools**: If we add data fetching/caching

## Resources

- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)
- [Optimizing Performance](https://react.dev/learn/render-and-commit)
- [Zustand Performance Tips](https://docs.pmnd.rs/zustand/guides/performance)
