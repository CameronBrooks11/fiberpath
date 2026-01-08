# FiberPath GUI Rehaul - Implementation Plan

## Context & Motivation

The desktop GUI currently provides a workflow for planning/plotting/simulating/streaming existing `.wind` files, but lacks:

1. **Axis format selection** - CLI/API expose `--axis-format xyz|xab`, GUI does not (v0.2.0 feature gap)
2. **Wind file creation** - Users must hand-write JSON, no guided form-based builder
3. **Validation feedback** - Errors only shown after plan failure, no pre-validation
4. **Advanced controls** - Missing options for output path customization, machine limits, etc.

This rehaul aims to achieve **feature parity** with CLI/API and provide a **superior UX** for composite winding workflows.

---

## Phase 1: Foundation - Axis Format Integration & Core Improvements

### 1.1 Add Axis Format Selection to Plan Panel

**Problem:** Users cannot choose between XAB (rotational) and XYZ (legacy) formats despite backend support.

**Requirements:**

- Dropdown/toggle control in Plan panel UI
- Default to `xab` (current behavior) with clear labeling
- Tooltip explaining: "XAB: Standard rotational axes (A=mandrel deg, B=delivery deg). XYZ: Legacy linear mode for Cyclone compatibility."
- Display selected format in result card after planning

**Files to Modify:**

- `fiberpath_gui/src/App.tsx`: Add state for axis format, pass to handler
- `fiberpath_gui/src/lib/commands.ts`: Update `planWind()` signature to accept optional `axisFormat` parameter
- `fiberpath_gui/src-tauri/src/main.rs`: Accept `axis_format: Option<String>` in `plan_wind` command, conditionally append `--axis-format` flag
- `fiberpath_gui/src/components/ResultCard.tsx` (if exists) or inline: Display axis format in plan results

**Validation:**

- Test XAB format produces A/B axes in G-code
- Test XYZ format produces Y/Z axes in G-code
- Verify default behavior matches CLI default (xab)

**Risks:**

- Rust command arg building must handle Option type correctly
- TypeScript type safety for literal "xyz" | "xab"

### 1.2 Enhance File Path Handling

**Problem:**

- Temp files not cleaned up automatically
- Output path generation opaque to user
- No validation of path write permissions

**Requirements:**

- Show generated output path in Plan results even when auto-generated
- Add "Open output folder" button next to results
- Implement temp file cleanup on app close or explicit clear
- Validate output directory is writable before planning

**Files to Modify:**

- `fiberpath_gui/src/App.tsx`: Add folder open handler
- `fiberpath_gui/src-tauri/src/main.rs`: Add `open_folder` command using shell plugin
- `fiberpath_gui/src-tauri/Cargo.toml`: Ensure shell plugin with folder opening capability

**Risks:**

- Cross-platform path handling (Windows vs Unix)
- Permission errors on read-only directories

### 1.3 Improve Input Validation & Error Messages

**Problem:**

- Generic error messages don't guide users to fix issues
- No client-side validation before expensive backend calls

**Requirements:**

- File extension validation before submission
- Path existence checks with helpful "file not found" messages
- Parse validation errors from CLI JSON output and display field-level feedback
- Add "Validate" button in Plan panel that checks .wind file without planning

**Files to Modify:**

- `fiberpath_gui/src/App.tsx`: Add pre-submission validation
- `fiberpath_gui/src/lib/commands.ts`: Add `validateWind()` function calling CLI validate command
- `fiberpath_cli/validate.py`: Ensure JSON output mode exists (check existing)

**Validation:**

- Test with invalid .wind file (malformed JSON, missing fields, bad values)
- Verify error messages map to specific fields

**Risks:**

- CLI validate command might not have --json mode yet
- Error message parsing fragile if CLI output format changes

---

## Phase 2: Wind File Builder - Core Architecture

### 2.1 Design Component Architecture

**Problem:** Building nested `.wind` JSON by hand is error-prone and requires schema knowledge.

**Requirements:**

- **Wizard-style flow:** Mandrel → Tow → Layers → Review
- **Type-safe forms:** Leverage existing `fiberpath.config.schemas` Pydantic models
- **Layer management:** Add/remove/reorder layers with layer-specific forms
- **Live validation:** Highlight invalid fields immediately
- **Preview capability:** Show JSON preview before saving

