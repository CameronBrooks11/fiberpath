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

**Progress:** 11/11 tasks complete (100%)

**Critical Notes:**

- Use existing `setup-python` composite action - already configured with uv and caching
- Each platform matrix job (Windows/macOS/Linux) runs separately - no cross-compilation
- CI artifact flow: freeze job uploads → package job downloads → same platform, same run
- Artifact naming must be consistent: `fiberpath-cli-windows-latest`, `fiberpath-cli-macos-latest`, etc.
- Tauri build expects bundled CLI in place BEFORE `npm run package` executes
- Retention: CLI artifacts 7 days (intermediate), GUI installers 30 days, releases permanent

---

## Phase 4: Testing & Validation

- [ ] Windows: Fresh Win 10/11 VM, no Python, install `.msi`/`.exe`, test plan→simulate→plot→stream
- [ ] Windows: Verify no console windows flash during operation (test `--noconsole` flag effectiveness)
- [ ] macOS: Fresh macOS 13+, no Python, install `.dmg`, run same test suite
- [ ] macOS: Test Intel and ARM compatibility (separate builds if needed per Phase 1 note)
- [ ] Linux: Fresh Ubuntu 22.04 VM, no Python packages, test `.deb` and `.AppImage`
- [ ] Linux: Verify desktop integration and permissions (executable bit, AppImage FUSE requirements)
- [ ] Upgrade: Install v0.5.0 → upgrade to v0.5.1, verify bundled CLI takes precedence, no conflicts
- [ ] Fallback: Development build without bundled CLI, verify system PATH fallback works (critical for devs)
- [ ] Integration: Test all IPC commands (validate, plan, simulate, visualize), error handling, startup health check
- [ ] Platform: Test uninstall cleanly removes files on all platforms, no leftover bundled CLI artifacts

**Progress:** 0/10 tasks complete (0%)

**Critical Notes:**

- Test on FRESH systems without Python - primary use case for this entire feature
- Interactive mode (`fiberpath interactive`) MUST work - Marlin streaming depends on it
- Development fallback critical - devs should NOT need to freeze CLI for local Tauri dev server
- All four core workflows: validate config → plan path → simulate → visualize/stream
- Upgrade path: ensure v0.5.1 bundled CLI doesn't conflict with user's existing `fiberpath` in PATH

---

## Phase 5: Documentation Updates

- [ ] Update `README.md`: Confirm "No Python installation required" is accurate, add note about bundled backend
- [ ] Update `docs/getting-started.md`: Remove Python prerequisite for GUI-only installation path
- [ ] Update `fiberpath_gui/README.md`: Remove CLI PATH requirement, add development vs production distinction
- [ ] Update `docs/development/packaging.md`: Document PyInstaller process, bundled resource structure, CI workflow
- [ ] Update `fiberpath_gui/docs/development.md`: Add bundled CLI section, explain dev fallback logic to system PATH
- [ ] Create `docs/troubleshooting.md`: CLI not found errors, verification commands, reinstall steps, antivirus false positives

**Progress:** 0/6 tasks complete (0%)

**Critical Notes:**

- README already says "No Python required" - verify this is NOW actually true after bundling
- Development docs critical - contributors need to understand bundled vs system CLI behavior
- Troubleshooting guide must address: "command not found" (shouldn't happen now), antivirus quarantine, startup failures
- User-facing docs should NOT expose technical details like PyInstaller or freezing process

---

## Summary

| Phase                           | Tasks  | Status  |
| ------------------------------- | ------ | ------- |
| 1 - CLI Freezing Infrastructure | 8      | 75%     |
| 2 - Tauri Integration           | 12     | 92%     |
| 3 - CI/CD Workflow Updates      | 11     | 100%    |
| 4 - Testing & Validation        | 10     | 0%      |
| 5 - Documentation Updates       | 6      | 0%      |
| **Total**                       | **47** | **60%** |

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
