# FiberPath GUI: Professional Utility UX Plan

## Intent (Concise)

Build a professional, slicer-style desktop utility for FiberPath. The top-level UI should feel like a full-featured engineering tool (menu bar, project workflow, clear status). The central experience is a visualization-driven workspace where users **author a .wind definition layer-by-layer inside the app**—no manual JSON editing. The main screen centers on an unwrapped toolpath preview, with surrounding panels for mandrel/tow settings and a structured layer stack. A layer scrubber enables quick inspection of individual layers or ranges. A 3D view is intentionally **out of scope** for now to keep focus on high-value workflow improvements.

This plan describes **what** we want and how it should feel to use, while giving enough code-context pointers to accelerate implementation.

---

## 1) UX Model & Information Architecture (IA)

### Core principles

- **Visualization-first**: The main window should prioritize the toolpath preview like a slicer.
- **Structured authoring**: Users build the definition in a guided UI (mandrel/tow settings + layered recipe), not raw JSON.
- **Professional utility feel**: Menu bar, persistent project state, clear affordances for save/export/plan/simulate.

### High-level layout (slicer-inspired)

- **Top bar / menu**: File, Edit, View, Tools, Help.
- **Center**: Unwrapped view preview canvas with layer scrubber.
- **Left panel**: Global parameters (Mandrel + Tow).
- **Right panel**: Layer properties editor (context-sensitive to selected layer type).
- **Bottom or side stack**: Layer list (add/remove/reorder/duplicate, per-layer summary).
- **Status/footer**: Project status (dirty flag), summary metrics, CLI environment health.

> Conventions to mirror: Cura/PrusaSlicer/OrcaSlicer layout patterns (center canvas, panelized settings, layer list), but with the explicit distinction that FiberPath **creates winding definitions** rather than slicing CAD models.

**Entry layout reference**: current UI is in `fiberpath_gui/src/App.tsx`; components live under `fiberpath_gui/src/components/*`.

---

## 2) User Workflow (From Empty Project to .wind)

1. **Create new project** (or open existing .wind).
2. **Set mandrel parameters** (diameter, wind length).
3. **Set tow parameters** (width, thickness).
4. **Build layer stack**:
   - Add layer (hoop/helical/skip).
   - Fill structured fields for that layer type.
   - Reorder/duplicate/remove layers as needed.
5. **Preview** (unwrapped view updates live with layer selection).
6. **Export .wind** (primary deliverable for CLI/API/streaming flows).
7. **Plan/Simulate/Stream** (optional, using existing CLI-backed commands).

**Schema alignment**: The authoring UI should map directly to `WindDefinition` and layer models in `fiberpath/config/schemas.py`.

---

## 3) Layer-by-Layer Authoring Experience (No JSON)

### Structured layer stack

- A dedicated **Layer Stack** list shows each layer as a row:
  - Index, type (hoop/helical/skip), key parameters, and optional terminal marker.
- Controls: **Add**, **Duplicate**, **Remove**, **Reorder (drag or buttons)**.
- Selecting a layer opens a **Layer Properties** panel.

### Layer properties (contextual)

Each layer panel should be specific to the layer type, with clear units and validation:

- **Hoop layer**: terminal flag.
- **Helical layer**: wind angle, pattern number, skip index, lock degrees, lead-in mm, lead-out degrees, skip initial near-lock.
- **Skip layer**: mandrel rotation.

### Validation expectations

Use the same guardrails as the core planner:

- Wind angle bounds, helical skip/pattern coprime checks, terminal layer placement, etc.
- Refer to `fiberpath/planning/validators.py` for exact constraints.

**Key UX goal**: users should never need to open a JSON file to create a valid `.wind`.

---

## 4) Visualization Area (Unwrapped View + Layer Scrubber)

### Required behavior

- The center canvas renders the **unwrapped toolpath view**.
- A **layer scrubber** (slider) allows:
  - Scrubbing one layer at a time.
  - Optionally showing a range (e.g., up to current layer).
- Visual feedback:
  - Active layer highlighted.
  - Non-active layers dimmed or hidden.

### Technical context

- Existing plotter: `fiberpath/visualization/plotter.py`.
- GUI preview pipe: `fiberpath_gui/src-tauri/src/main.rs` and `fiberpath_gui/src/lib/commands.ts`.
- Rendering approach can continue to rely on CLI-backed PNG output initially (with future room for direct rendering).

**Out of scope**: 3D view for now.

---

## 5) Menu Bar & Utility-Grade Affordances

### Proposed menu structure

- **File**: New, Open, Save, Save As, Export .wind, Export G-code, Recent, Exit.
- **Edit**: Undo/Redo, Duplicate Layer, Delete Layer, Preferences.
- **View**: Toggle panels, reset layout, zoom controls.
- **Tools**: Plan, Simulate, Stream, Validate definition.
- **Help**: Documentation, Version info, Diagnostics.

### Utility expectations

- Project name shown prominently.
- Unsaved changes indicator.
- CLI environment health indicators (e.g., “fiberpath CLI available”).

---

## 6) Mapping to Existing Code

This plan builds on existing layers and CLI integration:

- **Core schema**: `fiberpath/config/schemas.py` (WindDefinition + layer models).
- **Validation logic**: `fiberpath/planning/validators.py`.
- **Plotting**: `fiberpath/visualization/plotter.py`.
- **GUI entry layout**: `fiberpath_gui/src/App.tsx`.
- **GUI commands**: `fiberpath_gui/src/lib/commands.ts` and `fiberpath_gui/src-tauri/src/main.rs`.

---

## 7) Deliverables & Acceptance Signals

### Deliverables

- New layout with menu bar + panelized authoring + central preview.
- Guided layer stack authoring for `.wind` without JSON edits.
- Unwrapped visualization with layer scrubber.
- Export/Save workflow for `.wind` (and optional plan/simulate/stream paths).

### Acceptance signals

- A user can build a valid multi-layer `.wind` file entirely in-app.
- The preview updates as layers are added/edited/scrubbed.
- The interface feels like a professional utility (menu bar, status, clear workflow).

---

## 8) Future Considerations (Explicitly Deferred)

- 3D view of the mandrel and tow path.
- Advanced visualization (collision/coverage analysis).
- Advanced layer strategies UI.

These are intentionally delayed to keep the first iteration focused on core authoring + visualization.
