# Development Guide

Complete setup and workflow documentation for developing FiberPath GUI.

## Prerequisites

### Required

- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **Rust** 1.70+ ([rustup.rs](https://rustup.rs))
- **Python CLI** installed and available in PATH (for development mode)
  - Via pip: `pip install fiberpath`
  - Via uv: `uv pip install fiberpath`
  - From source: `pip install -e .` in repo root

**Important:** Production installers bundle the CLI—end users don't need Python. Developers need it for local testing.

### Platform-Specific

**Windows:**

- Microsoft Visual Studio C++ Build Tools
- WebView2 (usually pre-installed on Windows 10+)

**macOS:**

- Xcode Command Line Tools: `xcode-select --install`

**Linux:**

- Build essentials: `sudo apt install build-essential libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`

## CLI Discovery & Fallback

The GUI uses a two-stage CLI discovery process implemented in [`src-tauri/src/cli_path.rs`](../src-tauri/src/cli_path.rs):

**1. Check for Bundled CLI (Production Mode):**

- **Windows installed:** `resources\_up_\bundled-cli\fiberpath.exe`
- **Windows dev:** `resources\bundled-cli\fiberpath.exe`
- **macOS:** `Resources/bundled-cli/fiberpath` (relative to `.app` bundle)
- **Linux:** `resources/bundled-cli/fiberpath`

**2. Fallback to System PATH (Development Mode):**

If bundled CLI not found, uses `which fiberpath` (Unix) or `where fiberpath` (Windows).

**3. Error if Neither Found:**

Returns user-friendly message suggesting `pip install fiberpath`.

**Why This Design:**

- **Production users:** Zero setup—CLI bundled in installer
- **Contributors:** No PyInstaller required for local dev
- **CI testing:** Works in both modes automatically

**Verification:**

```sh
# Ensure CLI is on PATH for development
fiberpath --version

# Test GUI with bundled CLI
npm run tauri build  # Check src-tauri/target/release/bundle/
```

## Initial Setup

```sh
# Clone repository
git clone https://github.com/your-org/fiberpath.git
cd fiberpath/fiberpath_gui

# Install dependencies
npm install

# Verify CLI is available
fiberpath --version
```

## Development

### Run Development Build

```sh
npm run tauri dev
```

This starts:

- Vite dev server with HMR (Hot Module Replacement)
- Tauri window with development console enabled
- File watcher for Rust changes (auto-rebuild)

**Hot Reload:**

- Frontend changes (React/TypeScript) reload instantly
- Rust changes trigger rebuild (~5-15 seconds)

### Run Frontend Only

```sh
npm run dev
```

Starts Vite dev server at `http://localhost:5173`. Useful for:

- UI development without Tauri overhead
- Browser DevTools debugging
- Faster iteration on styling/components

**Note:** Tauri commands will fail in browser mode.

## Testing

### Run All Tests

```sh
npm test
```

### Run Tests in Watch Mode

```sh
npm test -- --watch
```

### Run Specific Test File

```sh
npm test -- schemas.test.ts
```

### Test Coverage

```sh
npm test -- --coverage
```

**Current Test Suite:**

- 43 schema validation tests (all passing)
- Project store tests
- Component tests (planned)

## Building

### Development Build

```sh
npm run tauri build -- --debug
```

Creates debug binary with:

- Development console enabled
- Faster build time
- Source maps included

### Production Build

```sh
npm run tauri build
```

Creates optimized release bundle:

- **Windows:** `.exe` installer in `src-tauri/target/release/bundle/msi/`
- **macOS:** `.dmg` disk image in `src-tauri/target/release/bundle/dmg/`
- **Linux:** `.AppImage` or `.deb` in `src-tauri/target/release/bundle/`

**Build Output:**

```sh
src-tauri/target/release/
├── fiberpath-gui[.exe]         # Binary executable
└── bundle/
    ├── msi/                     # Windows installer
    ├── dmg/                     # macOS disk image
    └── appimage/                # Linux portable app
```

## Packaging

### Create Distributable Package

```sh
npm run package
```

This runs:

1. `npm run tauri build` (production build)
2. Package verification
3. Signing (if configured)

**Release Checklist:**

- [ ] Update version in `package.json`, `Cargo.toml`, `tauri.conf.json`
- [ ] Run `npm run check:all` (lint, format, typecheck, test, clippy)
- [ ] Test on target platforms
- [ ] Build production bundles
- [ ] Verify bundle functionality
- [ ] Tag release in git

## Code Quality

### Run All Checks

```sh
npm run check:all
```

Runs in sequence:

1. ESLint (JavaScript/TypeScript linting)
2. Prettier (formatting check)
3. TypeScript compiler (type checking)
4. Vitest (test suite)
5. Clippy (Rust linting)

**CI Pipeline:** This command runs on every PR. All must pass before merge.

### Individual Commands

```sh
# Linting
npm run lint              # ESLint
npm run lint:fix          # Auto-fix ESLint issues

# Formatting
npm run format:check      # Check Prettier
npm run format            # Auto-format with Prettier

# Type Checking
npm run typecheck         # TypeScript compiler (no emit)

# Rust Linting
npm run clippy            # Cargo clippy
```

## Project Structure

```sh
fiberpath_gui/
├── src/                          # Frontend code
│   ├── main.tsx                  # App entry point
│   ├── App.tsx                   # Root component with tab layout
│   ├── components/               # React components
│   │   ├── AboutDialog.tsx       # Version and info modal
│   │   ├── AxisFormatToggle.tsx  # XAB/XYZ switcher
│   │   ├── ManualControl.tsx     # Manual G-code entry
│   │   ├── PlanForm.tsx          # Project builder form
│   │   ├── PlotPanel.tsx         # Visualization viewer
│   │   ├── SerialConnect.tsx     # Connection manager
│   │   ├── SimulatePanel.tsx     # Simulation results
│   │   ├── StreamPanel.tsx       # Streaming interface
│   │   └── LayerManager.tsx      # Layer list with drag-drop
│   ├── state/                    # State management
│   │   ├── projectStore.ts       # Zustand project store
│   │   └── projectStore.test.ts  # Store tests
│   ├── lib/                      # Utilities
│   │   ├── commands.ts           # Tauri command bindings
│   │   ├── schemas.ts            # Zod validation schemas
│   │   ├── schemas.test.ts       # Schema validation tests
│   │   ├── validation.ts         # Helpers and error handling
│   │   └── errors.ts             # Custom error classes
│   ├── types/                    # TypeScript types
│   │   ├── fiberpath.ts          # Project/layer/mandrel types
│   │   └── streaming.ts          # Streaming state types
│   └── styles/                   # CSS modules
│       ├── tokens.css            # Design tokens (colors, spacing)
│       ├── App.module.css        # Layout styles
│       └── *.module.css          # Component styles
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── main.rs               # Tauri commands (plan, plot, simulate)
│   │   └── marlin.rs             # Streaming state management
│   ├── Cargo.toml                # Rust dependencies
│   ├── tauri.conf.json           # Tauri configuration
│   └── icons/                    # App icons
├── schemas/                      # JSON schemas
│   └── FiberPathProject.schema.json
├── docs/                         # This documentation
├── package.json                  # NPM scripts and dependencies
├── tsconfig.json                 # TypeScript config
├── vite.config.ts                # Vite build config
└── vitest.config.ts              # Test configuration
```

## Common Tasks

### Add New Tauri Command

1. **Define in Rust** (`src-tauri/src/main.rs`):

   ```rust
   #[tauri::command]
   fn my_command(arg: String) -> Result<String, String> {
       Ok(format!("Hello {}", arg))
   }
   ```

2. **Register** in `main()`:

   ```rust
   tauri::Builder::default()
       .invoke_handler(tauri::generate_handler![my_command])
       .run(tauri::generate_context!())
   ```

3. **Call from Frontend** (`src/lib/commands.ts`):

   ```typescript
   export async function myCommand(arg: string): Promise<string> {
     return invoke("my_command", { arg });
   }
   ```

### Add New Layer Type

1. **Define Zod schema** (`src/lib/schemas.ts`)
2. **Add discriminated union case** to `WindLayerSchema`
3. **Update TypeScript types** (`src/types/fiberpath.ts`)
4. **Add form fields** in `PlanForm.tsx`
5. **Add tests** in `schemas.test.ts`

### Add UI Component

1. **Create component file** in `src/components/MyComponent.tsx`
2. **Create CSS module** in `src/styles/MyComponent.module.css`
3. **Use design tokens** from `tokens.css`
4. **Add prop types** with TypeScript
5. **Write tests** (if stateful)

## Debugging

### Frontend Debugging

**Browser DevTools (dev mode only):**

- Right-click → Inspect Element
- Or press F12 in Tauri window

**Zustand DevTools:**

```typescript
// In store definition
devtools(
  (set) => ({
    /* state */
  }),
  { name: "ProjectStore" }
);
```

Then use Redux DevTools extension in browser.

### Rust Debugging

**Console Logging:**

```rust
println!("Debug: {:?}", value);
```

**Run with backtrace:**

```sh
RUST_BACKTRACE=1 npm run tauri dev
```

### CLI Integration Debugging

**Test CLI directly:**

```sh
fiberpath plan examples/simple_cylinder/input.wind
```

**Check CLI version:**

```sh
fiberpath --version
```

**Verify CLI in PATH:**

```sh
# Windows PowerShell
Get-Command fiberpath

# macOS/Linux
which fiberpath
```

## Troubleshooting

### "Command 'fiberpath' not found"

**Solution:** Install Python CLI and ensure it's in PATH:

```sh
pip install fiberpath
fiberpath --version
```

### "Tauri build failed on Linux"

**Solution:** Install WebKit dependencies:

```sh
sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev
```

### Tests fail with "Cannot find module"

**Solution:** Rebuild dependencies:

```sh
rm -rf node_modules package-lock.json
npm install
```

### HMR not working

**Solution:** Restart dev server:

```sh
# Ctrl+C to stop
npm run tauri dev
```

### Streaming connection timeout

**Solution:** Check serial port permissions:

- **Linux:** Add user to dialout group: `sudo usermod -a -G dialout $USER` (logout required)
- **macOS:** Grant permissions in System Settings → Security
- **Windows:** Usually no action needed

## Performance Profiling

See [Performance Guide](guides/performance.md) for detailed profiling instructions using React DevTools Profiler.

## Next Steps

- [Tech Stack Details](architecture/tech-stack.md)
- [State Management Architecture](architecture/state-management.md)
- [Schema Validation Guide](guides/schemas.md)
- [Styling Guide](guides/styling.md)
