# FiberPath Desktop GUI

This Tauri + React workspace provides a cross-platform desktop companion for FiberPath. It shells out to the existing Python CLI for planning, simulation, and visualization, while also providing direct Marlin G-code streaming capabilities.

## Features

### Main Tab - Wind Pattern Planning & Visualization

- **Plan** – Select a `.wind` input file. The CLI generates G-code and returns a JSON summary.
- **Plot Preview** – View PNG previews of G-code files with adjustable scale.
- **Simulate** – Run the simulator to inspect motion time estimates.
- **Layer Management** – Create and edit hoop, helical, and skip winding layers.

### Stream Tab - Marlin G-code Streaming (v4.0)

- **Serial Connection** – Discover and connect to Marlin-compatible devices.
- **Manual Control** – Send custom G-code commands or use quick-access buttons (Home, Get Position, E-Stop, Disable Motors).
- **File Streaming** – Stream G-code files directly to connected hardware with real-time progress monitoring.
- **Pause/Resume** – Pause and resume streaming operations mid-execution.
- **Live Log** – View command/response history with auto-scroll and clear functionality.
- **Keyboard Shortcuts** – Efficient control with `Alt+1/2` for tab switching, `?` for help, and more.

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

The `tauri dev` command spawns the Vite dev server and opens the desktop shell.

### Main Tab

Use the four panels to plan, visualize, and simulate winding patterns:

1. **Plan** – Select a `.wind` input file. The CLI generates G-code and returns a JSON summary.
2. **Plot Preview** – Load a `.gcode` file and adjust the scale slider to view PNG previews.
3. **Simulate** – Run the simulator to inspect motion time estimates.
4. **Layer Editor** – Create and configure hoop, helical, and skip winding layers.

### Stream Tab

Connect to Marlin-compatible hardware and stream G-code:

1. **Connect** – Refresh serial ports, select your device and baud rate, then click Connect.
2. **Manual Control** – Test the connection with common commands (Home, Get Position) or send custom G-code.
3. **Stream Files** – Select a G-code file, click Start Stream, and monitor progress in real-time.
4. **Monitor** – View command/response log with timestamps and status updates.

See [docs/marlin-streaming.md](docs/marlin-streaming.md) for detailed streaming documentation.

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

See `fiberpath_gui/docs/` for more details on architecture and schema generation, contains:

- `ARCHITECTURE.md` – high-level design of the Tauri + React GUI
- `SCHEMA.md` – how JSON Schema and TypeScript types are generated
- `PERFORMANCE_PROFILING.md` – guide to profiling React performance
- `STORE_SPLITTING_ANALYSIS.md` – analysis of Zustand store splitting considerations