**Component Hierarchy:**

```
WindBuilder (top-level wizard container)
├── StepIndicator (visual progress: 1/4 steps)
├── MandrelStep (diameter, windLength inputs)
├── TowStep (width, thickness inputs)
├── LayersStep (list of LayerCard components)
│   ├── LayerCard (collapsible card per layer)
│   │   ├── LayerTypeSelector (hoop/helical/skip dropdown)
│   │   ├── HoopLayerForm (terminal checkbox only)
│   │   ├── HelicalLayerForm (windAngle, patternNumber, skipIndex, etc.)
│   │   └── SkipLayerForm (mandrelRotation input)
│   └── AddLayerButton
└── ReviewStep (JSON preview, save button, validation summary)
```

**Files to Create:**

- `fiberpath_gui/src/components/windbuilder/WindBuilder.tsx` (main wizard)
- `fiberpath_gui/src/components/windbuilder/StepIndicator.tsx`
- `fiberpath_gui/src/components/windbuilder/MandrelStep.tsx`
- `fiberpath_gui/src/components/windbuilder/TowStep.tsx`
- `fiberpath_gui/src/components/windbuilder/LayersStep.tsx`
- `fiberpath_gui/src/components/windbuilder/LayerCard.tsx`
- `fiberpath_gui/src/components/windbuilder/forms/HoopLayerForm.tsx`
- `fiberpath_gui/src/components/windbuilder/forms/HelicalLayerForm.tsx`
- `fiberpath_gui/src/components/windbuilder/forms/SkipLayerForm.tsx`
- `fiberpath_gui/src/components/windbuilder/ReviewStep.tsx`

**State Management:**

- Use React Context or Zustand for wizard state (avoid prop drilling)
- Single source of truth: `WindDefinition` interface matching Pydantic schema
- Validation state tracked per field with error messages

**Risks:**

- Complex nested state updates (especially layer array mutations)
- Type mismatches between TypeScript interfaces and Python Pydantic models
- Reordering layers requires stable keys (not array index)

### 2.2 Implement Type-Safe Schema Bindings

**Problem:** TypeScript interfaces must match Python Pydantic schemas exactly.

**Requirements:**

- Generate TypeScript types from `fiberpath.config.schemas` using code generation or manual sync
- Use branded types for validated values (e.g., `PositiveFloat`)
- Client-side validation rules mirror Pydantic Field constraints

**Implementation Options:**

1. **Manual sync:** Copy schema to TypeScript interfaces, document drift risk in comments
2. **Code generation:** Use tool like `datamodel-code-generator` to generate TS from Pydantic
3. **Runtime validation:** Use Zod/Yup schemas that match Pydantic, validate on client

**Recommended Approach:** Manual sync with Zod for runtime validation (lighter weight, more control)

**Files to Create:**

- `fiberpath_gui/src/lib/schemas.ts` (TypeScript interfaces + Zod schemas)
- `fiberpath_gui/src/lib/validation.ts` (validation helpers)

**Validation Strategy:**

- Zod schema validates on each field change
- Aggregate errors at form level
- Show inline error messages below invalid fields
- Disable "Next" button until current step valid

**Risks:**

- Schema drift if Python models updated without updating TS
- Zod bundle size increase (acceptable for desktop app)

### 2.3 Build Layer Management System

**Problem:** Users need to add/remove/reorder multiple layers of different types.

**Requirements:**

- **Add layer:** Button opens type selector (hoop/helical/skip), inserts default config
- **Remove layer:** Delete button with confirmation for non-empty forms
- **Reorder layers:** Drag-and-drop or up/down arrow buttons
- **Duplicate layer:** Copy existing layer config for quick iteration
- **Collapse/expand:** Large forms should collapse to save space

**UX Patterns:**

- Use unique IDs (UUIDs) for layer keys, not array indices
- Visual layer numbering (1, 2, 3...) updates automatically
- Highlight active/invalid layers with border colors
- Show layer summary in collapsed state ("Helical: 45° angle, 8 passes")

**Files to Modify:**

- `LayersStep.tsx`: Manages layer array state, provides add/remove/reorder callbacks
- `LayerCard.tsx`: Collapsible card with drag handle, delete button, layer summary

