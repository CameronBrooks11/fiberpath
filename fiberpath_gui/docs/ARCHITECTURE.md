# FiberPath GUI Architecture

## Goals

- Provide a desktop companion that wraps the `fiberpath` CLI for planning, plotting, simulating, and streaming jobs.
- Keep the stack lightweight (React + Vite frontend, Tauri shell) so we can ship cross-platform binaries quickly.
- Avoid duplicating planner/plotter logic by shelling out to the existing Python entry points and parsing their JSON responses.

## High-Level Design

```text
┌──────────────┐       invoke()        ┌────────────────────┐       fiberpath CLI
│ React (Vite) │ ───────────────────► │  Tauri commands    │ ───── shell out ───► plan/sim/plot/stream
│   UI Panels  │ ◄─ events/state ───── │  Rust async bridge │ ◄──── JSON/stdout ─┘
└──────────────┘                       └────────────────────┘
```

- The UI presents four task panels (Plan, Plot, Simulate, Stream). Each panel owns its own form state and output.
- Interactions call typed wrappers in `src/lib/commands.ts`, which forward to the Rust commands via `@tauri-apps/api/tauri`'s `invoke` helper.
- Rust bridge commands spawn the `fiberpath` CLI with the right flags (e.g., `--json`, `--dry-run`) and normalize stdout/stderr into structured payloads for the UI.
- Plotting produces a temporary PNG via the CLI and streams the bytes back as a base64 data URL so the React layer can show an inline preview without touching the filesystem.

## Key Files

- `src/App.tsx` – Shell layout and orchestration of the task panels.
- `src/components/*` – Reusable form controls (file pickers, status cards) and the four task panels.
- `src/lib/commands.ts` – Thin TypeScript helpers that wrap `invoke` calls for each backend command.
- `src-tauri/src/main.rs` – Implements the `plan_wind`, `simulate_program`, `plot_preview`, and `stream_program` commands. Includes process execution, temp file helpers, and serde serialization.
- `src-tauri/tauri.conf.json` – Wires Vite dev/build commands into the Tauri lifecycle and sets metadata for packaged builds.

## State & Error Handling

- Each panel manages a `status` enum (`idle | running | success | error`) plus the latest payload or error message.
- Errors from the Rust side propagate as rejected promises; UI surfaces them inline with actionable text (stdout/stderr snippets).
- For now, streaming defaults to `--dry-run`. Once hardware is available we can pass through the serial port selection directly.

## Future Enhancements

- Persist recent file selections and user preferences via Tauri's `store` plugin.
- Add live progress indicators by tailing CLI stdout/err asynchronously (using `Command::new().stdout(Stdio::piped())`).
- Embed the plotter directly via a shared Rust crate that links against the Python implementation or a future WASM renderer for instant previews.
- Package platform-specific installers using `tauri build --target`. Document signing requirements before distributing on macOS/Windows.
