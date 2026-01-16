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
- [x] Verify executable size acceptable (< 80 MB per platform)
- [ ] ~~Test local macOS freeze: verify Intel/ARM builds~~ (deferred to v0.5.2)
- [ ] ~~Test local Linux freeze: verify on Ubuntu 22.04, check glibc compatibility~~ (deferred to v0.5.2)

**Progress:** 6/6 tasks complete for v0.5.1 scope (100%)

**Notes:** Windows fully tested (42 MB executable). macOS/Linux support deferred to v0.5.2. Entry point: `fiberpath_cli.main:app`. Uses `--collect-all` for dependencies.

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
- [x] Call `check_cli_health` on app startup (from React), show toast/dialog if fails
- [x] Update error messages: suggest manual install instructions if bundled CLI not found

**Progress:** 12/12 tasks complete (100%)

**Notes:** CliHealthProvider wraps app and checks CLI on startup. Fallback logic: bundled → system PATH → error. Windows uses `_up_/` subdirectory for installed apps.

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

**Notes:** CI freeze-cli job creates artifacts per platform. Package job downloads and embeds before Tauri build.

---

## Phase 4: Testing & Validation

- [x] Windows: Fresh Win 10/11 PC, no Python, install `.msi`, verify bundled CLI found and executable
- [x] Windows: Verify no console windows flash during operation (CREATE_NO_WINDOW flag working)
- [x] Windows: Upgrade path - Install v0.5.0 → upgrade to v0.5.1, verify bundled CLI takes precedence, no conflicts
- [x] Windows: Integration testing - Full workflow testing validate→plan→simulate→plot/stream on clean install
- [x] Windows: Uninstall testing - Verify clean removal of files, no leftover bundled CLI artifacts

**Progress:** 5/5 tasks complete (100%)

**Notes:** Windows testing complete on fresh systems. macOS/Linux testing deferred to v0.5.2.

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

**Notes:** User docs emphasize "no Python required." Developer docs explain PyInstaller workflow and fallback logic. Troubleshooting guide covers platform-specific issues.

---

## Phase 6: Release Notes & Assets

**Objective:** Ensure release notes are informative, scannable, and guide users to the right download. Follow industry best practices from Tauri, Rust, VS Code for clear multi-platform releases.

**Core Principles:**

- **User-first:** Non-technical users should understand what's new and which file to download
- **Scannable:** Use headings, lists, and visual hierarchy (emoji sparingly)
- **Accurate:** Installer filenames must match actual artifacts (auto-verify in workflow)
- **Contextual:** Link to relevant docs, issues, and migration guides
- **Discoverable:** Optimize for GitHub's release page and RSS feeds

### Tasks

- [x] Structure release notes with CORE/GUI sections (completed in prior work)
- [x] Auto-generate installer filenames in release notes body (completed in release.yml)
- [x] Add "What's New" summary section at top (3-5 key highlights before technical details)
- [x] Add platform-specific installation instructions (expand each platform's section)
- [x] Add verification step in workflow: check all expected assets exist before publishing release
- [x] Include breaking changes section (if any) with migration guidance
- [x] Add "Known Issues" section referencing open GitHub issues
- [x] Add documentation links: getting-started, troubleshooting, changelog

**Progress:** 9/9 tasks complete (100%)

**Notes:** Release workflow generates notes with: Desktop Installers section (5 assets), Python Package section (PyPI link), Changelog (categorized commits). Links to docs. Simple, reusable format.

---

## Phase 7: Pre-Release Validation

- [ ] Update version in pyproject.toml to 0.5.1
- [ ] Update version badge in docs/index.md to 0.5.1
- [ ] Verify all CI workflows pass on v0.5.1-dev branch
- [ ] Review CHANGELOG.md - ensure v0.5.1 entry exists with all changes
- [ ] Verify mkdocs builds without warnings (`mkdocs build --strict`)
- [ ] Final review: README.md, getting-started.md, troubleshooting.md accuracy
- [ ] Merge v0.5.1-dev → main (PR with full testing results)
- [ ] Tag v0.5.1 and trigger release workflow
- [ ] Test release workflow end-to-end: verify assets upload correctly (all 5 installers + PyPI package)
- [ ] Test download + install one platform from GitHub release

**Progress:** 0/10 tasks complete (0%)

**Notes:** Final validation before merge and release. Ensures version consistency, CI health, and documentation accuracy.

---

## Summary

| Phase                           | Tasks  | Status  |
| ------------------------------- | ------ | ------- |
| 1 - CLI Freezing Infrastructure | 6      | 100%    |
| 2 - Tauri Integration           | 12     | 100%    |
| 3 - CI/CD Workflow Updates      | 12     | 100%    |
| 4 - Testing & Validation        | 5      | 100%    |
| 5 - Documentation Updates       | 8      | 100%    |
| 6 - Release Notes & Assets      | 9      | 100%    |
| 7 - Pre-Release Validation      | 10     | 0%      |
| **Total**                       | **62** | **84%** |

**Key Details:**

- Frozen CLI: 42 MB (PyInstaller `--onefile` with `--collect-all`)
- Bundled paths: Windows `_up_/bundled-cli/`, macOS/Linux `bundled-cli/`
- Fallback: bundled → system PATH → error
- CI: Freeze job per platform, artifacts embedded before Tauri build

---

## Implementation Notes

**Key Issues Resolved:**

1. **Windows `_up_/` paths** - Tauri v2 installed apps use `_up_/` subdirectory
2. **PyInstaller deps** - Used `--collect-all` instead of `--hidden-import` (42 MB vs 8 MB)
3. **CI cache** - Bypassed venv cache for freeze script changes
4. **Console flash** - Used `CREATE_NO_WINDOW` flag in Rust spawning

**Lessons:** Always check `_up_/` on Windows, use `--collect-all` for PyInstaller, CI cache can mask script changes.
