# FiberPath v0.6.2 React Hotspot Cleanup Plan

**Document Type:** Focused implementation plan (post-v0.6.1 cleanup)  
**Target Release:** v0.6.2  
**Created:** 2026-04-07  
**Last Updated:** 2026-04-07  
**Owner:** GUI maintainers  
**Status:** Proposed

## Objective

Complete a targeted React cleanup pass that reduces maintenance risk and architectural drift before v0.6.2 implementation work begins.

## Audit Snapshot (Cross-Checked Against Current Code)

Evidence collected from the current `fiberpath_gui/src` tree on 2026-04-07:

| Signal | Value |
| --- | ---: |
| TSX LOC total | 4772 |
| Largest TSX file | `components/StreamTab/FileStreamingSection.tsx` (395 LOC) |
| Additional large TSX files | `MenuBar.tsx` (362), `HelicalLayerEditor.tsx` (342), `ConnectionSection.tsx` (275), `VisualizationCanvas.tsx` (234), `App.tsx` (234) |
| `useEffect(...)` call sites in TSX | 11 |
| Zustand store-hook call sites (`useProjectStore/useStreamStore/useToastStore`) | 30 |
| Tauri `invoke(...)` call sites | 15 |
| Tauri `listen(...)` call sites | 1 |
| Remaining inline style instances | 1 (`FileStreamingSection.tsx`) |
| `createFileOperations(...)` wiring sites | 2 (`App.tsx`, `MenuBar.tsx`) |
| `alert(...)` usage in UI code | 2 (`CliUnavailableDialog.tsx`) |
| Imports from `state/projectStore` | 14 |
| StreamTab wrapper import sites (`components/tabs/StreamTab`) | 1 (`App.tsx`) |

Primary finding: styling entropy is already significantly reduced; remaining risk is concentrated in React responsibility density and boundary inconsistency.

---

## Priority Hotspots

### P0 - Streaming control decomposition

**Files:**
- `src/components/StreamTab/FileStreamingSection.tsx`
- `src/components/StreamTab/ConnectionSection.tsx`
- `src/components/StreamTab/ManualControlSection.tsx`
- `src/hooks/useStreamEvents.ts`

**Why this remains high-risk:**
- Stream UI components mix rendering, domain transitions, toast policy, and logging behavior.
- Async control patterns are repeated across handlers (`loading`, `try/catch`, status reset, user feedback).

**Cleanup actions:**
- Extract action hooks: `useConnectionActions`, `useStreamingActions`, `useManualCommandActions`.
- Move transition semantics into named store actions (`markConnected`, `markPaused`, `markDisconnected`, `resetAfterCancel`).
- Centralize stream toast/log mapping in helper modules.

**Exit criteria:**
- No stream section component exceeds 250 LOC.
- Components do not mutate stream status flags directly; they call named actions.
- Lifecycle behavior is covered by tests for connect, start, pause/resume, cancel, stop, and error.

### P0 - File/menu orchestration duplication

**Files:**
- `src/components/MenuBar.tsx`
- `src/App.tsx`
- `src/lib/fileOperations.ts`

**Why this remains high-risk:**
- File operation wiring is duplicated in two high-level components.
- Menu rendering and menu behavior are tightly coupled in one large component.

**Cleanup actions:**
- Introduce `useFileOperations` adapter hook as the single wiring entrypoint.
- Move menu definitions to typed config (id, label, shortcut, enabled state).
- Split menu rendering from menu behavior/dialog orchestration.

**Exit criteria:**
- `createFileOperations(...)` setup is defined once and reused.
- `MenuBar.tsx` is reduced below 250 LOC.
- Menu behavior is covered by focused tests for action dispatch and enabled states.

### P1 - Store boundary drift

**Files:**
- `src/state/projectStore.ts`
- `src/stores/streamStore.ts`
- `src/stores/toastStore.ts`
- Current `state/projectStore` import consumers

**Why this is still a hotspot:**
- Project store path differs from other stores, producing avoidable import inconsistency.

**Cleanup actions:**
- Move project store to `src/stores/projectStore.ts`.
- Add `src/stores/index.ts` barrel.
- Migrate app and tests away from `state/projectStore` imports.

**Exit criteria:**
- Zero `state/projectStore` imports remain.
- Store imports are consistent across app and tests.

