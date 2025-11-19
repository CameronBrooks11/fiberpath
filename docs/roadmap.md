# FiberPath Development Roadmap

Last updated: 2025-11-18

The roadmap focuses on delivering a production-ready Python port of Cyclone. Each phase lists the
primary objectives, concrete tasks, and completion signals so we can track progress and keep scope
under control. Phases should be executed sequentially unless otherwise noted.

## Phase 0 – Baseline Hygiene (Complete)

- [x] Establish editable installs via `uv pip install -e .[dev,cli,api]` so local packages resolve
      correctly.
- [x] Ensure `pytest` passes for existing smoke tests (CLI, geometry, planner, gcode utilities).

## Phase 1 – Planner Parity & Core Engine

**Goal:** Match or exceed Cyclone planning behavior for hoop/helical/skip layers.

Tasks:

- [ ] Port remaining planner math gaps (pattern skip validation, mandrel diameter growth per layer,
      delivery-head sequencing edge cases).
- [ ] Add guardrails: terminal layer ordering, pattern divisibility, numeric bounds on angles/widths.
- [ ] Expose profiling metrics (layer time, cumulative tow usage) via `plan_wind` return structure.
- [ ] Expand unit coverage:

  - [ ] Deterministic tests for `plan_hoop_layer`, `plan_helical_layer`, `plan_skip_layer`.
  - [ ] Snapshot tests comparing generated G-code to golden files in `tests/planning/fixtures`.

Exit criteria:

- [ ] All planner tests pass with >90% coverage for `fiberpath.planning`.
- [ ] Example `.wind` files in `examples/` reproduce legacy Cyclone output within tolerances.

## Phase 2 – Visualization & QA Loop

**Goal:** Provide deterministic plotting + inspection tooling for generated G-code.

Tasks:

- [ ] Port `plotter` logic from Cyclone into `fiberpath.visualization.plotter` using Pillow/Cairo.
- [ ] Wire plotting into `fiberpath_cli.plot` with CLI options for PNG destination & scale.
- [ ] Create automated regression test that renders a short toolpath and compares histogram/hash.
- [ ] Document plotting usage in `README.md` and add sample output under `docs/assets/`.

Exit criteria:

- [ ] `fiberpath_cli plot` renders PNG preview for `examples/simple_cylinder`.
- [ ] CI test verifies generated image matches baseline (within tolerance) on Linux/Windows.

## Phase 3 – Simulation & Streaming

**Goal:** Offer credible execution preparation (estimates + Marlin streaming).

Tasks:

- [ ] Upgrade `fiberpath.simulation` to compute motion time using planner feed-rate data.
- [ ] Implement `fiberpath.execution.marlin` module (pyserial) mirroring Cyclone's pause/resume.
- [ ] Add CLI `stream` command with dry-run mode and progress feedback.
- [ ] Provide FastAPI `/stream` endpoint that proxies to the execution layer (mockable for tests).
- [ ] Build test harness with virtual serial port to exercise queue/pause/resume logic.

Exit criteria:

- [ ] Simulation command reports realistic durations vs. reference manual calculations.
- [ ] Streaming CLI can send G-code to a mock port and handle pause/resume interactively.

## Phase 4 – Interface Hardening (CLI + API)

**Goal:** Deliver reliable user entry points with validation and helpful messaging.

Tasks:

- [ ] Expand CLI commands with verbose JSON output options and better error handling.
- [ ] Add FastAPI request models (body uploads for `.wind` files, G-code previews).
- [ ] Provide OpenAPI documentation + examples in `docs/api.md`.
- [ ] Integrate optional authentication stub for future deployments (API key header enforcement).
- [ ] Create integration tests using Typer `CliRunner` and FastAPI `TestClient`.

Exit criteria:

- [ ] CLI commands have help text, examples, and return non-zero on validation failures.
- [ ] API routes covered by tests (>=80% coverage) with documented request/response schemas.

## Phase 5 – Quality, Docs, and Release Prep

**Goal:** Ship a professional open-source release.

Tasks:

- [ ] Introduce Ruff + MyPy enforcement in CI (already configured locally, ensure GitHub Actions).
- [ ] Author developer docs: contributing guide, code architecture deep dive, planner math overview.
- [ ] Set up versioning/release process (CHANGELOG, semantic tags, PyPI publishing instructions).
- [ ] Create example-driven tutorials (`docs/tutorials/*.md`) showing end-to-end workflow.
- [ ] Run cross-platform smoke tests (Windows, macOS, Linux) using uv-managed virtual envs.

Exit criteria:

- [ ] CI pipeline (lint, type-check, tests) green on all platforms.
- [ ] `v0.1.0` release notes drafted with download/install instructions.

## Execution Notes

- Track work via GitHub issues referencing the phase/task IDs above.
- Keep roadmap updated after each milestone; adjust scope only with brief design notes.
- Before starting Phase 1 tasks, review Cyclone reference math to confirm any remaining edge cases.
