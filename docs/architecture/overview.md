# Architecture Overview

FiberPath is organized as a layered system that keeps the heavy math and machine modeling inside
the Python core while exposing multiple user interfaces. This document explains how the pieces fit
together and where to extend them.

## High-Level Stack

```text
┌──────────────────┐        ┌────────────────────────────┐
│ Desktop GUI      │  IPC   │ fiberpath_cli (Typer)      │
│ fiberpath_gui    │ ─────► │ Commands: plan/plot/...    │
└──────────────────┘        └────────────┬───────────────┘
                                         │ (import)
                                         ▼
                            ┌────────────────────────────┐
                            │ Core engine (Python)       │
                            │ Planning/Sim/G-code        │
                            └────────────┬───────────────┘
                                         ▲ (import)
┌──────────────────────┐                 │
│ FastAPI service      │  REST           │
│ fiberpath_api        │ ────────────────┘
└──────────────────────┘
```

- **Core Engine (`fiberpath/`)** – Immutable planners, geometry helpers, machine abstractions, and
  G-code emitters. The modules are designed to run without side effects so they can be imported from both CLI and API layers.
- **Interface Layer** – `fiberpath_cli` hosts the Typer commands, while `fiberpath_api` turns the
  same operations into REST endpoints. The desktop GUI wraps the CLI and communicates via Tauri IPC
  to keep Python the single source of truth.

## Key Modules

| Module                 | Responsibility                                                                         | Notes                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `fiberpath.planning`   | Parses `.wind` files, validates machine/layer constraints, produces command sequences. | `PlanOptions` governs verbosity and dialect selection.                                           |
| `fiberpath.geometry`   | Curve/surface math shared between planner and simulator.                               | Pure functions make it safe for reuse.                                                           |
| `fiberpath.gcode`      | Dialects and writers for Marlin-style controllers.                                     | Extend here when adding custom headers or commands. Axis mapping configured via `MarlinDialect`. |
| `fiberpath.simulation` | Time/distance estimations based on planned feed rates.                                 | Feeds CLI `simulate` summaries. Axis-aware for proper rotational calculations.                   |
| `fiberpath.execution`  | PySerial streaming, pause/resume, and progress tracking.                               | Used by CLI streaming and API `/stream`.                                                         |

## Axis Mapping System

FiberPath uses a logical-to-physical axis mapping system that separates planning logic from G-code output format. The core planner operates on three logical axes:

- **Carriage**: Linear motion along mandrel longitudinal axis
- **Mandrel**: Mandrel rotation (degrees)
- **Delivery Head**: Delivery head rotation (degrees)

These logical axes are mapped to physical controller axes via the `MarlinDialect` configuration:

- **XAB (Standard)**: Carriage=X, Mandrel=A, Delivery=B - Uses Marlin's native rotational axis support
- **XYZ (Legacy)**: Carriage=X, Mandrel=Y, Delivery=Z - Compatibility mode for systems where rotational axes were configured as linear

The dialect is selected via:

- CLI: `--axis-format xab|xyz` (default: `xab`)
- API: `"axis_format": "xab"|"xyz"` field (default: `"xab"`)
- Core: `PlanOptions(dialect=MARLIN_XAB_STANDARD|MARLIN_XYZ_LEGACY)`

This design allows the same planning logic to produce G-code for different machine configurations without modification.

**See [Axis System Architecture](axis-system.md) for technical details** on the mapping system, dialect implementation, and extension points.

## Data Flow

1. **Plan** – `.wind` definitions load through `fiberpath.config`, the planner emits a
   `PlanSummary`, and `fiberpath.gcode.write_gcode` persists the result.
2. **Plot** – `fiberpath.visualization.plotter.render_plot` interprets G-code into a Pillow image.
3. **Simulate** – `fiberpath.simulation.simulate_program` walks the commands created by the planner
   to estimate duration, distance, and tow usage.
4. **Stream** – `fiberpath.execution.marlin.MarlinStreamer` reads the final G-code file, opening a
   serial connection (or dry-run) and emitting progress callbacks.

Each CLI command keeps the JSON serialization logic local so the API and GUI can reuse the same
shapes without introducing FastAPI or Typer dependencies in the core.

## Extension Points

- **New planner strategies:** Add implementations under `fiberpath/planning/layer_strategies.py`
  and wire them through `plan_wind`.
- **Alternate machine dialects:** Create new dialect definitions under `fiberpath/gcode/dialects.py`
  with custom `AxisMapping` configurations. Swap them in via CLI flags or API parameters.
- **GUI panels:** Implement a new Tauri command in `fiberpath_gui/src-tauri/src/main.rs`, call the
  relevant CLI entry point, and expose it via `src/lib/commands.ts` for React components.

## External Dependencies

- **Python:** `numpy`, `pydantic`, `typer`, `rich`, `Pillow`, and `pyserial` cover numerics, data
  validation, CLI UX, plotting, and serial I/O.
- **Desktop:** Vite + React + Tauri for cross-platform packaging; the Rust side shells out to the
  Python CLI to avoid code duplication.

Understanding this layout should make Phase 6 documentation, linting, and packaging updates easier
because each layer stays isolated yet composable.
