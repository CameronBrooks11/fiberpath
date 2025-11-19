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

For production builds:

```pwsh
cd fiberpath_gui
npm run build
npm run tauri build
```

See `ARCHITECTURE.md` for a deeper dive into the UI layout and Rust bridge commands.
