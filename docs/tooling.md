# Tooling Reference

Quick reference for all linting, formatting, type checking, and testing commands across the FiberPath stack.

## Python Backend

Commands run from project root with `uv run <command>`:

| Command            | Alias         | Tool   | Purpose                                  |
| ------------------ | ------------- | ------ | ---------------------------------------- |
| `uv run lint`      | `ruff check`  | Ruff   | Linting (style, imports, best practices) |
| `uv run format`    | `ruff format` | Ruff   | Code formatting (replaces black)         |
| `uv run typecheck` | `mypy`        | MyPy   | Static type checking (strict mode)       |
| `uv run test`      | `pytest -v`   | Pytest | Run test suite with verbose output       |

**Alias Location:** `pyproject.toml` → `[project.entry-points."uv.tool"]`

**Config Locations:**

- Ruff: `[tool.ruff]` and `[tool.ruff.lint]` in `pyproject.toml`
- MyPy: `[tool.mypy]` in `pyproject.toml`
- Pytest: `[tool.pytest.ini_options]` in `pyproject.toml`
- Coverage: `[tool.coverage.run]` in `pyproject.toml`

**Direct Commands (no alias):**

```sh
uv run ruff check              # Lint only
uv run ruff format             # Format only
uv run ruff check --fix        # Auto-fix linting issues
uv run mypy                    # Type check
uv run pytest -v               # Run tests
uv run pytest -v --cov         # Run tests with coverage
uv build                       # Build Python package (dist/)
```

## GUI Frontend (TypeScript/React)

Commands run from `fiberpath_gui/` directory with `npm run <script>`:

| Script          | Command                                       | Tool       | Purpose                                       |
| --------------- | --------------------------------------------- | ---------- | --------------------------------------------- |
| `lint`          | `tsc --noEmit`                                | TypeScript | Type checking (no output files)               |
| `lint:css`      | `stylelint "src/**/*.css"`                    | Stylelint  | CSS linting                                   |
| `lint:css:fix`  | `stylelint "src/**/*.css" --fix`              | Stylelint  | Auto-fix CSS issues                           |
| `format:check`  | `cd src-tauri && cargo fmt --check`           | Rustfmt    | Check Rust formatting                         |
| `format:fix`    | `cd src-tauri && cargo fmt`                   | Rustfmt    | Format Rust code                              |
| `clippy`        | `cd src-tauri && cargo clippy -- -D warnings` | Clippy     | Rust linting                                  |
| `check:all`     | (composite)                                   | Multiple   | Run all checks (TS, CSS, Rust format, clippy) |
| `test`          | `vitest`                                      | Vitest     | Run GUI tests (watch mode)                    |
| `test:coverage` | `vitest run --coverage`                       | Vitest     | Run tests with coverage report                |
| `build`         | `vite build`                                  | Vite       | Build production bundle                       |

**Alias Location:** `fiberpath_gui/package.json` → `"scripts"`

**Config Locations:**

- TypeScript: `tsconfig.json` and `tsconfig.node.json` in `fiberpath_gui/`
- Stylelint: Uses `stylelint-config-standard` (installed package)
- Vitest: `vitest.config.ts` in `fiberpath_gui/`
- Vite: `vite.config.ts` in `fiberpath_gui/`
- Rust: `src-tauri/Cargo.toml`

**Full Check Sequence:**

```sh
cd fiberpath_gui
npm run lint              # TypeScript type check
npm run lint:css          # CSS lint
npm run format:check      # Rust format check
npm run clippy            # Rust lint
npm test                  # Run tests
npm run build             # Production build

# Or run all checks at once:
npm run check:all && npm test
```

## CI/CD Equivalents

What GitHub Actions runs (match locally before pushing):

**Backend CI:**

```sh
uv run ruff check
uv run mypy
uv run pytest -v --cov --cov-report=xml
```

**GUI CI:**

```sh
cd fiberpath_gui
npm run lint                     # TypeScript
npm run lint:css                 # Stylelint (not in CI yet, TODO)
npm test                         # Vitest
npm run test:coverage            # Coverage report
npm run build                    # Vite build
```

**Note:** Rust formatting/linting (`cargo fmt`, `cargo clippy`) not yet in CI workflows. TODO.

## Quick Command Summary

| Task           | Python                                             | GUI                                                                    |
| -------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| **Format**     | `uv run format`                                    | `npm run format:fix` (Rust only)                                       |
| **Lint**       | `uv run lint`                                      | `npm run lint` (TS), `npm run lint:css` (CSS), `npm run clippy` (Rust) |
| **Type Check** | `uv run typecheck`                                 | `npm run lint` (tsc)                                                   |
| **Test**       | `uv run test`                                      | `npm test`                                                             |
| **Build**      | `uv build`                                         | `npm run build`                                                        |
| **All Checks** | `uv run lint && uv run format && uv run typecheck` | `npm run check:all`                                                    |
