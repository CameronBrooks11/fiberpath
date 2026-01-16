# Packaging & Distribution

Last updated: 2026-01-15

FiberPath ships a cross-platform desktop GUI (Tauri + React) with a **bundled Python CLI backend**. As of v0.5.1, the GUI is fully self-contained—no Python installation required for end users. This document covers the packaging workflow for both local builds and CI automation.

## Overview

**What's Bundled:**

- **Frontend:** React + TypeScript application (Vite-built, ~2 MB)
- **Shell:** Tauri v2 native window (Rust, ~3-5 MB)
- **Backend:** Frozen Python CLI executable (PyInstaller, ~42 MB)

**Total Installed Size:** ~50-60 MB (varies by platform)

## Deliverables

- **Windows:** `.msi` (WiX installer) + `.exe` (NSIS installer)
- **macOS:** `.dmg` (disk image) + `.app` (application bundle)
- **Linux:** `.deb` (Debian/Ubuntu package) + `.AppImage` (universal binary)

All installers include the complete FiberPath toolchain with no external dependencies.

## CLI Bundling Workflow

### PyInstaller Freeze Process

The Python CLI is frozen into a standalone executable using PyInstaller during CI builds:

**1. Freeze Job (`.github/workflows/gui-packaging.yml`):**

```yaml
freeze-cli:
  runs-on: ${{ matrix.os }}
  strategy:
    matrix:
      os: [windows-latest, macos-latest, ubuntu-latest]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-python@v5
      with:
        python-version: "3.11"
    - run: pip install . pyinstaller
    - run: python scripts/freeze_cli.py
    - uses: actions/upload-artifact@v4
      with:
        name: fiberpath-cli-${{ matrix.os }}
        path: dist/fiberpath*
```

**2. PyInstaller Configuration (`scripts/freeze_cli.py`):**

- **Entry point:** `fiberpath_cli.main:app` (Typer application object)
- **Mode:** `--onefile` (single executable, no external dependencies)
- **Dependencies:** `--collect-all` for typer, rich, pydantic, numpy, PIL, serial
- **Console mode:** `--console` (required for stdio piping in subprocess)
- **Size:** ~42 MB (includes full dependency tree)

**3. Tauri Integration:**

The `package` job downloads frozen CLI artifacts and places them in `fiberpath_gui/bundled-cli/` before running `npm run tauri build`. Tauri's resource bundling embeds the CLI into the installer.

### Platform-Specific CLI Paths

At runtime, the GUI discovers the bundled CLI using platform-specific logic:

**Windows (Installed App):**

```
C:\Program Files\FiberPath GUI\resources\_up_\bundled-cli\fiberpath.exe
```

**Windows (Dev Build):**

```
fiberpath_gui\src-tauri\resources\bundled-cli\fiberpath.exe
```

**macOS:**

```
FiberPath.app/Contents/Resources/bundled-cli/fiberpath
```

**Linux:**

```
/opt/fiberpath-gui/resources/bundled-cli/fiberpath
```

**Implementation:** See `fiberpath_gui/src-tauri/src/cli_path.rs` in the source repository for the full discovery logic.

## Local Build Requirements

### All Platforms

1. **Node.js 20+** – matches `fiberpath_gui/package.json` engines field
2. **Rust toolchain** – via `rustup`, includes `cargo`, `clippy`, `rustfmt`

### Windows-Specific

3. **Microsoft Visual C++ Build Tools** – required by Rust (usually present with VS Build Tools 2022)
4. **NSIS 3.x** – installer generator for `.exe` bundles:
   ```pwsh
   winget install NSIS.NSIS -e --accept-package-agreements --accept-source-agreements
   ```
   Or download manually from [nsis.sourceforge.io](https://nsis.sourceforge.io/Download)

### macOS-Specific

3. **Xcode Command Line Tools:**
   ```sh
   xcode-select --install
   ```

### Linux-Specific

3. **System dependencies:**
   ```sh
   sudo apt install build-essential libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
   ```

## Building Locally

**Note:** Local builds do NOT include the frozen CLI—they use your system PATH. To test with bundled CLI, use CI artifacts or manually run the freeze script first.

```sh
cd fiberpath_gui
npm install
npm run tauri build
```

Output locations:

- **Windows:** `src-tauri/target/release/bundle/msi/` and `bundle/nsis/`
- **macOS:** `src-tauri/target/release/bundle/dmg/` and `bundle/macos/`
- **Linux:** `src-tauri/target/release/bundle/deb/` and `bundle/appimage/`

## CI Build Strategy

GitHub Actions workflow (`.github/workflows/gui-packaging.yml`) handles full production builds:

**Job 1: Freeze CLI** – Build platform-specific frozen executables (Windows/macOS/Linux)

**Job 2: Package GUI** – Download frozen CLI, embed in Tauri resources, build installers

**Matrix Strategy:**

- Separate jobs per platform (no cross-compilation)
- Artifacts uploaded for manual QA
- Release workflow automatically attaches installers to GitHub releases

## Future Enhancements

- **Code signing:** macOS (`developer-id`) and Windows (`signtool` + certificate) when credentials available
- **Auto-updates:** Tauri updater for in-app version checks and downloads (v0.6.0)
- **Bundle optimization:** Reduce frozen CLI size through dependency analysis
- **Universal macOS binaries:** Single `.dmg` supporting both Intel and Apple Silicon (currently separate builds)

## Troubleshooting

**"FiberPath CLI not found" error:**

- **Production build:** CLI should be bundled in `resources/` directory—check Tauri resource configuration
- **Development build:** Ensure `pip install -e .` in repo root so `fiberpath` is on PATH

**PyInstaller "ModuleNotFoundError":**

- Missing dependency not captured by `--collect-all`
- Add explicit `--hidden-import` in `scripts/freeze_cli.py`

**Executable size too small (<20 MB):**

- PyInstaller didn't bundle dependencies correctly
- Verify `--collect-all` flags for all third-party packages

**Windows console window flashes:**

- Fixed in v0.5.1 with `CREATE_NO_WINDOW` flag
- Do NOT use `--noconsole` (breaks subprocess stdio)
