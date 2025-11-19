# Cyclone Reference Runs

This directory is reserved for the "ground truth" input/output artifacts that come directly from the upstream Cyclone codebase. Keeping these files side-by-side with the source allows you to open `cyclone_reference/` as its own workspace, regenerate artifacts, and compare them against the FiberPath MVP outputs without polluting the Python project tree.

## Directory layout

- `inputs/` – place one or more `.wind` files here. Each file represents a test case you would like to reproduce with Cyclone. The repository keeps an empty placeholder so the folder is tracked, but you can add or remove files freely.
- `outputs/` – Cyclone-produced results live here. Use any structure (e.g., `simple-hoop/output.gcode`) that makes sense for the test case. PNG previews created via `npm run cli -- plot` can also live alongside the GCode for quick inspection.

Both folders are intentionally empty (aside from `.gitkeep`) so you can curate whatever cases you need locally without forcing large binaries into source control.

## Suggested workflow

1. Copy or author a `.wind` definition into `reference_runs/inputs/`. When copying existing examples, renaming them (e.g., `simple-hoop.wind`) keeps the mapping obvious.
2. Create a matching output directory (Cyclone will not create intermediate folders for you):

   ```pwsh
   New-Item -ItemType Directory -Force reference_runs/outputs/simple-hoop | Out-Null
   ```

3. From within `cyclone_reference/`, build and run Cyclone against that file:

   ```pwsh
   npm run cli -- plan -o reference_runs/outputs/simple-hoop/output.gcode reference_runs/inputs/simple-hoop.wind
   npm run cli -- plot -o reference_runs/outputs/simple-hoop/preview.png reference_runs/outputs/simple-hoop/output.gcode
   ```

4. Repeat for additional cases. Keeping outputs in subfolders (one per case) makes it simple to diff the Cyclone artifacts against our Python implementation.

When sharing artifacts with the team, zip up the relevant subfolder under `reference_runs/` or copy the files into the Python test fixtures; avoid committing large generated files directly unless we explicitly decide to vendor them in.

## Generate All Reference Runs

```pwsh
mkdir reference_runs/outputs/simple-hoop -ErrorAction SilentlyContinue
mkdir reference_runs/outputs/helical-balanced -ErrorAction SilentlyContinue
mkdir reference_runs/outputs/skip-bias -ErrorAction SilentlyContinue
npm run cli -- plan -o reference_runs/outputs/simple-hoop/output.gcode reference_runs/inputs/simple-hoop.wind
npm run cli -- plot -o reference_runs/outputs/simple-hoop/preview.png reference_runs/outputs/simple-hoop/output.gcode
npm run cli -- plan -o reference_runs/outputs/helical-balanced/output.gcode reference_runs/inputs/helical-balanced.wind
npm run cli -- plot -o reference_runs/outputs/helical-balanced/preview.png reference_runs/outputs/helical-balanced/output.gcode
npm run cli -- plan -o reference_runs/outputs/skip-bias/output.gcode reference_runs/inputs/skip-bias.wind
npm run cli -- plot -o reference_runs/outputs/skip-bias/preview.png reference_runs/outputs/skip-bias/output.gcode
```
