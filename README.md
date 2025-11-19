# FiberPath

FiberPath is the next-generation version of the original TypeScript-based Cyclone tool. The
goal is to deliver a maintainable, well-tested Python platform for planning, simulating, and
executing filament winding jobs on cylindrical mandrels. This repository will eventually host
three major deliverables:

- `fiberpath`: the core geometry, planning, simulation, and G-code toolchain
- `fiberpath-cli`: a Typer-powered CLI for planning, plotting, and streaming toolpaths
- `fiberpath-api`: a FastAPI service intended for headless or GUI/HMI integrations

## Project Status

The current commit establishes the initial Python project layout, typed configuration schema, and
basic CLI wiring. The legacy TypeScript implementation is preserved under `cyclone_reference/` for
easy diffing during the rewrite.

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

1. Port the planning math from `cyclone_reference/src/planner` into the new Python modules.
2. Flesh out the CLI commands (plotting, serial streaming) and add end-to-end tests.
3. Stand up the API service plus a lightweight GUI workflow as described in `fiberpath_repo_structure.md`.

Contributions, review comments, and architecture discussions are welcome as we iterate toward a
production-ready application.
