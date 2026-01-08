# FiberPath

[![CI](https://img.shields.io/github/actions/workflow/status/CameronBrooks11/fiberpath/ci.yml?label=CI&logo=github)](https://github.com/CameronBrooks11/fiberpath/actions/workflows/ci.yml)
[![Docs](https://img.shields.io/github/actions/workflow/status/CameronBrooks11/fiberpath/docs-site.yml?label=Docs&logo=github)](https://github.com/CameronBrooks11/fiberpath/actions/workflows/docs-site.yml)
[![GUI Builds](https://img.shields.io/github/actions/workflow/status/CameronBrooks11/fiberpath/gui.yml?label=GUI&logo=github)](https://github.com/CameronBrooks11/fiberpath/actions/workflows/gui.yml)

FiberPath is a next-generation system for planning, simulating, and executing filament-winding jobs on cylindrical mandrels to produce high-quality, repeatable composite parts. The repository contains four coordinated components:

- **Core Engine (`fiberpath/`)** – deterministic planning pipelines, geometry utilities, and G-code emission.
- **CLI (`fiberpath_cli/`)** – Typer-based command-line interface offering `plan`, `plot`, `simulate`, and `stream`.
- **API (`fiberpath_api/`)** – FastAPI service exposing planning and simulation routes.
- **Desktop GUI (`fiberpath_gui/`)** – Tauri + React application that wraps the CLI for a unified user experience.

📚 Documentation: [cameronbrooks11.github.io/fiberpath](https://cameronbrooks11.github.io/fiberpath)

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

FiberPath automatically waits for Marlin's startup sequence to complete before streaming commands. This handles the ~10-20 line configuration banner that Marlin outputs on connection (typically ending with settings like `M92`, `M203`, `M206`, etc.).

Use `--dry-run` to preview streaming without opening a serial port. `--verbose` prints each dequeued G-code command and Marlin's startup messages. The `run` operation streams one command at a time, waits for `ok`, and lets you pause with `Ctrl+C` (FiberPath issues `M0` and resumes via `M108`).
