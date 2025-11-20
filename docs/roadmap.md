# FiberPath Development Roadmap

Last updated: 2025-11-19

The roadmap focuses on delivering a production-ready filament winding tool. Each phase lists the
primary objectives, concrete tasks, and completion signals so we can track progress and keep scope
under control. Phases should be executed sequentially unless otherwise noted.

## Phase 0 – Baseline Hygiene (Complete)

- [x] Establish editable installs via `uv pip install -e .[dev,cli,api]` so local packages resolve
      correctly.
- [x] Ensure `pytest` passes for existing smoke tests (CLI, geometry, planner, gcode utilities).

## Phase 1 – Planner Parity & Core Engine

**Goal:** Match or exceed Cyclone planning behavior for hoop/helical/skip layers.

Tasks:

- [x] Port remaining planner math gaps (pattern skip validation, mandrel diameter growth per layer,
      delivery-head sequencing edge cases).
- [x] Add guardrails: terminal layer ordering, pattern divisibility, numeric bounds on angles/widths.
- [x] Expose profiling metrics (layer time, cumulative tow usage) via `plan_wind` return structure.
- [x] Expand unit coverage:

  - [x] Deterministic tests for `plan_hoop_layer`, `plan_helical_layer`, `plan_skip_layer`.
  - [x] Snapshot tests comparing generated G-code to golden files in `tests/planning/fixtures`.
  - [x] Cyclone reference parity tests for `simple-hoop`, `helical-balanced`, and `skip-bias` `.wind` definitions.

Exit criteria:

- [x] All planner tests pass with >90% coverage for `fiberpath.planning`.
      _`pytest --cov=fiberpath.planning --cov-report=term-missing` now reports 98% coverage after
      pruning dead helpers and adding focused unit tests for machines/validators._
- [x] Example `.wind` parity proved against Cyclone references (simple-hoop, helical-balanced,
      skip-bias); this satisfies the Phase 1 parity requirement without reprocessing the
      `examples/` directory.

## Phase 2 – Visualization & QA Loop

**Goal:** Provide deterministic plotting + inspection tooling for generated G-code.

Tasks:

- [x] Port `plotter` logic from Cyclone into `fiberpath.visualization.plotter` using Pillow/Cairo.
- [x] Wire plotting into `fiberpath_cli.plot` with CLI options for PNG destination & scale.
- [x] Create automated regression test that renders a short toolpath and compares histogram/hash.
- [x] Document plotting usage in `README.md` and add sample output under `docs/assets/`.

Exit criteria:

- [x] `fiberpath_cli plot` renders PNG preview for `examples/simple_cylinder`.
- [x] CI test verifies generated image matches baseline (within tolerance) on Linux/Windows via
      deterministic hash checks in `tests/visualization/test_plotter.py`.

## Phase 3 – Simulation & Streaming

**Goal:** Offer credible execution preparation (estimates + Marlin streaming).

Tasks:

- [x] Upgrade `fiberpath.simulation` to compute motion time using planner feed-rate data.
- [x] Implement `fiberpath.execution.marlin` module (pyserial) mirroring Cyclone's pause/resume.
- [x] Add CLI `stream` command with dry-run mode and progress feedback.
- [x] Provide FastAPI `/stream` endpoint that proxies to the execution layer (mockable for tests).
- [x] Build test harness with virtual serial port to exercise queue/pause/resume logic.

Exit criteria:

- [x] Simulation command reports realistic durations vs. reference manual calculations.
- [x] Streaming CLI can send G-code to a mock port and handle pause/resume interactively.

## Phase 4 – Interface Hardening (CLI + API)

**Goal:** Deliver reliable user entry points with validation and helpful messaging.

Tasks:

- [x] Expand CLI commands with verbose JSON output options and better error handling.
      _Implemented `--json`/structured summaries in `fiberpath_cli` commands plus shared helpers._
- [x] Add FastAPI request models (body uploads for `.wind` files, G-code previews).
      _New Pydantic schemas + route updates in `fiberpath_api/routes/*` ensure validation._
