# FiberPath Roadmap v5.1 - Python CLI Bundling

**Version:** 0.5.1  
**Branch:** v0.5.1-dev  
**Started:** 2025-01-13

---

## Objective

Implement standalone desktop application by bundling frozen Python CLI with GUI installers, eliminating the need for users to manually install Python or the `fiberpath` package.

**Problem:** GUI installers fail at runtime because `fiberpath` CLI is not found in PATH.  
**Solution:** Bundle frozen Python executable using PyInstaller with Tauri resources.  
**Expected Outcome:** True "download and run" desktop application with no external dependencies.

---

## Phase 1: CLI Freezing Infrastructure

- [x] Create `scripts/freeze_cli.py` - PyInstaller build script targeting `fiberpath_cli.main:app` entry point
- [x] Configure freeze for `--onefile` mode, include all dependencies (numpy, pydantic, typer, rich, Pillow, pyserial)
- [x] Add `--hidden-import` for all fiberpath submodules (planning, gcode, geometry, execution, config, simulation, visualization)
- [x] Set console mode: `--noconsole` on Windows (prevent console flash), `--console` on Unix (for debugging)
- [x] Test local Windows freeze: `dist/fiberpath.exe --version`, verify plan/simulate/plot/stream/interactive commands
- [ ] Test local macOS freeze: verify Intel/ARM builds (may need separate builds, not universal)
- [ ] Test local Linux freeze: verify on Ubuntu 22.04, check glibc compatibility
- [x] Verify executable size acceptable (< 80 MB per platform)

**Progress:** 6/8 tasks complete (75%)

**Windows Build Results:**

- Executable size: 34.5 MB (well under 80 MB target)
- Successfully tested: validate, plan (32KB gcode output created), interactive mode
- PyInstaller 6.18.0 with Python 3.12.6
- No console window flash confirmed (--noconsole working)

**Critical Notes:**

- Entry point is `fiberpath_cli.main:app` (Typer app object), NOT `__main__.py`
- Interactive mode (`fiberpath interactive`) must work - used by Marlin streaming
- PyInstaller may need `--collect-all fiberpath` to capture all subpackages
- macOS: Universal binary may not work; might need separate Intel/ARM builds

---

## Phase 2: Tauri Integration

- [x] Update `fiberpath_gui/src-tauri/tauri.conf.json` - add `bundle.resources` array with pattern (Tauri v2 format)
- [x] Create `fiberpath_gui/bundled-cli/` directory with `.gitkeep` (populated by CI)
- [x] Create `fiberpath_gui/src-tauri/src/cli_path.rs` module
- [x] Implement `get_fiberpath_executable() -> PathBuf` using `tauri::Manager::path().resolve()` for resource dir
- [x] Platform-specific resource paths: Windows `resources\fiberpath.exe`, macOS `../Resources/fiberpath`, Linux `resources/fiberpath`
- [x] Add fallback logic: check bundled first → system PATH → return Err with helpful message
- [x] Add logging via `log::info!()` for which executable path is being used
- [x] Update `exec_fiberpath()` in `main.rs`: use `get_fiberpath_executable()`, handle PathBuf → &str conversion
- [x] Update `MarlinSubprocess::spawn()` in `marlin.rs`: use bundled path for `fiberpath interactive`
- [x] Add `check_cli_health` Tauri command: run `fiberpath --version`, return version string or error
- [ ] Call `check_cli_health` on app startup (from React), show toast/dialog if fails
- [x] Update error messages: suggest manual install instructions if bundled CLI not found

**Progress:** 11/12 tasks complete (92%)

**Critical Notes:**

- Tauri v2 uses `tauri::Manager` trait for path resolution, NOT `tauri::api::path`
- Resource dir location varies: Windows (same as exe), macOS (inside .app bundle), Linux (relative to exe)
- Must handle async/await properly when calling from Tauri commands
- Interactive mode subprocess must also use bundled path

---

## Phase 3: CI/CD Workflow Updates

