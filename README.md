# FiberPath

[![Ruff Status](https://github.com/CameronBrooks11/fiberpath/actions/workflows/ci.yml/badge.svg?job=lint-type&label=Ruff)](https://github.com/CameronBrooks11/fiberpath/actions/workflows/ci.yml)
[![MyPy Status](https://github.com/CameronBrooks11/fiberpath/actions/workflows/ci.yml/badge.svg?job=lint-type&label=MyPy)](https://github.com/CameronBrooks11/fiberpath/actions/workflows/ci.yml)

FiberPath is a next-generation system for planning, simulating, and executing filament-winding jobs on cylindrical mandrels to produce high-quality, repeatable composite parts. The repository contains four coordinated components:

- **Core Engine (`fiberpath/`)** – deterministic planning pipelines, geometry utilities, and G-code emission.
- **CLI (`fiberpath_cli/`)** – Typer-based command-line interface offering `plan`, `plot`, `simulate`, and `stream`.
- **API (`fiberpath_api/`)** – FastAPI service exposing planning and simulation routes.
- **Desktop GUI (`fiberpath_gui/`)** – Tauri + React application that wraps the CLI for a unified user experience.

## Local Development

```sh
uv pip install .[dev,cli,api]
python -m fiberpath_cli.main --help
pytest
```

> Replace `uv` with `pip` if you prefer the standard installer.

### Plotting Quick Preview

```sh
fiberpath plan examples/simple_cylinder/input.wind -o simple.gcode
fiberpath plot simple.gcode --output simple.png --scale 0.8
```

The `plot` command unwraps mandrel coordinates into a PNG so you can visually inspect a toolpath before streaming it to hardware. Plotting extracts mandrel/tow settings from the `; Parameters ...` header emitted by `plan`. See `docs/assets/simple-cylinder.png` for a sample.

## Desktop GUI Companion

A cross-platform Tauri + React front end is provided to plan, plot, simulate, and (dry-run) stream from a single interface.

Prerequisites: Node.js 18+, Rust toolchain, and `fiberpath` available on `PATH` (`uv pip install -e .[cli]` or equivalent).

```sh
cd fiberpath_gui
npm install
npm run tauri dev
```

The GUI panels call the same Typer commands used in the CLI. Plot previews are rendered to temporary PNGs, and the stream panel defaults to `--dry-run` until a serial port is supplied.

## Hardware Smoke Test Checklist

When validating real hardware:

1. Use `fiberpath plan` to generate G-code, then dry-run `fiberpath stream ... --dry-run` to confirm the queue.
2. Run `fiberpath simulate` (CLI or GUI) to verify motion/time estimates.
3. Connect the mandrel controller, then either:
   - `fiberpath stream simple.gcode --port <PORT> --baud-rate 250000`, or
   - open the GUI, disable “Dry-run mode,” and enter the port before streaming.
4. Keep a console tailing `fiberpath_cli` logs for full verbosity during troubleshooting.
5. After a live run, archive the emitted JSON summaries (CLI `--json` or GUI `Result` cards) to correlate telemetry with planner parameters.

### Streaming to Marlin

```sh
fiberpath stream simple.gcode --port COM5 --baud-rate 250000
```

Use `--dry-run` to preview streaming without opening a serial port. `--verbose` prints each dequeued G-code command. The `run` operation streams one command at a time, waits for `ok`, and lets you pause with `Ctrl+C` (FiberPath issues `M0` and resumes via `M108`).
