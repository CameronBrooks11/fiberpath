# CI/CD Workflow Architecture

## Overview

The FiberPath CI/CD system has been completely reorganized for v3 to:
- Eliminate redundancy and improve maintainability
- Establish clear naming conventions
- Separate concerns (CI vs packaging vs deployment)
- Add missing automation (PyPI publishing, coordinated releases)
- Reduce GitHub Actions minutes usage

## Structure

### Composite Actions (`.github/actions/`)

Reusable setup steps used across multiple workflows:

1. **setup-python/**
   - Sets up Python 3.11 with uv package manager
   - Creates virtual environment
   - Installs dependencies with caching
   - Configurable dependency groups
   - Used by: backend-ci, backend-publish, docs-ci, docs-deploy

2. **setup-node/**
   - Sets up Node.js 20
   - Configures npm cache
   - Installs GUI dependencies
   - Used by: gui-ci, gui-packaging

3. **setup-rust/**
   - Sets up Rust toolchain
   - Configures cargo cache
   - Optionally installs Linux Tauri dependencies
   - Used by: gui-ci, gui-packaging

### Workflows (`.github/workflows/`)

#### CI Workflows (run on every push/PR)

**backend-ci.yml** - Python Backend CI
- Triggers: Push to main, PRs affecting Python code
- Jobs:
  1. Lint & Type Check (Ruff, MyPy)
  2. Test on ubuntu/macos/windows (pytest)
- Status: [![Backend CI](https://github.com/USER/fiberpath/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/USER/fiberpath/actions/workflows/backend-ci.yml)

**gui-ci.yml** - GUI CI
- Triggers: Push to main, PRs affecting GUI code
- Jobs:
  1. Lint & Type Check (ESLint, TypeScript)
  2. Test & Build (Vitest, coverage, Vite build)
- Status: [![GUI CI](https://github.com/USER/fiberpath/actions/workflows/gui-ci.yml/badge.svg)](https://github.com/USER/fiberpath/actions/workflows/gui-ci.yml)

**docs-ci.yml** - Documentation CI
- Triggers: Push to main, PRs affecting docs
- Jobs:
  1. Validate MkDocs build (--strict)
- Status: [![Docs CI](https://github.com/USER/fiberpath/actions/workflows/docs-ci.yml/badge.svg)](https://github.com/USER/fiberpath/actions/workflows/docs-ci.yml)

#### Deployment Workflows

**docs-deploy.yml** - Documentation Deployment
- Triggers: Push to main affecting docs/, manual dispatch
- Jobs:
  1. Build MkDocs site
  2. Deploy to GitHub Pages
- Permissions: contents:read, pages:write, id-token:write
- Status: [![Docs Deploy](https://github.com/USER/fiberpath/actions/workflows/docs-deploy.yml/badge.svg)](https://github.com/USER/fiberpath/actions/workflows/docs-deploy.yml)

#### Packaging Workflows

**gui-packaging.yml** - GUI Installer Creation
- Triggers: Push to main affecting GUI, manual dispatch, releases
- Jobs:
  1. Build installers for Windows/macOS/Linux (Tauri)
  2. Upload artifacts (30 day retention)
  3. Upload release assets (if triggered by release)
- Timeout: 45 minutes per OS
- Status: [![GUI Packaging](https://github.com/USER/fiberpath/actions/workflows/gui-packaging.yml/badge.svg)](https://github.com/USER/fiberpath/actions/workflows/gui-packaging.yml)

#### Publishing Workflows

**backend-publish.yml** - PyPI Publishing
- Triggers: GitHub releases, manual dispatch
- Jobs:
  1. Verify version matches tag
  2. Build distribution packages
  3. Publish to PyPI (trusted publishing)
- Environment: pypi (with deployment protection)
- Permissions: contents:read, id-token:write
- Status: [![Backend Publish](https://github.com/USER/fiberpath/actions/workflows/backend-publish.yml/badge.svg)](https://github.com/USER/fiberpath/actions/workflows/backend-publish.yml)

#### Release Orchestration

**release.yml** - Coordinated Release Management
- Triggers: Manual dispatch with version input
- Jobs:
  1. Validate version format and tag availability
  2. Create GitHub release with auto-generated notes
  3. Trigger backend-publish (PyPI)
  4. Trigger gui-packaging (installers)
- Inputs:
  - version: Semantic version (e.g., 0.3.0)
  - prerelease: Boolean flag
- Permissions: contents:write, id-token:write
- Status: [![Release](https://github.com/USER/fiberpath/actions/workflows/release.yml/badge.svg)](https://github.com/USER/fiberpath/actions/workflows/release.yml)

## Workflow Naming Convention

Format: `{component}-{purpose}.yml`

- **Component**: backend | gui | docs | release
- **Purpose**: ci | packaging | publish | deploy

## Trigger Strategy

| Workflow | Push (main) | Pull Request | Manual | Release |
|----------|-------------|--------------|--------|---------|
| backend-ci | ✅ | ✅ | ❌ | ❌ |
| gui-ci | ✅ | ✅ | ❌ | ❌ |
| docs-ci | ✅ | ✅ | ❌ | ❌ |
| docs-deploy | ✅ | ❌ | ✅ | ❌ |
| gui-packaging | ✅ | ❌ | ✅ | ✅ |
| backend-publish | ❌ | ❌ | ✅ | ✅ |
| release | ❌ | ❌ | ✅ | ❌ |

## Path Filters

Workflows only run when relevant files change:

- **backend-ci**: `fiberpath/**`, `fiberpath_api/**`, `fiberpath_cli/**`, `tests/**`, `pyproject.toml`
- **gui-ci**: `fiberpath_gui/**`, workflow files, composite actions
- **docs-ci**: `docs/**`, `mkdocs.yml`, `CONTRIBUTING.md`, `README.md`
- **docs-deploy**: Same as docs-ci
- **gui-packaging**: `fiberpath_gui/**`, workflow files, composite actions

## Release Process

### Manual Release Steps

1. **Prepare Release**
   - Update version in `pyproject.toml`
   - Update version in `fiberpath_gui/src-tauri/Cargo.toml`
   - Update `CHANGELOG.md` with release notes
   - Commit changes: `git commit -m "Prepare release 0.3.0"`

2. **Trigger Release Workflow**
   - Go to Actions → Release → Run workflow
   - Enter version: `0.3.0`
   - Set prerelease: `false`
   - Click "Run workflow"

3. **Automated Steps**
   - Validates version format
   - Checks if tag exists
   - Verifies version in pyproject.toml
   - Creates Git tag (e.g., `v0.3.0`)
   - Creates GitHub release with auto-generated notes
   - Triggers backend-publish (PyPI)
   - Triggers gui-packaging (installers)

4. **Post-Release**
   - Verify PyPI upload: https://pypi.org/project/fiberpath/
   - Download GUI installers from GitHub release
   - Test installers on Windows/macOS/Linux
   - Announce release

## Archived Workflows

Previous workflows moved to `.github/workflows/archive/`:

- **ci.yml** - Old monolithic Python CI (combined lint + test)
- **gui.yml** - Old GUI checks + packaging (redundant with gui-tests.yml)
- **gui-tests.yml** - Old GUI testing (redundant with gui.yml)
- **docs-site.yml** - Old docs deployment (replaced by docs-ci + docs-deploy)

## Testing Strategy

Before merging CI/CD changes to main:

1. Create test branch: `git checkout -b test-ci-workflows`
2. Push to GitHub: `git push -u origin test-ci-workflows`
3. Update workflow triggers to include test branch temporarily
4. Verify each workflow runs successfully
5. Check artifacts are created correctly
6. Test composite actions are reused properly
7. Merge to main once validated

## Improvements Over Previous System

| Issue | Previous | New Solution |
|-------|----------|--------------|
| Redundancy | gui.yml and gui-tests.yml both ran linting/building | Single gui-ci.yml with all checks |
| Naming | Inconsistent (ci.yml, gui.yml, docs-site.yml) | Consistent {component}-{purpose}.yml |
| Setup duplication | Python/Node/Rust setup repeated in every workflow | Composite actions (DRY principle) |
| PyPI publishing | Manual process | Automated with trusted publishing |
| Release coordination | Manual trigger of each workflow | Single release.yml orchestrates all |
| Documentation | No workflow docs | This document + badges in README |

## Caching Strategy

### Python (setup-python)
- Virtual environment: `.venv/` cached by OS + Python version + pyproject.toml hash
- uv cache: Built-in caching from astral-sh/setup-uv@v3

### Node.js (setup-node)
- npm modules: `~/.npm` cached by actions/setup-node@v4 with package-lock.json hash

### Rust (setup-rust)
- Cargo artifacts: `~/.cargo/` + `target/` cached by OS + Cargo.lock hash
- Binaries, registry, git index

## Future Enhancements

- [ ] Add workflow status badges to README.md
- [ ] Document in CONTRIBUTING.md
- [ ] Add Codecov integration for coverage tracking
- [ ] Add dependabot for workflow action updates
- [ ] Add workflow matrix testing for multiple Python versions
- [ ] Add performance benchmarking workflow
- [ ] Add security scanning (Snyk, SAST)
- [ ] Add automatic changelog generation
- [ ] Add automatic version bumping

## Troubleshooting

### Workflow Not Triggering

1. Check path filters - workflow only runs if affected files changed
2. Verify branch name matches trigger configuration
3. Check workflow file syntax (YAML validation)
4. Look for workflow run history in Actions tab

### Composite Action Errors

1. Verify action.yml exists in correct location
2. Check inputs are passed correctly from workflow
3. Ensure shell type is specified (bash/pwsh)
4. Review action logs for specific error messages

### Failed Builds

1. Check if dependencies changed (update lock files)
2. Verify environment variables are set correctly
3. Look for OS-specific issues (Linux deps for Tauri)
4. Review cache invalidation (might need manual clear)

### PyPI Publishing Failures

1. Verify trusted publishing is configured in PyPI project settings
2. Check version matches tag (validation step)
3. Ensure workflow has id-token:write permission
4. Verify environment "pypi" exists with protection rules

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Composite Actions](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action)
- [PyPI Trusted Publishing](https://docs.pypi.org/trusted-publishers/using-a-publisher/)
- [Tauri GitHub Action](https://github.com/tauri-apps/tauri-action)
- [MkDocs Material](https://squidfunk.github.io/mkdocs-material/)