- [x] Update `.github/workflows/gui-packaging.yml` - add `freeze-cli` job before `package` job
- [x] Configure matrix strategy for Windows/macOS/Linux in freeze job (same as package job matrix)
- [x] Freeze job steps: checkout, setup Python using `./.github/actions/setup-python` composite action
- [x] Install PyInstaller in freeze job: `pip install pyinstaller` (or add to dev dependencies)
- [x] Run freeze script: `python scripts/freeze_cli.py` in freeze job
- [x] Upload frozen executable as artifact: `actions/upload-artifact@v4` with name `fiberpath-cli-${{ matrix.os }}`
- [x] Update `package` job: add `needs: freeze-cli` to job dependencies
- [x] Download frozen CLI artifacts in package job: `actions/download-artifact@v4` for current platform
- [x] Copy downloaded CLI to `fiberpath_gui/bundled-cli/` before Tauri build (create dir if needed)
- [x] Make executable on Unix: `chmod +x fiberpath_gui/bundled-cli/fiberpath` (Linux/macOS only)
- [x] Verify bundled CLI in installer: add post-build check that CLI exists in Tauri bundle resources
- [x] Add comprehensive tooling checks to CI workflows: ruff format, stylelint, cargo fmt, cargo clippy

**Progress:** 12/12 tasks complete (100%)

**Critical Notes:**

- Use existing `setup-python` composite action - already configured with uv and caching
- Each platform matrix job (Windows/macOS/Linux) runs separately - no cross-compilation
- CI artifact flow: freeze job uploads → package job downloads → same platform, same run
- Artifact naming must be consistent: `fiberpath-cli-windows-latest`, `fiberpath-cli-macos-latest`, etc.
- Tauri build expects bundled CLI in place BEFORE `npm run package` executes
- Retention: CLI artifacts 7 days (intermediate), GUI installers 30 days, releases permanent

---

## Phase 4: Testing & Validation

- [x] Windows: Fresh Win 10/11 PC, no Python, install `.msi`, verify bundled CLI found and executable
- [x] Windows: Verify no console windows flash during operation (CREATE_NO_WINDOW flag working)
- [x] Windows: Upgrade path - Install v0.5.0 → upgrade to v0.5.1, verify bundled CLI takes precedence, no conflicts
- [x] Windows: Integration testing - Full workflow testing validate→plan→simulate→plot/stream on clean install
- [x] Windows: Uninstall testing - Verify clean removal of files, no leftover bundled CLI artifacts

**Progress:** 5/5 tasks complete (100%)

**Note:** Cross-platform testing (macOS, Linux) and development fallback testing deferred to roadmap-v6.md Phase 7.

**Critical Notes:**

- Test on FRESH systems without Python - primary use case for this entire feature
- Interactive mode (`fiberpath interactive`) MUST work - Marlin streaming depends on it
- Development fallback critical - devs should NOT need to freeze CLI for local Tauri dev server
- All four core workflows: validate config → plan path → simulate → visualize/stream
- Upgrade path: ensure v0.5.1 bundled CLI doesn't conflict with user's existing `fiberpath` in PATH

---

## Phase 5: Documentation Updates

- [x] Update root README.md: Clarify "No Python required" now accurate for GUI installers (bundled CLI included)
- [x] Update docs/getting-started.md: Add GUI-first path (no Python), separate CLI installation instructions
- [x] Update docs/index.md: Update version badges, "What's New" highlights for v0.5.1 bundled CLI
- [x] Update docs/development/packaging.md: Replace shell-out assumptions with PyInstaller bundling workflow
- [x] Create docs/troubleshooting.md: Platform-specific issues (permissions, antivirus, installation)
- [x] Update fiberpath_gui/README.md: Remove Python CLI prerequisite, clarify bundled vs development modes
- [x] Update fiberpath_gui/docs/development.md: Add bundled CLI section, document fallback to system PATH for devs
- [x] Update fiberpath_gui/docs/architecture/cli-integration.md: Document bundled executable discovery logic

**Progress:** 8/8 tasks complete (100%)

