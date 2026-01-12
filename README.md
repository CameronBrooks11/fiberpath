<div align="center">

<h1>FiberPath</h1>

<!-- Version & License -->

[![Version](https://img.shields.io/badge/version-0.5.0-blue)](https://github.com/CameronBrooks11/fiberpath/releases)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%203.0-blue.svg)](LICENSE)

<!-- CI/CD Status -->

[![Backend CI](https://img.shields.io/github/actions/workflow/status/CameronBrooks11/fiberpath/backend-ci.yml?branch=main&label=Backend%20CI&logo=python&logoColor=white)](https://github.com/CameronBrooks11/fiberpath/actions/workflows/backend-ci.yml)
[![GUI CI](https://img.shields.io/github/actions/workflow/status/CameronBrooks11/fiberpath/gui-ci.yml?branch=main&label=GUI%20CI&logo=react&logoColor=white)](https://github.com/CameronBrooks11/fiberpath/actions/workflows/gui-ci.yml)
[![Docs CI](https://img.shields.io/github/actions/workflow/status/CameronBrooks11/fiberpath/docs-ci.yml?branch=main&label=Docs%20CI&logo=markdown&logoColor=white)](https://github.com/CameronBrooks11/fiberpath/actions/workflows/docs-ci.yml)
[![GUI Packaging](https://img.shields.io/github/actions/workflow/status/CameronBrooks11/fiberpath/gui-packaging.yml?branch=main&label=GUI%20Packaging&logo=tauri&logoColor=white)](https://github.com/CameronBrooks11/fiberpath/actions/workflows/gui-packaging.yml)
[![Docs Deployment](https://img.shields.io/github/actions/workflow/status/CameronBrooks11/fiberpath/docs-deploy.yml?branch=main&label=Docs%20Deploy&logo=githubpages&logoColor=white)](https://github.com/CameronBrooks11/fiberpath/actions/workflows/docs-deploy.yml)

<!-- Technology Stack -->

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-1.70+-000000?logo=rust&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?logo=vite&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri&logoColor=white)
![MkDocs](https://img.shields.io/badge/MkDocs-Material-526CFE?logo=materialformkdocs&logoColor=white)

</div>

FiberPath is a next-generation system for planning, simulating, and executing filament-winding jobs on cylindrical mandrels to produce high-quality, repeatable composite parts. The repository contains four coordinated components:

- **Core Engine (`fiberpath/`)** – deterministic planning pipelines, geometry utilities, and G-code emission.
- **CLI (`fiberpath_cli/`)** – Typer-based command-line interface offering `plan`, `plot`, `simulate`, and `stream`.
- **API (`fiberpath_api/`)** – FastAPI service exposing planning and simulation routes.
- **Desktop GUI (`fiberpath_gui/`)** – Tauri + React application that wraps the CLI for a unified user experience.

## Download

📦 **Latest Release:** [v0.5.0](https://github.com/CameronBrooks11/fiberpath/releases/latest)

- **Desktop GUI** – Windows (.msi/.exe), macOS (.dmg), Linux (.deb/.AppImage)
- **Python CLI/API** – `pip install fiberpath` or `uv pip install fiberpath`

📚 **Documentation:** [cameronbrooks11.github.io/fiberpath](https://cameronbrooks11.github.io/fiberpath)

## Local Development

```sh
uv pip install .[dev,cli,api]
python -m fiberpath_cli.main --help
pytest
```

> See [uv docs](https://docs.astral.sh/uv/getting-started/installation/) for installation instructions or replace `uv` with `pip` if you prefer the standard installer.

### Plotting Quick Preview

```sh
fiberpath plan examples/simple_cylinder/input.wind -o simple.gcode
fiberpath plot simple.gcode --output simple.png --scale 0.8
```

The `plot` command unwraps mandrel coordinates into a PNG so you can visually inspect a toolpath before streaming it to hardware. Plotting extracts mandrel/tow settings from the `; Parameters ...` header emitted by `plan`. See `docs/assets/simple-cylinder.png` for a sample.

## Axis Format Selection

FiberPath supports configurable axis mapping to work with different machine configurations:

- **XAB (Standard Rotational)** - Default format using true rotational axes:

  - `X` = Carriage (linear, mm)
  - `A` = Mandrel rotation (rotational, degrees)
  - `B` = Delivery head rotation (rotational, degrees)

- **XYZ (Legacy)** - Compatibility format for systems where rotational axes are configured as linear:
  - `X` = Carriage (linear, mm)
  - `Y` = Mandrel rotation (treated as linear, degrees)
  - `Z` = Delivery head rotation (treated as linear, degrees)

Use `--axis-format xab` (default) for new projects. The legacy format is retained for backward compatibility with existing systems like Cyclone.

```sh
# Generate G-code with standard XAB axes (default)
fiberpath plan input.wind -o output.gcode

# Generate G-code with legacy XYZ axes
fiberpath plan input.wind -o output.gcode --axis-format xyz
```

## Desktop GUI

A cross-platform Tauri + React application for planning, plotting, simulating, and streaming G-code to Marlin hardware.

Prerequisites: Node.js 18+, Rust toolchain, and `fiberpath` available on `PATH` (`uv pip install -e .[cli]` or equivalent).

```sh
cd fiberpath_gui
npm install
npm run tauri dev
```

The GUI provides two tabs:

- **Main Tab** – Layer editor, parameter forms, and 3D visualization canvas
- **Stream Tab** – Serial port connection, manual G-code commands, and file streaming with pause/resume

The GUI calls the same CLI commands for planning and simulation. Streaming uses a persistent Python subprocess for direct serial communication with Marlin controllers.

## Hardware Testing

Before deploying to production hardware:

1. Generate G-code: `fiberpath plan input.wind -o output.gcode`
2. Verify motion: `fiberpath simulate output.gcode` or GUI simulation
3. Test streaming with `--dry-run`:
   - CLI: `fiberpath stream output.gcode --dry-run`
   - GUI: Stream Tab with dry-run mode enabled
4. Connect to hardware:
   - CLI: `fiberpath stream output.gcode --port COM5 --baud-rate 250000`
   - GUI: Stream Tab → select port → Connect → Start Stream
5. Archive results (CLI `--json` output or GUI summaries) for validation

### Streaming to Marlin

```sh
fiberpath stream simple.gcode --port COM5 --baud-rate 250000
```

FiberPath automatically waits for Marlin's startup sequence to complete before streaming commands. This handles the ~10-20 line configuration banner that Marlin outputs on connection (typically ending with settings like `M92`, `M203`, `M206`, etc.).

Use `--dry-run` to preview streaming without opening a serial port. `--verbose` prints each dequeued G-code command and Marlin's startup messages. The `run` operation streams one command at a time, waits for `ok`, and lets you pause with `Ctrl+C` (FiberPath issues `M0` and resumes via `M108`).