**Libraries:**

- `react-beautiful-dnd` or `@dnd-kit/sortable` for drag-and-drop
- `uuid` for stable layer IDs

**Risks:**

- Drag-and-drop accessibility concerns
- State updates during drag must be smooth (no flicker)

---

## Phase 3: Wind File Builder - Forms & Validation

### 3.1 Implement Mandrel & Tow Parameter Forms

**Problem:** Need validated numeric inputs for physical parameters.

**Requirements:**

- **Mandrel Step:** Diameter (mm), Wind Length (mm) - both positive floats
- **Tow Step:** Width (mm), Thickness (mm) - both positive floats
- **Default Feed Rate:** Positive float (mm/min) - show in Tow step or separate step?
- Visual units (mm, mm/min) in labels or input suffixes
- Min/max bounds with helpful messages ("Diameter must be > 0")

**UI Components:**

- Labeled numeric input with validation
- Stepper buttons (±) for fine adjustment
- Unit suffix inside input (gray text)

**Files to Create:**

- `fiberpath_gui/src/components/common/NumericInput.tsx` (reusable validated number input)
- `fiberpath_gui/src/components/windbuilder/MandrelStep.tsx`
- `fiberpath_gui/src/components/windbuilder/TowStep.tsx`

**Validation Rules:**

- All values must be positive (> 0)
- Reasonable bounds: diameter 10-1000mm, length 100-5000mm, width 1-50mm, thickness 0.1-10mm
- Feed rate 100-100000 mm/min

**Risks:**

- Float precision display (show 2-3 decimal places)
- Localization (decimal separator varies by locale)

### 3.2 Implement Hoop Layer Form

**Problem:** Simplest layer type, only has `terminal` boolean.

**Requirements:**

- Single checkbox: "Terminal layer" (default false)
- Tooltip: "Terminal layers rotate mandrel only (no carriage movement)"
- No other fields needed

**Files to Create:**

- `fiberpath_gui/src/components/windbuilder/forms/HoopLayerForm.tsx`

**Validation:**

- No validation needed beyond type

**Risks:**

- None (trivial form)

### 3.3 Implement Helical Layer Form

**Problem:** Most complex layer type with 8+ fields.

**Requirements:**

- **Wind Angle:** Positive float (degrees), range 1-89
- **Pattern Number:** Positive integer, tooltip: "Number of complete rotations in pattern"
- **Skip Index:** Positive integer, tooltip: "Mandrel rotation offset between passes"
- **Lock Degrees:** Positive float (degrees), range 0-360
- **Lead In MM:** Positive float (mm)
- **Lead Out Degrees:** Positive float (degrees), range 0-360
- **Skip Initial Near Lock:** Optional boolean (checkbox), default null
- Group related fields with section headers

**Files to Create:**

- `fiberpath_gui/src/components/windbuilder/forms/HelicalLayerForm.tsx`

**UI Layout:**

```
[Pattern Parameters]
Wind Angle: [____] ° (1-89)
Pattern Number: [____] (integer)
Skip Index: [____] (integer)

[Lock & Lead Parameters]
Lock Degrees: [____] ° (0-360)
Lead In: [____] mm
Lead Out: [____] ° (0-360)

[Advanced]
☐ Skip Initial Near Lock
```

**Validation Rules:**

- Pattern number and skip index must be coprime (gcd = 1) - server-side check
- Wind angle < 90° (perpendicular would be hoop)
- All positive values

**Risks:**

- Coprime validation error message unclear to non-experts
- Too many fields overwhelming, needs good grouping/help text

### 3.4 Implement Skip Layer Form

**Problem:** Specialized layer type for mandrel-only rotation.

**Requirements:**

- **Mandrel Rotation:** Float (degrees), can be negative
- Tooltip: "Rotate mandrel to reposition for next layer (no fiber deposition)"
- No other fields

**Files to Create:**

- `fiberpath_gui/src/components/windbuilder/forms/SkipLayerForm.tsx`

**Validation:**

- Must be non-zero (otherwise pointless)
- Reasonable range: -720 to +720 degrees (2 full rotations)

**Risks:**

- None (simple form)

---

## Phase 4: Integration & Workflow

### 4.1 Add Wind Builder to Main App

**Problem:** Need to integrate wizard into existing four-panel layout.

