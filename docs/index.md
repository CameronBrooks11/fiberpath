# FiberPath Documentation

## Download & Installation

**Latest Release:** [v0.3.0](https://github.com/CameronBrooks11/fiberpath/releases/latest)

- **Desktop GUI** – Download installers for Windows (.msi/.exe), macOS (.dmg), or Linux (.deb/.AppImage)
- **Python Package** – `pip install fiberpath` or `uv pip install fiberpath`
- **Source Code** – Clone the repository and install with `uv pip install .[dev,cli,api]`

---

This folder hosts the primary knowledge base for the project. High-level content
is split into user-facing guides, architectural notes, API references, and developer workflows.

## Available Guides

- `architecture.md` – planner/simulator/streaming overview with data-flow diagrams.
- `concepts.md` – glossary of filament-winding terminology used across the codebase.
- `format-wind.md` – `.wind` file schema and validation rules.
- `api.md` – REST entry points with sample payloads (kept in sync with the FastAPI schemas).
- `planner-math.md` – derivations for hoop/helical/skip layer formulas and guardrails.
- `roadmap.md` – phase-by-phase status of the rewrite (currently paused at Phase 5 completion).

Additional resources:

- `fiberpath_gui/ARCHITECTURE.md` documents the Tauri + React desktop companion and the CLI bridge
  commands.
- The top-level `README.md` now lists hardware smoke-test steps for running the CLI/GUI against
  Marlin controllers, and `CONTRIBUTING.md` outlines the development workflow.
