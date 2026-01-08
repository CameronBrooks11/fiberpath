# Store Splitting Analysis

## Current Store Structure

The application currently uses a single Zustand store (`projectStore.ts`) that manages:

1. **Project Data** (~70% of state):
   - Mandrel parameters (diameter, wind_length)
   - Tow parameters (width, thickness)
   - Layers array (can be large with many layers)
   - Machine settings (defaultFeedRate, axisFormat)

2. **UI State** (~15% of state):
   - activeLayerId (which layer is selected)
   
3. **Metadata** (~15% of state):
   - filePath (current project file location)
   - isDirty flag (unsaved changes indicator)

## Performance Analysis

### Current Performance Characteristics

**Strengths:**
- ✅ Single source of truth for project data
- ✅ Simple mental model - everything in one place
- ✅ Easy to serialize entire project for save/load
- ✅ No need to sync multiple stores
- ✅ Shallow selectors already implemented (Phase 3)

**Potential Issues:**
- ⚠️ Updating activeLayerId causes any component selecting `project` to re-render
- ⚠️ Updating isDirty could trigger unnecessary renders
- ⚠️ Large layer arrays might cause performance issues at scale (50+ layers)

### Render Trigger Analysis

With current implementation (after Phase 3 optimizations):

| Action | Components That Re-render | Severity |
|--------|---------------------------|----------|
| Change activeLayerId | StatusBar (unnecessary), Components selecting full `project` | 🟡 Low |
| Mark dirty | StatusBar (necessary), Components selecting full `project` | 🟡 Low |
| Update layer | Layer editor, VisualizationCanvas (debounced) | 🟢 Expected |
| Add/remove layer | LayerStack, StatusBar, VisualizationCanvas | 🟢 Expected |
| Update mandrel/tow | Forms, VisualizationCanvas (debounced) | 🟢 Expected |

## Store Splitting Recommendation

### **Recommendation: DO NOT SPLIT (Yet)**

**Rationale:**

1. **Current optimizations are sufficient:**
   - Shallow selectors prevent most unnecessary renders
   - useMemo prevents function recreation
   - No reported performance issues

2. **Complexity vs Benefit:**
   - Splitting would require:
     - Syncing dirty state across stores
     - More complex save/load logic
     - Potential race conditions between stores
   - Benefit: Minor render reduction in edge cases

3. **Scale considerations:**
   - Current architecture handles 20-30 layers easily
   - If users need 100+ layers, then reconsider
   - Can measure: "Do 50-layer projects feel slow?"

4. **Alternative optimizations available:**
   - React.memo for expensive components
   - Virtualization for layer list (if needed)
   - Memoization of expensive computations

### When to Reconsider Splitting

Consider splitting if:
- ✅ Profiling shows frequent unnecessary renders of StatusBar/MenuBar
- ✅ Users report lag with >50 layers
- ✅ activeLayerId changes cause visible performance issues
- ✅ File operations (save/load) become slow due to store size

### Proposed Split (If Needed in Future)

If splitting becomes necessary, use this structure:

```typescript
// 1. projectDataStore.ts - Core project data (90% of updates)
{
  mandrel: Mandrel,
  tow: Tow,
  layers: Layer[],
  defaultFeedRate: number,
  axisFormat: AxisFormat,
  // Actions: updateMandrel, updateTow, addLayer, etc.
}

// 2. uiStore.ts - UI-only state (frequent, non-persisted updates)
{
  activeLayerId: string | null,
  leftPanelCollapsed: boolean,
  rightPanelCollapsed: boolean,
  // Actions: setActiveLayerId, togglePanels
}

// 3. metadataStore.ts - File metadata (infrequent updates)
{
  filePath: string | null,
  isDirty: boolean,
  // Actions: setFilePath, markDirty, clearDirty
}
```

**Benefits of this split:**
- activeLayerId changes don't trigger data store subscribers
- UI state doesn't get saved to .wind files
- Metadata updates isolated from render-heavy components

**Costs:**
- Need to mark dirty across stores (e.g., projectDataStore updates must trigger metadataStore.markDirty)
- Save/load logic must combine stores
- More complex debugging (which store has the bug?)

## Current Optimization Status

After Phase 3 completion:
- ✅ Shallow comparison on all multi-selector components
- ✅ useMemo for expensive factory functions
- ✅ Proper selector patterns (select only what's needed)
- ✅ Profiling guide created for monitoring

**Performance is already good. Monitor, don't optimize prematurely.**

## Action Items

### Immediate (Phase 3 ✅)
- [x] Implement shallow selectors
- [x] Add useMemo for fileOperations
- [x] Create profiling documentation

### Short-term (Next 2-4 weeks)
- [ ] Profile with React DevTools in production-like scenarios
- [ ] Test with 50+ layer projects
- [ ] Measure render counts during typical workflows

### Long-term (If Issues Arise)
- [ ] Consider store splitting based on profiling data
- [ ] Implement virtualization for layer list
- [ ] Add React.memo to expensive components

## Monitoring Metrics

Track these to determine if splitting is needed:

1. **Render counts**: How many components update per user action?
   - Target: <20 components per interaction
   - Alert: >50 components per interaction

2. **Render duration**: How long do updates take?
   - Target: <16ms (60 FPS)
   - Alert: >50ms (noticeable lag)

3. **User-reported issues**:
   - "App feels sluggish with many layers"
   - "Typing in forms feels delayed"
   - "Drag-drop is laggy"

## Conclusion

**The current single-store architecture with Phase 3 optimizations is appropriate for the application's current scale and complexity.**

Store splitting would be premature optimization at this stage. The implemented shallow selectors and memoization provide the benefits of splitting without the complexity costs.

Revisit this decision if profiling reveals specific bottlenecks or users report performance issues with large projects.
