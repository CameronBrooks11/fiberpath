# Release Checklist

## Pre-Release

- [ ] All CI workflows passing on target branch (backend-ci, gui-ci, docs-ci, gui-packaging)
- [ ] All planned features from roadmap completed and tested
- [ ] Manual testing on Windows/macOS/Linux (GUI streaming, planning workflows)

## Version Updates

Update version strings in these files (single source of truth for each stack):

- [ ] **`pyproject.toml`** – Line 7: `version = "X.Y.Z"` (Python packages read from this)
- [ ] **`fiberpath_gui/src-tauri/Cargo.toml`** – Line 3: `version = "X.Y.Z"` (Tauri/Rust reads from this)
- [ ] **`fiberpath_gui/src-tauri/tauri.conf.json`** – Line 10: `"version": "X.Y.Z"` (Tauri bundle metadata)
- [ ] **`fiberpath_gui/package.json`** – Line 3: `"version": "X.Y.Z"` (npm package metadata)
- [ ] **`README.md`** – Lines 15-16: Two version badges referencing current release
- [ ] **`docs/index.md`** – Line 5: Download link version reference

**Note:** `fiberpath_api/main.py` and `AboutDialog.tsx` auto-read from `pyproject.toml` and `Cargo.toml` respectively.

## Lock Files

Refresh dependency locks after version updates:

- [ ] **`uv.lock`** – Run `uv lock` to refresh Python dependencies
- [ ] **`fiberpath_gui/package-lock.json`** – Run `cd fiberpath_gui && npm install`
- [ ] **`fiberpath_gui/src-tauri/Cargo.lock`** – Run `cd fiberpath_gui && npm run tauri build` (auto-updates)

## Documentation

- [ ] Create/update `CHANGELOG.md` with notable changes since last release
- [ ] Review and update feature documentation in `docs/` for any changed behavior
- [ ] Update `docs/index.md` "What's New" section with release highlights
- [ ] Verify all code examples and CLI commands in docs reflect current syntax
- [ ] Check for any outdated version references in documentation

## Quality Checks

- [ ] Run full test suite locally: `uv run pytest -v`
- [ ] Verify Python package builds: `uv build` (check `dist/` output)
- [ ] Test GUI installers on target platforms (use workflow artifacts or local builds)
- [ ] Verify API starts successfully: `uvicorn fiberpath_api.main:app`
- [ ] Smoke test CLI commands: `fiberpath plan`, `fiberpath simulate`, `fiberpath stream --dry-run`

## Release Workflow

- [ ] Push all version updates and documentation to main branch
- [ ] Wait for all CI checks to pass
- [ ] Navigate to GitHub Actions → **Release** workflow
- [ ] Click "Run workflow" and input version (e.g., `0.3.14`)
- [ ] Select pre-release checkbox if applicable
- [ ] Monitor workflow execution:
  - Validation checks version format and pyproject.toml match
  - Creates git tag and GitHub release
  - Publishes Python package to PyPI via trusted publishing
  - Builds Tauri installers for Windows/macOS/Linux
  - Attaches installers to GitHub release

## Post-Release Verification

- [ ] Verify GitHub release page has all artifacts attached (`.msi`, `.dmg`, `.deb`, `.AppImage`)
- [ ] Verify PyPI listing: https://pypi.org/project/fiberpath/
- [ ] Test installation from PyPI: `pip install fiberpath==X.Y.Z`
- [ ] Download and test one GUI installer per platform
- [ ] Verify documentation site updated with new version: https://cameronbrooks11.github.io/fiberpath
- [ ] Update any external links or announcements referencing old version
- [ ] Create PR to bump version to next development version (e.g., `0.6.0-dev`)

## Notes

- **Version Format:** Use semantic versioning (`X.Y.Z` or `X.Y.Z-rc.N` for pre-releases)
- **Branch Strategy:** Release from `main` branch only
- **CI Automation:** Release workflow orchestrates PyPI publish, GUI packaging, and artifact uploads
- **Rollback:** If issues found post-release, create hotfix branch and follow checklist with patch version
