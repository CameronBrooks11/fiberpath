# Contributing to FiberPath

Thanks for investing time in the project! This guide explains how to set up a development environment, follow the coding standards, and get changes merged smoothly.

## Development Environment

1. **Install prerequisites:** Python 3.11+, Node.js 18+ (for the GUI), Rust toolchain (for Tauri), and `uv` for deterministic Python environments.
2. **Create a virtual environment:**

   ```sh
   uv venv
   source .venv/bin/activate  # or .venv\Scripts\activate on Windows
   ```

3. **Install dependencies:**

   ```sh
   uv pip install -e .[dev,cli,api]
   ```

4. **Optional extras:**
   - GUI: `cd fiberpath_gui && npm install`
   - Docs tooling: `uv pip install .[docs]`

## Coding Standards

- **Formatting & linting:** Ruff enforces style, imports, and best practices. Run `uv run ruff check` before committing.
- **Type checking:** MyPy runs in strict mode across `fiberpath`, `fiberpath_cli`, and `fiberpath_api`. Use `uv run mypy` and prefer adding annotations rather than suppressions.
- **Tests:** `uv run pytest` exercises all unit/integration suites. Add targeted tests for new planner logic, CLI behavior, or API endpoints.
- **Docs:** Keep `docs/*.md` in sync with feature work. Significant planner or simulator changes usually deserve updates to `docs/architecture.md` or `docs/planner-math.md`.

## Pull Request Checklist

1. `uv run ruff check`
2. `uv run mypy`
3. `uv run pytest`
4. Update documentation and add changelog entries (once release tracking is in place).
5. Ensure commits are scoped and descriptive. Squash locally if needed before opening the PR.

CI will enforce the same Ruff/MyPy/Pytest pipeline on every PR. If a job fails, reproduce locally with the matching `uv run …` command.

## CI/CD Workflows

FiberPath uses GitHub Actions with 7 specialized workflows:

- **backend-ci.yml** - Python linting (Ruff), type checking (MyPy), testing (pytest on 3 OS)
- **gui-ci.yml** - GUI linting (ESLint), type checking (tsc), testing (Vitest), building (Vite)
- **docs-ci.yml** - Documentation validation (MkDocs --strict)
- **docs-deploy.yml** - Documentation deployment to GitHub Pages (main branch only)
- **gui-packaging.yml** - Tauri installer creation for Windows/macOS/Linux
- **backend-publish.yml** - PyPI publishing with trusted publishing (releases only)
- **release.yml** - Coordinated release orchestration (manual dispatch)

All workflows use reusable composite actions (`.github/actions/`) for setup steps. See [docs/ci-cd.md](docs/ci-cd.md) for complete architecture documentation.

**Branch Triggers:**

- CI workflows (backend-ci, gui-ci, docs-ci) run on `main`, `newgui`, and all PRs
- Deployment (docs-deploy) runs only on `main` to prevent accidental deployments
- Packaging and publishing run on releases or manual dispatch

## Issue Triage & Discussion

- Use GitHub Issues for bugs and feature requests. Include `.wind` or `.gcode` snippets when relevant.
- Draft PRs are welcome for early feedback—link them to the corresponding issue for visibility.
- For larger architecture changes, open a discussion post or add a proposal document under `docs/proposals/` before writing code.

We appreciate every contribution, from typo fixes to new planner strategies. Thank you!