**Documentation Requirements:**

**User-Facing (Hide Implementation):**

- README/getting-started: Emphasize "download and run" with no setup
- Troubleshooting: Common issues (Gatekeeper on macOS, permissions on Linux, antivirus on Windows)
- Installation differences: MSI vs NSIS, .deb vs AppImage, Intel vs ARM

**Developer-Facing (Expose Implementation):**

- Packaging docs: PyInstaller workflow, `--collect-all` flags, CI freeze job
- Development mode: Bundled CLI detection → system PATH fallback (`which fiberpath`)
- CLI integration: Platform-specific paths (`_up_/` on Windows installed, `bundled-cli/` elsewhere)
- Resource structure: Tauri v2 `resource_dir()`, Windows `_up_` subdirectory quirk

**Critical Notes:**

- Users should NOT see "PyInstaller" or "frozen executable" - just "bundled CLI"
- Devs MUST understand fallback logic - contributors need `pip install -e .` without freezing
- Platform-specific docs: Serial ports (`COM1` vs `/dev/ttyUSB0`), shortcuts (Ctrl vs Cmd)
- Troubleshooting essential: Unsigned app warnings, serial permissions, antivirus false positives

---

## Phase 6: Release Notes & Assets

- [ ] Update `.github/workflows/release.yml` - enhance release notes generation with structured format
- [x] Add CORE section to release notes: PyPI package info, installation command, links to package/source
- [x] Add GUI section to release notes: Platform-specific installer filenames, features, bundled CLI highlights
- [ ] Add version-specific installer names: `FiberPath_X.Y.Z_x64_en-US.msi`, `FiberPath_X.Y.Z_universal.dmg`, etc.
- [ ] Verify release assets uploaded correctly: all 5 installer types (msi, nsis exe, dmg, deb, AppImage)
- [ ] Add installation instructions per platform: Windows (run .msi), macOS (drag to Applications), Linux (.deb vs AppImage)
- [ ] Include "What's New" highlights: major features, breaking changes, deprecations
- [ ] Test release notes rendering on GitHub: check formatting, links, emoji support

**Progress:** 2/8 tasks complete (25%)

**Release Notes Structure:**

````markdown
## FiberPath X.Y.Z

### 🐍 CORE (Python Backend)

Package published to PyPI with full CLI and API functionality:

**Installation:**

```bash
pip install fiberpath==X.Y.Z
```
````

**Package Details:**