**Requirements:**

- Add "Create Wind File" button in hero section or new panel
- Open wizard in modal overlay or replace main content
- On save, populate Plan panel input field with saved file path
- Support "Edit existing" mode by loading .wind file into wizard

**UI Flow:**

1. User clicks "Create Wind File" button
2. Modal opens with wizard at step 1
3. User completes steps 1-4, clicks "Save"
4. File picker opens for save location
5. Wind definition validated and saved
6. Modal closes, Plan panel input populated
7. User can immediately plan the new file

**Files to Modify:**

- `fiberpath_gui/src/App.tsx`: Add wizard modal state, trigger button
- `fiberpath_gui/src/components/windbuilder/WindBuilder.tsx`: Accept onSave callback

**Risks:**

- Modal z-index conflicts with existing UI
- Large wizard might need full-page mode on small screens

### 4.2 Implement Save/Load Wind Files

**Problem:** Users need to persist work and edit existing files.

**Requirements:**

- **Save flow:** Validate → Open file picker → Write JSON → Close wizard
- **Load flow:** Open file picker → Parse JSON → Populate wizard state → Show validation errors
- **Auto-save:** Optionally save draft to local storage every N seconds
- Handle parse errors gracefully (malformed JSON, missing fields)

**Tauri Commands Needed:**

- `save_wind_file(path: String, content: String)` - write JSON to disk
- `load_wind_file(path: String) -> String` - read JSON from disk
- Use existing dialog plugin for file pickers

**Files to Modify:**

- `fiberpath_gui/src/lib/commands.ts`: Add save/load functions
- `fiberpath_gui/src-tauri/src/main.rs`: Add save/load commands
- `fiberpath_gui/src/components/windbuilder/WindBuilder.tsx`: Wire up save/load handlers

**Risks:**

- File write permissions on protected directories
- Large files (many layers) might slow parsing
- Partial saves on error need rollback or temp file strategy

### 4.3 Add JSON Preview & Export

**Problem:** Users need to see raw JSON for debugging or external use.

**Requirements:**

- **Review step:** Show formatted JSON in read-only textarea
- **Copy button:** Copy JSON to clipboard
- **Syntax highlighting:** Use library for colorized JSON
- **Validation summary:** Show all errors/warnings before save

**Libraries:**

- `react-json-view` or `react-syntax-highlighter` for display
- Browser Clipboard API for copy

**Files to Create:**

- `fiberpath_gui/src/components/windbuilder/ReviewStep.tsx`

**Risks:**

- Large JSON (100+ layers) might render slowly
- Syntax highlighter bundle size

---

## Phase 5: Testing & Polish

### 5.1 Unit Tests for Forms & Validation

**Requirements:**

- Test each layer form with valid/invalid inputs
- Test Zod schema validation matches Pydantic constraints
- Test layer add/remove/reorder operations
- Test save/load round-trip (save file → load file → compare state)

**Files to Create:**

- `fiberpath_gui/src/components/windbuilder/__tests__/MandrelStep.test.tsx`
- `fiberpath_gui/src/components/windbuilder/__tests__/LayersStep.test.tsx`
- `fiberpath_gui/src/components/windbuilder/__tests__/HelicalLayerForm.test.tsx`
- `fiberpath_gui/src/lib/__tests__/schemas.test.ts`

**Tools:**

