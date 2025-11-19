# FiberPath

FiberPath is the next-generation version of the original TypeScript-based Cyclone tool. The
goal is to deliver a maintainable, well-tested Python platform for planning, simulating, and
executing filament winding jobs on cylindrical mandrels. This repository will eventually host
three major deliverables:

- `fiberpath`: the core geometry, planning, simulation, and G-code toolchain
- `fiberpath-cli`: a Typer-powered CLI for planning, plotting, and streaming toolpaths
- `fiberpath-api`: a FastAPI service intended for headless or GUI/HMI integrations

## Project Status

Phases 0–5 of the roadmap are complete: the planner, simulator, streaming stack, CLI/API hardening,
and the first desktop GUI are all implemented with regression tests. The legacy TypeScript
implementation is preserved under `cyclone_reference/` for parity checks as we head into packaging
and release prep (Phase 6).

## Local Development

```pwsh
uv pip install .[dev,cli,api]
python -m fiberpath_cli.main --help
pytest
```

> Replace `uv` with `pip` if you prefer the standard installer.

### Plotting quick preview

```pwsh
fiberpath plan examples/simple_cylinder/input.wind -o simple.gcode
fiberpath plot simple.gcode --output simple.png --scale 0.8
```

The `plot` command unwraps mandrel coordinates into a PNG so you can visually sanity-check a
toolpath before streaming it to hardware. The renderer pulls mandrel/tow data from the
`; Parameters …` header emitted by `plan` and does not rely on the legacy Cyclone output. See the
generated sample in `docs/assets/simple-cylinder.png` for reference.

## Desktop GUI Companion

We now ship a cross-platform Tauri + React front end that shells out to the existing CLI so you can
plan, plot, simulate, and (dry-run) stream from a single window.

Prerequisites: Node.js 18+, Rust toolchain, and the `fiberpath` CLI available on `PATH` (run
`uv pip install -e .[cli]` or equivalent beforehand).

```pwsh
cd fiberpath_gui
npm install
npm run tauri dev
```

The GUI panels call the same Typer commands described above. Plot previews are rendered to a temp
PNG and displayed inline, while the stream panel defaults to `--dry-run` until you provide a serial
port.

## Hardware Smoke Test Checklist

When you are ready to exercise real hardware:

1. `fiberpath plan` the target `.wind` file and dry-run `fiberpath stream ... --dry-run` to verify
   the queue locally.
2. Use `fiberpath simulate` (CLI or GUI) to confirm motion/time estimates look reasonable.
3. Attach the mandrel controller, then either:
   - run `fiberpath stream simple.gcode --port <PORT> --baud-rate 250000`, or
   - open the GUI, uncheck “Dry-run mode,” and enter the serial port before streaming.
4. Keep a console tailing `fiberpath_cli` logs; the GUI surfaces summaries, but verbose logging is
   still best for troubleshooting.
5. After a live run, archive the emitted JSON summaries (CLI `--json` output or GUI `Result` cards)
   so you can correlate hardware telemetry with planner settings.

### Streaming to Marlin

```pwsh
fiberpath stream simple.gcode --port COM5 --baud-rate 250000
```

Use `--dry-run` to verify what would be streamed without opening a serial port, and `--verbose` to
see every G-code command as it is dequeued. The command mirrors Cyclone's `run` helper: it sends one
command at a time, waits for `ok`, and lets you press `Ctrl+C` to pause (FiberPath sends `M0` and
prompts to resume by dispatching `M108`).

## Repository Map

- `fiberpath/` – core Python package (config schemas, geometry, planning, gcode, simulation)
- `fiberpath_cli/` – Typer app with `plan`, `plot`, `simulate`, and `validate` entry points
- `fiberpath_api/` – FastAPI service exposing planning/simulation routes
- `examples/` – sample `.wind` definitions for smoke tests and demos
- `docs/` – project docs (architecture notes, developer guide, data formats)
- `tests/` – pytest-based regression and unit tests
- `.github/workflows/` – CI definitions (lint, tests, packaging)
- `cyclone_reference/` – frozen copy of the original TypeScript implementation

## Next Steps

Phase 6 focuses on polish: hardening CI (Ruff/Mypy + GUI smoke tests in GitHub Actions), documenting
internals, and preparing distribution artifacts (PyPI package plus Tauri installers). See
`docs/roadmap.md` for the detailed checklist.

Contributions, review comments, and architecture discussions are welcome as we iterate toward a
production-ready application.
