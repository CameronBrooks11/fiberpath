# FiberPath Documentation

## Download & Installation

**Latest Release:** [v0.4.0](https://github.com/CameronBrooks11/fiberpath/releases/latest)

- **Desktop GUI** – Download installers for Windows (.msi/.exe), macOS (.dmg), or Linux (.deb/.AppImage)
- **Python Package** – `pip install fiberpath` or `uv pip install fiberpath`
- **Source Code** – Clone the repository and install with `uv pip install .[dev,cli,api]`

---

This folder hosts the primary knowledge base for the project. High-level content is split into user-facing guides, architectural notes, API references, and developer workflows.

## What's New in v4.0

**Marlin G-code Streaming** – The desktop GUI now includes a dedicated Stream tab for direct hardware control:

- Serial port discovery and connection management
- Manual G-code command execution with common operation shortcuts
- File streaming with real-time progress monitoring and pause/resume support
- Live command/response log for debugging and monitoring

See [marlin-streaming.md](marlin-streaming.md) for detailed documentation.

## Available Guides

- `architecture.md` – planner/simulator/streaming overview with data-flow diagrams.
- `concepts.md` – glossary of filament-winding terminology used across the codebase.
- `format-wind.md` – `.wind` file schema and validation rules.
- `api.md` – REST entry points with sample payloads (kept in sync with the FastAPI schemas).
- `planner-math.md` – derivations for hoop/helical/skip layer formulas and guardrails.
- `marlin-streaming.md` – Marlin hardware connection, manual control, and file streaming guide (v4.0).
- `roadmap.md` – phase-by-phase status of the rewrite.

Additional resources:

- `fiberpath_gui/docs/` contains GUI-specific documentation (architecture, testing, performance profiling).
- The top-level `README.md` lists hardware smoke-test steps for running the CLI/GUI against Marlin controllers.
- `CONTRIBUTING.md` outlines the development workflow.