- 📦 [PyPI Package](https://pypi.org/project/fiberpath/X.Y.Z/)
- 📚 [Source Code](https://github.com/CameronBrooks11/fiberpath/tree/vX.Y.Z)
- 💻 CLI tools: plan, simulate, plot, stream, interactive
- 🔌 API server: uvicorn fiberpath_api.main:app
- ⚙️ Requires: Python 3.11+

### 🖥️ GUI (Desktop Application)

Standalone installers with bundled Python CLI (no Python required):

**Windows:**

- 📥 FiberPath_X.Y.Z_x64_en-US.msi (recommended)
- 📥 FiberPath_X.Y.Z_x64-setup.exe (NSIS alternative)

**macOS:**

- 📥 FiberPath_X.Y.Z_universal.dmg
- 📥 FiberPath.app bundle

**Linux:**

- 📥 fiberpath_X.Y.Z_amd64.deb (Debian/Ubuntu)
- 📥 fiberpath_X.Y.Z_amd64.AppImage (universal)

**Features:**

- ✅ No Python installation required
- ✅ Bundled frozen CLI (42 MB)
- ✅ Visual planning & simulation
- ✅ Real-time Marlin streaming

### 📋 Changelog

[Auto-generated commit list and comparison link]

````

**Critical Notes:**

- Release notes auto-generated by GitHub Actions using github-script
- Must include accurate installer filenames - users download by name
- Highlight "no Python required" prominently - key differentiator for GUI
- Version numbers embedded in asset names for easy identification
- Links to PyPI, source, and changelog for discoverability
- Emoji for visual organization and scanability

---

## Summary

| Phase                           | Tasks  | Status  |
| ------------------------------- | ------ | ------- |
| 1 - CLI Freezing Infrastructure | 8      | 75%     |
| 2 - Tauri Integration           | 12     | 92%     |
| 3 - CI/CD Workflow Updates      | 12     | 100%    |
| 4 - Testing & Validation        | 5      | 100%    |
| 5 - Documentation Updates       | 8      | 100%    |
| 6 - Release Notes & Assets      | 8      | 25%     |
| **Total**                       | **53** | **78%** |

**Timeline:** 3-4 days (one developer)

**Key Technical Details:**

- **PyInstaller Config:** `--onefile`, hidden imports for all fiberpath modules, console hidden on Windows
- **Bundled Paths:** Windows `resources/fiberpath.exe`, macOS `Resources/fiberpath`, Linux `resources/fiberpath`
- **Fallback Logic:** Check bundled path first → system PATH → error with install instructions
- **CI Artifacts:** CLI executables 7 days, installers 30 days, releases permanent
- **Size Target:** Frozen CLI < 80 MB, total installer < 200 MB

**Risk Mitigation:**

- PyInstaller missing dependencies → test on clean systems, add hidden imports explicitly
- Antivirus false positives → code signing (future), document known issues
- Platform-specific bundling issues → extensive testing on all platforms, PyInstaller compatibility
- Update complexity → standard reinstall works, auto-updater deferred to v0.6.0

**Future Enhancements:** Auto-update (v0.6.0), code signing (v0.6.0), bundle optimization, bundled examples

**References:** [python-bundling-strategy.md](python-bundling-strategy.md), [PyInstaller Docs](https://pyinstaller.org/), [Tauri Bundling](https://tauri.app/v1/guides/building/)

---

## Implementation Issues & Solutions

### Issue 1: Tauri v2 Windows `_up_` Subdirectory (Root Cause)

**Problem:** Tauri v2 places Windows installed app resources in `resource_dir/_up_/bundled-cli/` but code checked `resource_dir/bundled-cli/`. CLI existed but wasn't found.

**Solution (30a8f9f):** Check `_up_/bundled-cli/fiberpath.exe` first (installed), fallback to `bundled-cli/fiberpath.exe` (dev).

### Issue 2: PyInstaller Missing Dependencies

**Problem:** 8.2 MB executable with `ModuleNotFoundError: typer`. PyInstaller `--hidden-import` adds import references but not package data/binaries.

**Solution (9171673):** Changed to `--collect-all` for typer, rich, pydantic, numpy, PIL, serial → 42 MB executable with full dependencies.

### Issue 3: CI Cache Poisoning

**Problem:** Fixed PyInstaller config but CI still produced 8.2 MB broken builds. Composite action `setup-python` cached venv on `pyproject.toml` hash only, not `scripts/`.

**Solution (15070ba):** Bypassed cache, install directly with pip. Added size verification (`< 20 MB = fail fast`).

### Issue 4: Console Window Flash

**Problem:** PyInstaller `--console` required for stdio (--noconsole hangs in subprocess), but causes console flash on Windows.

**Solution (eeeaa4a):** Created `cli_process.rs` wrapper using Windows `CREATE_NO_WINDOW` flag (0x08000000):

```rust
command.creation_flags(CREATE_NO_WINDOW);  // Suppresses window, preserves stdio pipes
````

CLI remains console subsystem for working stdio, flag prevents visible window at spawn.

### Debugging & Lessons

**Removed (feb893a):** Verbose logging, directory listings, stdout/stderr capture in diagnostics. Simplified version remains.

**Key Takeaways:**

- Tauri v2 Windows: always check `_up_` subdirectory for installed apps
- PyInstaller: use `--collect-all` for third-party packages, not `--hidden-import`
- CI: venv caching can mask build script changes
- Windows CLI spawning: use `CREATE_NO_WINDOW` flag, not `--noconsole` subsystem
- In-app diagnostics crucial for identifying resource path mismatches
