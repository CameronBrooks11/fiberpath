# FiberPath GUI Overview

## What is FiberPath GUI?

FiberPath GUI is a cross-platform desktop application for planning, visualizing, and executing filament winding patterns. Built with React and Tauri, it provides an intuitive interface for working with the FiberPath CLI backend.

## Core Capabilities

### 1. Plan Tab

Create and edit winding patterns with visual project builder:

- Configure mandrel dimensions (diameter, length)
- Set tow properties (width, thickness)
- Design multi-layer patterns (hoop, helical, skip)
- Set machine parameters (feed rate, axis format)
- Generate G-code with one click

### 2. Plot Tab

Visualize generated G-code before streaming:

- Unwrapped mandrel view showing fiber placement
- Interactive zoom and pan
- Scale control for performance
- Instant preview of toolpath patterns

### 3. Simulate Tab

Estimate winding job metrics without hardware:

- Total execution time
- Material usage (tow length)
- Command count and movement distance
- Average feed rates

### 4. Stream Tab (v0.5.0)

Direct hardware control for Marlin-compatible machines:

- Serial port discovery and connection management
- Manual G-code command execution
- File streaming with zero-lag progress tracking
- Pause/Resume/Cancel with refined state management
- Live command/response logging
- Keyboard shortcuts for efficient control

## Architecture

```text
┌──────────────────┐
│  React Frontend  │  TypeScript + Vite
│  (UI Panels)     │  Zustand state management
└────────┬─────────┘
         │ invoke()
         ▼
┌──────────────────┐
│  Tauri Commands  │  Rust async bridge
│  (IPC Layer)     │  Process execution
└────────┬─────────┘
         │ spawn
         ▼
┌──────────────────┐
│  FiberPath CLI   │  Python backend
│  plan/plot/sim   │  Core algorithms
└──────────────────┘
```

The GUI acts as a shell around the FiberPath CLI, providing visual workflows while delegating all planning, simulation, and G-code generation to the battle-tested Python backend.

## Technology Stack

- **Frontend:** React 18, TypeScript, Vite
- **Desktop Shell:** Tauri 2.0 (Rust)
- **State Management:** Zustand with shallow selectors
- **Validation:** Zod runtime schemas
- **Styling:** Modular CSS with design tokens
- **Testing:** Vitest, React Testing Library

## Key Features

### Real-Time Validation

- Zod schemas validate all user input before sending to backend
- Clear error messages for invalid parameters
- Prevents invalid data from reaching the CLI

### Optimized Performance

- Shallow selectors prevent unnecessary re-renders
- Memoized computations for expensive operations
- Debounced preview updates for smooth interaction

### Robust Error Handling

- Custom error classes for different failure modes (FileError, ValidationError, CommandError, ConnectionError)
- Detailed error messages with context
- Graceful degradation when CLI unavailable

### v0.5.0 Streaming Enhancements

- **Cancel Job:** Graceful cancellation (orange button when paused) vs Emergency Stop
- **Zero-Lag Progress:** Shared state polling eliminates queue lag
- **State Management:** Clean state handling after stop/cancel/reconnect
- **Manual File Control:** Clear selected files anytime

## Getting Started

**Prerequisites:**

- Node.js 18+
- Rust toolchain
- Python CLI installed (`pip install fiberpath` or `uv pip install fiberpath`)

**Development:**

```sh
cd fiberpath_gui
npm install
npm run tauri dev
```

**Building:**

```sh
npm run tauri build
```

See [development.md](development.md) for detailed setup instructions.

## Documentation Structure

- **[Development](development.md)** - Setup, building, testing
- **Architecture** - System design and technical details
  - [Tech Stack](architecture/tech-stack.md)
  - [State Management](architecture/state-management.md)
  - [CLI Integration](architecture/cli-integration.md)
  - [Streaming State](architecture/streaming-state.md)
- **Guides** - How-to documentation for developers
  - [Schemas](guides/schemas.md)
  - [Styling](guides/styling.md)
  - [Performance](guides/performance.md)
- **Reference** - API and implementation details
  - [Type Safety](reference/type-safety.md)

## Project Structure

```sh
fiberpath_gui/
├── src/
│   ├── components/       # React components (Plan, Plot, Simulate, Stream tabs)
│   ├── state/            # Zustand stores (projectStore)
│   ├── lib/              # Utilities (commands, schemas, validation)
│   ├── types/            # TypeScript types
│   ├── styles/           # Modular CSS with design tokens
│   └── tests/            # Test files
├── src-tauri/
│   ├── src/
│   │   ├── main.rs       # Tauri commands and CLI bridge
│   │   └── marlin.rs     # Streaming state management
│   ├── Cargo.toml
│   └── tauri.conf.json
├── schemas/              # JSON schemas
├── docs/                 # This documentation
└── package.json
```

## Contributing

See the main [Contributing Guide](../development/contributing.md) for:

- Coding standards (Ruff, MyPy for Python; ESLint, TypeScript for GUI)
- Pull request workflow
- CI/CD pipelines
- Issue triage

For GUI-specific development, see [development.md](development.md).
