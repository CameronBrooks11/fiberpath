# Cyclone Reference Runs

`tests/cyclone_reference_runs/` contains the "ground truth" Cyclone inputs and outputs that we check into git and consume from our pytest suite. Keeping them with the Python tests makes it easy to diff FiberPath output against the original Cyclone planner without depending on the Node workspace at runtime.

## Directory layout

- `inputs/` – `.wind` definitions copied from Cyclone or authored specifically for regression testing.
- `outputs/` – subdirectories (e.g., `simple-hoop/`) that hold Cyclone's `output.gcode` and optional `preview.png` images for the matching input.

## Suggested workflow

1. `cd cyclone_reference` (the Node workspace).
2. Copy or author the `.wind` file under `../tests/cyclone_reference_runs/inputs/`. Renaming it to the case name (e.g., `simple-hoop.wind`) keeps things tidy.
3. Make sure the corresponding output directory exists:

   ```pwsh
   New-Item -ItemType Directory -Force ../tests/cyclone_reference_runs/outputs/simple-hoop | Out-Null
   ```

4. Run Cyclone against that file, writing results directly into the tracked `tests/cyclone_reference_runs` folder:

   ```pwsh
   npm run cli -- plan -o ../tests/cyclone_reference_runs/outputs/simple-hoop/output.gcode ../tests/cyclone_reference_runs/inputs/simple-hoop.wind
   npm run cli -- plot -o ../tests/cyclone_reference_runs/outputs/simple-hoop/preview.png ../tests/cyclone_reference_runs/outputs/simple-hoop/output.gcode
   ```

5. Repeat for additional cases. Each case lives in its own subfolder so we can diff it independently or reference it from tests.

Avoid committing large batches of generated files outside this directory. When updating the references, regenerate the relevant folders and include them in the same commit as any test changes.

## Generate All Reference Runs

```pwsh
mkdir ../tests/cyclone_reference_runs/outputs/simple-hoop -ErrorAction SilentlyContinue
mkdir ../tests/cyclone_reference_runs/outputs/helical-balanced -ErrorAction SilentlyContinue
mkdir ../tests/cyclone_reference_runs/outputs/skip-bias -ErrorAction SilentlyContinue
npm run cli -- plan -o ../tests/cyclone_reference_runs/outputs/simple-hoop/output.gcode ../tests/cyclone_reference_runs/inputs/simple-hoop.wind
npm run cli -- plot -o ../tests/cyclone_reference_runs/outputs/simple-hoop/preview.png ../tests/cyclone_reference_runs/outputs/simple-hoop/output.gcode
npm run cli -- plan -o ../tests/cyclone_reference_runs/outputs/helical-balanced/output.gcode ../tests/cyclone_reference_runs/inputs/helical-balanced.wind
npm run cli -- plot -o ../tests/cyclone_reference_runs/outputs/helical-balanced/preview.png ../tests/cyclone_reference_runs/outputs/helical-balanced/output.gcode
npm run cli -- plan -o ../tests/cyclone_reference_runs/outputs/skip-bias/output.gcode ../tests/cyclone_reference_runs/inputs/skip-bias.wind
npm run cli -- plot -o ../tests/cyclone_reference_runs/outputs/skip-bias/preview.png ../tests/cyclone_reference_runs/outputs/skip-bias/output.gcode
```
