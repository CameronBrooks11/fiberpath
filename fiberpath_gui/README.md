# FiberPath Desktop GUI

This Tauri + React workspace provides a cross-platform desktop companion for FiberPath. It shells out to the existing Python CLI so we can plan, plot, simulate, and stream without leaving a single window.

## Prerequisites

- Node.js 18+
- Rust toolchain (for the Tauri shell)
- The FiberPath Python project installed in editable mode so the `fiberpath` CLI is on your PATH

## Getting Started

```pwsh
cd fiberpath_gui
npm install
npm run tauri dev
```

The `tauri dev` command spawns the Vite dev server and opens the desktop shell. Use the four panels to:

1. **Plan** – select a `.wind` input. The CLI writes G-code and returns a JSON summary.
2. **Plot preview** – point at a `.gcode` file and adjust the scale slider to view PNG previews.
3. **Simulate** – run the simulator and inspect motion estimates.
4. **Stream** – start with `--dry-run` to validate queue handling before connecting to hardware.

## Schema Management

The GUI uses a JSON Schema generated from the Python Pydantic models to ensure type safety and validation:

```pwsh
# Regenerate schema and TypeScript types from Python models
npm run schema:generate
```

This:

1. Runs `scripts/generate_schema.py` to extract JSON Schema from Pydantic
2. Generates TypeScript types in `src/types/wind-schema.ts`
3. Ensures GUI and CLI stay in sync

The schema is automatically validated before sending data to the backend, catching errors early.

## Building for Production

For production builds:

```pwsh
cd fiberpath_gui
npm install
npm run package
```

`npm run package` wraps `tauri build --ci`, which emits platform-specific installers under
`src-tauri/target/release/bundle/` (MSI/NSIS on Windows, AppImage/Deb on Linux, App/Disk image on
macOS). Windows packaging works locally, while macOS/Linux artifacts require running the command on
those respective platforms (handled automatically in CI).

See `ARCHITECTURE.md` for a deeper dive into the UI layout and Rust bridge commands.
