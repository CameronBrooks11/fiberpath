# FiberPath GUI Rehaul - TODO

## Phase 0: Foundation (Pre-Layout)

- [x] Implement axis format selection (XAB/XYZ dropdown)
- [x] Add custom output path controls (directory + filename)
- [x] Fix Tauri plugin semver (2.0)
- [x] Add FileField directory mode
- [x] Integration tests for axis formats
- [x] Version bump to 0.2.(3)

## Phase 1: Layout Architecture

- [x] Create MainLayout.tsx with CSS Grid (3-column + header/footer)
- [x] Create MenuBar.tsx component (placeholder menus)
- [x] Create LeftPanel.tsx (collapsible container)
- [x] Create RightPanel.tsx (collapsible container)
- [x] Create BottomPanel.tsx (layer stack container)
- [x] Create CenterCanvas.tsx (visualization container)
- [x] Create StatusBar.tsx (project name, dirty flag, CLI health)
- [x] Update App.tsx to use MainLayout
- [x] Add panel collapse/expand CSS transitions
- [x] Move existing four workflows to Tools menu (preserve functionality)
- [x] Test responsive layout (1024x768 to 4K)

## Phase 2: State Management

- [x] Define TypeScript interfaces (FiberPathProject, Layer, Mandrel, Tow)
- [x] Create projectStore.ts with Zustand
- [x] Implement loadProject action
- [x] Implement updateMandrel action
- [x] Implement updateTow action
- [x] Implement addLayer action (with UUID generation)
- [x] Implement removeLayer action
- [x] Implement updateLayer action
- [x] Implement reorderLayers action
- [x] Implement duplicateLayer action
- [x] Implement setActiveLayerId action
- [x] Implement setAxisFormat action
- [x] Implement markDirty/clearDirty actions
- [x] Implement setFilePath action
- [x] Add unsaved changes prompt on window close
- [x] Wire up New Project menu action
- [x] Connect StatusBar to project store
- [x] Test state persistence and updates

## Phase 3: Global Parameters (Left Panel)

- [x] Create MandrelForm.tsx with diameter input
- [x] Add wind_length input to MandrelForm
- [x] Create TowForm.tsx with width input
- [x] Add thickness input to TowForm
- [x] Add validation on blur (required fields, positive numbers)
- [x] Add unit indicators (mm)
- [x] Wire forms to projectStore (updateMandrel/updateTow)
- [x] Add inline error display
- [x] Style forms with carbon fiber theme
- [x] Test two-way binding

## Phase 4: Layer Stack (Bottom Panel)

- [x] Create LayerStack.tsx component
- [x] Create LayerRow.tsx component (index, type, summary)
- [x] Add "Add Layer" button with type picker (Hoop/Helical/Skip)
- [x] Add "Remove Layer" button
- [x] Add "Duplicate Layer" button
- [x] Implement drag-drop reordering (@hello-pangea/dnd)
- [x] Implement click to select (update activeLayerId)
- [x] Show active layer highlight
- [x] Display layer summary (e.g., "Helical 45°")
- [x] Test layer CRUD operations

## Phase 5: Layer Editors (Right Panel)

- [x] Create HoopLayerEditor.tsx with terminal checkbox
- [x] Create HelicalLayerEditor.tsx with 7 fields (wind_angle, pattern_number, skip_index, etc.)
- [x] Create SkipLayerEditor.tsx with mandrel_rotation input
- [x] Add conditional rendering based on activeLayerId layer type
- [x] Add validation for each field (wind angle 0-90°, coprime check, etc.)
- [x] Wire editors to projectStore (updateLayer)
- [x] Add inline error display
- [x] Add field tooltips explaining parameters
- [x] Style editors with carbon fiber theme
- [x] Test two-way binding for all layer types

## Phase 6: Visualization Canvas