- [x] Provide OpenAPI documentation + examples in `docs/api.md`.
      _Added auto-generated schema notes and copy-pasteable examples._
- [x] Create integration tests using Typer `CliRunner` and FastAPI `TestClient`.
      _See `tests/cli/test_cli_json.py` and `tests/api/test_plan_route.py` suites._

Exit criteria:

- [x] CLI commands have help text, examples, and return non-zero on validation failures.
      _Verified via Typer runner assertions and new error branches._
- [x] API routes covered by tests (>=80% coverage) with documented request/response schemas.
      _FastAPI client tests assert request/response contracts; docs/api.md lists payloads._

## Phase 5 - GUI Prototype

**Goal:** Build a minimal GUI for end-to-end visual workflow using fiberpath.

Tasks:

- [x] Scaffold `fiberpath_gui/` as a Tauri + React workspace (pnpm scripts, shared UI kit).
      _Initialized Vite + React front end plus Tauri shell with typed commands and shared styles._
- [x] Add flows for importing `.wind` inputs, invoking `fiberpath_cli plan`, and surfacing errors.
      _Plan panel shells out to `fiberpath plan --json` and streams structured feedback._
- [x] Embed plotting preview by shelling to the CLI `plot` command (or reusing the renderer via
      IPC) with progress indicators.
      _`plot_preview` Tauri command runs CLI, base64-encodes PNG, and displays it inline._
- [x] Provide simulation + streaming panels that call the existing Typer commands, capture logs,
      and expose pause/resume controls.
      _Panels hit the simulator and stream commands (dry-run by default) with JSON summaries._
- [x] Package a distributable dev build (Windows/macOS) with instructions in `fiberpath_gui/README.md`.
      _README documents `npm run tauri dev/build` workflows and prerequisites._

Exit criteria:

- [x] GUI can plan, plot, simulate, and stream a sample case without leaving the desktop app.
      _All four flows are wired through the CLI via Tauri commands; plotting returns inline previews._
- [x] CI smoke test launches the Tauri app in headless mode to ensure bundles stay healthy.
      _`.github/workflows/gui-smoke.yml` runs lint/build + `npm run tauri build -- --bundles none` on Windows runners._

## Phase 6 – Quality, Documentation, and Release Preparation

**Goal:** Produce a polished, public-facing open-source release.

Tasks:

- [x] Enforce linting and type-checking in CI (Ruff + MyPy).  
      _CI now runs Ruff + MyPy via uv before matrix pytest in `.github/workflows/ci.yml`._
- [x] Finalize documentation: complete missing pages, add contributing guidelines, architecture
      overview, and planner math notes.  
      _Added `CONTRIBUTING.md`, expanded `docs/architecture.md`, and created `docs/planner-math.md`._
- [x] Stand up an automated documentation site (MkDocs preferred) deployed through GitHub Pages via a
      dedicated workflow.  
      _`mkdocs.yml` + CI build gating + `.github/workflows/docs-site.yml` publish the Material site to GitHub Pages._
- [ ] Establish a versioning and release process (semantic versioning, CHANGELOG, PyPI packaging
      steps for `fiberpath`/`fiberpath_cli`).
- [ ] Add cross-platform smoke tests for Windows/macOS/Linux using `uv`-managed virtual
      environments to ensure consistent build/runtime behavior.

Exit criteria:

- [ ] CI passes end-to-end (lint, type-check, tests, docs build) on all supported platforms.
- [ ] Draft `v0.1.0` release notes with installation instructions and links to binaries, docs, and
      example workflows.

## Future TODOs

These items are out of scope for the initial release but are on the horizon and will be organized into formal phases later.

- [ ] Create example-driven tutorials (`docs/tutorials/*.md`) showing end-to-end workflow.
- [ ] Allow remapping of machine axes (both linear X/Y/Z/E and rotational A/B/C).
- [ ] Build interface for creating `.wind` definitions from scratch (wizard or graphical).
- [ ] Restructuring of GUI to make it centered on the visualization and planning experience (think 3D printing slicers).
- [ ] Allow for custom G-code headers/footers
- [ ] Implement advanced layering strategies (variable angle, custom patterns).