### P1 - Editor/form validation duplication

**Files:**
- `src/components/editors/HelicalLayerEditor.tsx`
- `src/components/forms/MandrelForm.tsx`
- `src/components/forms/TowForm.tsx`
- `src/components/forms/MachineSettingsForm.tsx`

**Why this is still a hotspot:**
- Numeric parsing, blur validation, and error-state wiring are repeated.
- Helical validation logic is embedded in a large component.

**Cleanup actions:**
- Extract shared numeric input helpers and validation utilities.
- Move helical-specific domain rules to dedicated validation module.
- Reuse shared field-row render primitives for input/unit/error patterns.

**Exit criteria:**
- Shared helpers are used across all parameter forms.
- `HelicalLayerEditor` is split into domain logic + presentational sections.
- Tests cover invalid numeric and cross-field rule cases.

### P1 - Visualization preview orchestration density

**File:**
- `src/components/canvas/VisualizationCanvas.tsx`

**Why this is still a hotspot:**
- One component currently owns conversion, validation, async request lifecycle, and UI states.

**Cleanup actions:**
- Extract `usePreviewGeneration` orchestration hook.
- Split render states (empty, loading, error, warning) into small components.
- Guard against stale preview responses (latest-request wins behavior).

**Exit criteria:**
- `VisualizationCanvas` primarily composes UI.
- Async preview race safety is explicit and tested.

### P2 - Dialog consistency and imperative UI fallbacks

**Files:**
- `src/components/dialogs/CliUnavailableDialog.tsx`
- `src/components/dialogs/DiagnosticsDialog.tsx`
- `src/components/dialogs/ExportConfirmationDialog.tsx`

**Why this remains cleanup-worthy:**
- Dialog shell mechanics are repeated.
- `alert(...)` bypasses standard app-level notification patterns.

**Cleanup actions:**
- Create shared `BaseDialog` shell for portal/overlay/header/footer behavior.
- Replace `alert(...)` calls with app-consistent notifications.

**Exit criteria:**
- Dialog shell behavior is centralized.
- No `alert(...)` calls remain in React UI code.

### P2 - StreamTab path indirection

**Files:**
- `src/components/tabs/StreamTab.tsx` (wrapper)
- `src/components/StreamTab/*` (implementation)

**Why this remains cleanup-worthy:**
- Wrapper exists only for import compatibility and increases path ambiguity.

**Cleanup actions:**
- Standardize to one canonical StreamTab import path.
- Remove wrapper after migration.

**Exit criteria:**
- Single authoritative StreamTab module path remains.

---

## Execution Waves (v0.6.2)

### Wave A - Structural fast wins

- [ ] Move `projectStore` to `src/stores/` and update imports.
- [ ] Remove StreamTab wrapper indirection after import update.
- [ ] Remove remaining inline style usage in `FileStreamingSection`.

### Wave B - Stream domain cleanup

- [ ] Extract stream action hooks and named transition actions.
- [ ] Consolidate stream toast/log policy helpers.
- [ ] Add stream lifecycle integration tests.

### Wave C - App/menu/file-operation cleanup

- [ ] Introduce `useFileOperations` adapter.
- [ ] Split `MenuBar` behavior from rendering; move menu definitions to config.
- [ ] Keep `App` focused on high-level composition only.

### Wave D - Editors/canvas/dialog hardening

- [ ] Extract form/editor validation helpers.
- [ ] Decompose `HelicalLayerEditor` and `VisualizationCanvas`.
- [ ] Introduce `BaseDialog` and remove `alert(...)` fallbacks.

---

## Definition of Done for v0.6.2

- [ ] Largest React hotspots are decomposed to maintainable size (target < 250 LOC where practical).
- [ ] Architectural drift points are removed (`state/` vs `stores/`, StreamTab wrapper indirection, ad-hoc alerts).
- [ ] Stream and file/menu behavior is validated with tests at behavior boundaries.
- [ ] No regressions in `npm run test`, `npm run build`, and `npm run check:all`.

## Out of Scope

- Framework migration (already no-go in migration evaluation).
- Net-new product features unrelated to cleanup/hardening.
- Visual redesign work beyond minor structural UI refactors needed to complete cleanup.