- [x] Create VisualizationCanvas.tsx component
- [x] Add Tauri command for plotting (plot_definition with .wind JSON)
- [x] Implement PNG display with pan/zoom (react-zoom-pan-pinch)
- [x] Add auto-refresh toggle and manual refresh button
- [x] Create LayerScrubber.tsx slider component
- [x] Implement layer filtering (show layers 1-N)
- [x] Create CanvasControls.tsx (refresh, auto toggle, zoom controls)
- [x] Add loading spinner during plot generation
- [x] Add error states with retry button
- [x] Fix schema conversion (snake_case to camelCase, nested layer properties)
- [x] Fix Rust/TypeScript serialization (imageBase64 serde rename)
- [x] Implement fit-to-frame scaling (image always fits canvas initially)
- [x] Test canvas updates on layer add/edit/remove

**Known Issues:**

- [x] BUG: Layer scrubber shows blank when viewing layer 1, but layer 2 renders correctly
  - **Root cause**: Layer 1 parameters (35° angle, pattern 4) are invalid for mandrel geometry (31 circuits not divisible by pattern 4)
  - **Real issue**: CLI warning "Skipping helical layer" goes to stderr but GUI doesn't capture or display it
  - **Solution**: Implemented stderr capture in Rust, warning parsing, and UI display in yellow banner

## Phase 6.5: JSON Schema & Type Safety