- Vitest (Vite's test runner)
- React Testing Library
- Mock Tauri API calls

### 5.2 Integration Tests

**Requirements:**

- End-to-end wizard flow: create file → save → load → plan
- Test with actual backend (spin up temp Python env)
- Cross-platform smoke tests (Windows/macOS/Linux)

**Test Scenarios:**

1. Simple cylinder (1 hoop layer)
2. Helical tube (2 helical layers)
3. Complex multi-layer (10+ mixed layers)
4. Invalid inputs (missing fields, bad ranges)

**Files to Create:**

- `fiberpath_gui/tests/e2e/wind-builder.spec.ts` (if using Playwright/Cypress)

### 5.3 UI/UX Polish

**Requirements:**

- Consistent spacing, typography, colors with carbon fiber theme
- Loading states for all async operations (save/load/validate)
- Keyboard navigation (tab order, enter to submit)
- Accessibility: ARIA labels, screen reader support
- Responsive layout (minimum 1024x768, scale to 4K)

**Focus Areas:**

- Form field focus states with teal accent
- Disabled button states when validation fails
- Error messages in red with icon
- Success messages in green with checkmark
- Smooth transitions between wizard steps

**Risks:**

- Accessibility often overlooked, needs dedicated testing
- High DPI scaling issues on Windows

### 5.4 Documentation Updates

**Requirements:**

- Update `README.md` with wind builder workflow screenshots
- Add `docs/gui.md` with detailed user guide
- Update `CONTRIBUTING.md` with GUI testing instructions
- Record demo video showing create → plan → simulate workflow

**Files to Modify:**

- `README.md`: Add "Creating Wind Files" section
- `docs/gui.md` (new): Comprehensive GUI documentation
- `fiberpath_gui/README.md`: Development guide for contributors

---

## Phase 6: Advanced Features (Post-MVP)

### 6.1 Machine Limits Configuration

**Problem:** Users need to constrain plans to physical machine capabilities.

**Requirements:**

- Add "Machine Settings" panel with limits:
  - Max carriage travel (mm)
  - Max mandrel diameter (mm)
  - Max/min feed rates (mm/min)
  - Axis acceleration limits
- Validate wind definition against limits before planning
- Persist machine profiles (save/load)

**Files to Create:**

- `fiberpath_gui/src/components/MachineSettings.tsx`
- `fiberpath/planning/machine_limits.py` (backend validation)

**Risks:**

- Limits vary widely by machine, hard to define generic schema
- Might need custom machine profiles (e.g., "MyMachine.json")

### 6.2 Visualization Window Integration

**Problem:** Plot preview shown as base64 PNG, no interactive viewing.

**Requirements:**

- Open plot in new window with pan/zoom controls
- Show axes, dimensions, layer boundaries
- 3D view option (render helical paths in 3D)
- Export as SVG/PDF for documentation

**Libraries:**

- Three.js or Babylon.js for 3D
- D3.js or Canvas API for 2D
- jsPDF for PDF export

**Files to Create:**

- `fiberpath_gui/src/components/visualization/PlotViewer.tsx`

**Risks:**

- 3D rendering performance with 10k+ line segments
- Complex camera controls (orbit, pan, zoom)

### 6.3 Real-Time Streaming Monitor

**Problem:** Streaming command runs in background, no live feedback.

**Requirements:**

- Live progress bar with command count / total
- Real-time feed rate chart
- Pause/resume/cancel controls
- Error log with timestamp

**Implementation:**

- Use Tauri events for streaming progress updates
- WebSocket or SSE from Python backend to Tauri to frontend

**Files to Create:**

- `fiberpath_gui/src/components/streaming/StreamMonitor.tsx`
- `fiberpath/execution/events.py` (emit progress events)

**Risks:**

- Event timing synchronization
- UI lag if too many events per second

---

## Implementation Sequence (Step-by-Step Plan)

### Sprint 1: Axis Format & Foundation (Week 1)

1. ✅ Add axis format state to App.tsx
2. ✅ Update commands.ts with axisFormat parameter
3. ✅ Modify main.rs to accept and pass axis format flag
4. ✅ Test XAB vs XYZ output
5. ✅ Add dropdown UI in Plan panel
6. ✅ Update ResultCard to show format
7. ✅ Write integration test for both formats

### Sprint 2: File Handling & Validation (Week 1-2)

8. Add validateWind command (TypeScript + Rust + CLI)
9. Implement client-side file extension validation
10. Add "Open output folder" button
11. Improve error message parsing and display
12. Test with various invalid .wind files
13. Document validation workflow

### Sprint 3: Wind Builder Architecture (Week 2-3)

14. Create TypeScript schema interfaces matching Pydantic
15. Implement Zod schemas for runtime validation
16. Build WindBuilder container component with wizard state
17. Build StepIndicator component
18. Implement navigation between steps (Next/Back buttons)
19. Add save/load Tauri commands
20. Test wizard state transitions

### Sprint 4: Basic Forms (Week 3-4)

21. Build NumericInput reusable component
22. Implement MandrelStep form
23. Implement TowStep form
24. Add default feed rate input
25. Wire up validation for numeric constraints
26. Test form validation edge cases
27. Add keyboard navigation (Enter to advance)

### Sprint 5: Layer Management (Week 4-5)

28. Build LayersStep container
29. Implement LayerCard with collapse/expand
30. Add layer type selector dropdown
31. Build HoopLayerForm (simple checkbox)
32. Implement add/remove layer operations
33. Add unique ID generation for layers
34. Test layer array mutations

### Sprint 6: Complex Layer Forms (Week 5-6)

35. Build HelicalLayerForm with all 8 fields
36. Build SkipLayerForm with rotation input
37. Add field grouping and section headers
38. Implement conditional field visibility (if needed)
39. Add tooltips for all complex parameters
40. Test helical layer validation (coprime check)

### Sprint 7: Reorder & Review (Week 6-7)

41. Install drag-and-drop library (@dnd-kit/sortable)
42. Implement layer reordering with drag handles
43. Build ReviewStep with JSON preview
44. Add syntax highlighting to JSON display
45. Implement copy-to-clipboard button
46. Add validation summary section
47. Test reorder edge cases (first/last layer)

### Sprint 8: Integration (Week 7-8)

48. Add "Create Wind File" button to main App
49. Implement modal overlay for wizard
50. Wire save flow: validate → file picker → write → close
51. Wire load flow: file picker → parse → populate wizard
52. Connect saved file to Plan panel input
53. Test full workflow: create → save → plan
54. Handle wizard close/cancel with unsaved changes warning

### Sprint 9: Polish & Edge Cases (Week 8-9)

55. Add loading spinners for save/load operations
56. Implement auto-save to local storage
57. Add keyboard shortcuts (Esc to close, Ctrl+S to save)
58. Improve error messages with actionable suggestions
59. Add empty state messages (no layers yet)
60. Test with extreme cases (100+ layers, huge values)
61. Fix any styling inconsistencies

### Sprint 10: Testing (Week 9-10)

62. Write unit tests for all form components
63. Write unit tests for schema validation
64. Write integration test for save/load round-trip
65. Add E2E test for complete wizard flow
66. Run cross-platform smoke tests
67. Fix any discovered bugs
68. Achieve >80% test coverage for new code

### Sprint 11: Documentation (Week 10)

69. Take screenshots of wizard steps
70. Write user guide in docs/gui.md
71. Update README with wind builder section
72. Add inline help text to all form fields
73. Create example wind files for each layer type
74. Record demo video
75. Update CONTRIBUTING with GUI dev guide

### Sprint 12: Release Prep (Week 10-11)

76. Code review of all new components
77. Performance profiling (large wind files)
78. Accessibility audit (keyboard nav, screen readers)
79. Update CHANGELOG with new features
80. Build and test installers (Windows MSI, macOS DMG, Linux AppImage)
81. Tag release v0.3.0
82. Publish to GitHub releases with demo video

---

## Success Metrics

- [ ] Users can create valid .wind files without writing JSON
- [ ] Wizard validation catches 95%+ of errors before planning
- [ ] Save/load round-trip preserves all data exactly
- [ ] GUI feature parity with CLI (axis format, all layer types)
- [ ] Zero crashes or data loss during normal usage
- [ ] Positive user feedback on UX vs hand-writing JSON

## Rollback Plan

If critical bugs found post-release:

1. Disable wind builder feature flag (hide button)
2. Revert to v0.2.1 GUI in emergency
3. Fix bugs in separate branch
4. Release hotfix v0.3.1 after testing

---

## Terminology Notes

**"Layering" vs "Slicing":** Use "layering" to describe building up layers on mandrel (bottom-up analogy to 3D printing's "slicing").

**"Wind definition" vs "Wind file":** Prefer "wind definition" for the configuration, "wind file" for the .wind artifact.

---

## Deferred Items (Not in Scope for v0.3.0)

- [ ] Machine limits validation (Phase 6.1) → v0.4.0
- [ ] 3D visualization window (Phase 6.2) → v0.4.0
- [ ] Real-time streaming monitor (Phase 6.3) → v0.4.0
- [ ] Input file JSON schema formal specification → v0.5.0
- [ ] Downloads page in docs → Post-release
- [ ] Multi-language support → v1.0.0+
- [ ] Cloud sync for wind files → v1.0.0+