- [x] Extract Pydantic schema to JSON Schema (use pydantic's `model_json_schema()`)
- [x] Create `fiberpath_gui/schemas/wind-schema.json` file
- [x] Add JSON Schema validation in GUI before sending to backend
- [x] Generate TypeScript types from schema (using `json-schema-to-typescript`)
- [x] Update VisualizationCanvas to use generated types instead of manual conversion
- [x] Create schema generation script (`scripts/generate_schema.py`)
- [x] Add `npm run schema:generate` command for easy regeneration
- [x] Create converter utilities (`src/types/converters.ts`)
- [x] Create validation utilities (`src/lib/validation.ts`)
- [x] Configure AJV to handle Pydantic discriminator keyword
- [x] Implement lazy validation initialization to prevent load errors
- [x] Document schema workflow in README
- [x] Implement stderr warning capture and UI display
  - [x] Capture stderr from CLI plan command
  - [x] Parse warnings (lines starting with "Skipping" or "Warning")
  - [x] Pass warnings through Tauri bridge
  - [x] Display warnings in yellow banner above canvas
- [x] Add schema validation tests (17 tests covering valid/invalid definitions)
- [x] Document schema in `docs/format-wind.md`
- [x] Add schema version field (1.0) for future compatibility

## Phase 7: Menu Bar

- [x] Remove Radix UI dependency (use native HTML details/summary menus)
- [x] Implement FileMenu with New, Open, Save, Save As, Export G-code
- [x] Implement EditMenu with Duplicate Layer, Delete Layer
- [x] Implement ViewMenu with panel toggles
- [x] Implement ToolsMenu with Validate Definition
- [x] Implement HelpMenu (Documentation link working)
- [x] Create Tauri backend commands (save_wind_file, load_wind_file, validate_wind_definition)
- [x] Create TypeScript command wrappers with proper typing
- [x] Implement "New Project" (clear state, prompt if dirty)
- [x] Implement "Open .wind" (Tauri dialog, parse JSON, load state)
- [x] Implement "Save" (serialize state, write JSON, clear dirty flag)
- [x] Implement "Save As" (Tauri save dialog)
- [x] Implement "Export G-code" (validate, plan, save dialog)
- [x] Add Recent Files list (localStorage-based, max 10)
- [x] Wire panel toggles to MainLayout state
- [x] Add click-outside detection to close menus
- [x] Fix file loading/saving round-trip (convert between GUI and schema formats)
- [x] Add About dialog with version info
- [x] Add Diagnostics panel (CLI health, temp files, etc.)
- [x] Test all menu functionality end-to-end

**Progress:** 19/19 tasks complete ✅

**Note:** Keyboard shortcuts moved to Phase 8.

## Phase 8: Keyboard Shortcuts

- [x] Extract file handlers to shared module (fileOperations.ts)
- [x] Create useKeyboardShortcuts hook with platform detection
- [x] Refactor MenuBar to use shared handlers
- [x] Add keyboard event listener in App.tsx
- [x] Implement Ctrl+N (New Project)
- [x] Implement Ctrl+O (Open)
- [x] Implement Ctrl+S (Save)
- [x] Implement Ctrl+Shift+S (Save As)
- [x] Implement Ctrl+E (Export G-code)
- [x] Implement Ctrl+D (Duplicate Layer)
- [x] Implement Del (Delete Layer)
- [x] Add visual indicators in menu
- [x] Input field filtering implemented (isInputElement checks INPUT/TEXTAREA/SELECT/contentEditable)
- [ ] Manual testing recommended (see testing checklist below)

**Progress:** 13/15 tasks complete (87%) ✅

**Note:** Ctrl+Z/Y (Undo/Redo) moved to Phase 13 as future enhancement.

**Architecture:**

- Factory pattern: `createFileOperations()` provides shared handlers
- Custom hook: `useKeyboardShortcuts()` manages event listeners
- Platform detection: Ctrl (Windows/Linux) vs Cmd (macOS)
- Input filtering: `isInputElement()` prevents shortcuts in input/textarea/select/contentEditable
- Event delegation: Single keydown listener on document

**Extended Scope Work Completed:**

During Phase 8 implementation, several UX improvements were added:

- ✅ Machine Settings UI (defaultFeedRate + axisFormat forms in LeftPanel)
- ✅ Export confirmation dialog with validation (validates before file picker)
- ✅ Export button in visualization canvas (FileDown icon, teal gradient)
- ✅ Icon system upgrade (lucide-react: Eye, FileDown, ZoomIn, ZoomOut, RotateCcw)
- ✅ Auto-refresh removal (simplified UX, removed toggle and debounced preview)
- ✅ Layer scrubber clarity (label "Preview Layers: 1-3 of 5", tooltip explains export)
- ✅ All compilation errors fixed (TypeScript + Rust)

**Manual Testing Checklist:**

Test these shortcuts in running application (Ctrl on Windows/Linux, Cmd on macOS):

1. **Ctrl+N (New):** Creates new project; prompts if dirty; blocked in input fields
2. **Ctrl+O (Open):** Opens file dialog; loads project; blocked in input fields
3. **Ctrl+S (Save):** Saves or prompts; updates file path; blocked in input fields
4. **Ctrl+Shift+S (Save As):** Opens save dialog; blocked in input fields
5. **Ctrl+E (Export):** Opens confirmation dialog; validates project; blocked in inputs
6. **Ctrl+D (Duplicate):** Duplicates active layer; shows error if none; blocked in inputs
7. **Del (Delete):** Deletes active layer; shows error if none; blocked in inputs

**Test Status:** Implementation complete ✅ | Manual verification recommended

## Phase 9: File Operations (Already Completed in Phase 7)

- [x] Add save_wind_file Tauri command (write JSON to path)
- [x] Add load_wind_file Tauri command (read JSON from path)
- [x] Add validate_definition Tauri command (call CLI validate)
- [x] Add plot_layers Tauri command (already exists as plot_definition)
- [x] Update commands.ts with new TypeScript wrappers
- [x] Test file save/load roundtrip
- [x] Test error handling (invalid JSON, missing file)

**Note:** Phase 9 tasks were completed during Phase 7 implementation.

## Phase 10: Validation

- [x] Create windValidators.ts with TypeScript validation logic
- [x] Implement JSON Schema validation (AJV with Pydantic compatibility)
- [x] Implement CLI validation integration (validate_wind_definition command)
- [x] Add validation error display in UI (error messages with field paths)
- [x] Port validateWindAngle (0-90° check)
- [x] Port validateHelicalPattern (coprime check - in schema)
- [x] Port validateTerminalLayer (placement rules - in schema)
- [x] Port validateMandrel (diameter, wind_length required - in schema)
- [x] Port validateTow (width, thickness required - in schema)
- [x] Add validation to form field onBlur handlers (HTML5 + controlled inputs)
- [x] Add "Validate Definition" menu item (Tools > Validate Definition)
- [x] Block export if invalid state (Export G-code validates before proceeding)
- [x] Add CLI error parsing (stderr to user-friendly messages)
- [x] Test all validation rules (17 comprehensive tests)

**Progress:** 14/14 tasks complete (validation fully implemented in Phases 6.5 and 7)
