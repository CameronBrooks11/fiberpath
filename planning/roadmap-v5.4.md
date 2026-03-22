# FiberPath Roadmap v5.4 - High-Risk Dependency Migrations and Scanning Automation

**Target Release:** v0.5.4  
**Status:** Planned (intake ready; execution begins after v0.5.3 is confirmed released)  
**Prerequisites:** v0.5.3 released with low-risk dependency upgrades complete  
**Timeline:** ~1–2 weeks after v0.5.3 ships; scope-dependent on migration complexity

**Scope Boundary:** v5.4 handles all deferred major/migration-heavy upgrades from v0.5.3 Bucket B, plus dependency scanning automation and update policy close-out. Feature work is out of scope.
**Related Roadmaps:** [roadmap-v5.3.md](roadmap-v5.3.md) for the completed low-risk refresh and the source Bucket B list; [roadmap-v6.md](roadmap-v6.md) starts after v5.4 stabilization handoff.

---

## Objective

Complete dependency modernization by safely executing the major-version and migration-heavy upgrades deferred from v0.5.3, then close out with durable dependency scanning automation and update policy guardrails so the project never accumulates this level of debt again.

---

## Strategy Notes

- Execute upgrades in dependency order: lower-level libraries (starlette, thiserror) before their consumers (fastapi).
- Isolate ecosystems into separate commits/PRs so a regression in one doesn't block the others.
- If any upgrade causes packaging or runtime instability that cannot be resolved within the v0.5.4 scope, reclassify the item to v0.6.0+ with a documented rationale rather than holding the release.
- Phase 4 (scanning automation) is a non-negotiable close-out gate — v0.5.4 does not ship without it.

---

## Phase 1: Intake and Pre-Migration Assessment

Deliverable: confirmed candidate list with baseline test metrics and migration scope per item.

### Bucket B Intake (Carried from v0.5.3 Audit Matrix)

| Ecosystem | Package | v0.5.3 Baseline | Candidate | Risk | Primary Migration Concern |
| --------- | ------- | --------------- | --------- | ---- | ------------------------- |
| Python | starlette | 0.50.0 | 1.0.0 | High | Major release; breaking changes in routing/middleware/testclient API |
| Python | fastapi | 0.128.0 | 0.135.1 | Medium | Dependent on starlette compat; needs re-evaluation after starlette upgrade |
| Python | typer | 0.20.0 | 0.24.1 | Medium | CLI behavior changes across 4 minor jumps; needs full CLI regression pass |
| Python | websockets | current | 16.x | Medium | Major version; async API surface used in streaming path |
| Node | vite | 5.4.21 | 8.x | High | Major release; config API changes, esbuild upgrade, plugin compat |
| Node | vitest | 2.1.9 | 4.x | High | Major release; closely tied to vite core, test API changes expected |
| Node | react / react-dom | 18.3.1 | 19.x | High | Major framework upgrade; concurrent features, ref API changes, StrictMode behavior |
| Node | zod | 3.25.76 | 4.x | High | Major release; schema API changes requiring audit of all schema definitions |
| Node | stylelint | current | 17.x | Medium | CSS/styling lint rule changes; likely config adjustments needed |
| Rust | thiserror | 1.0.69 | 2.0.18 | High | Major release; derive macro API changes, code edits required in error types |
| Rust | which | 7.0.3 | 8.0.2 | High | Major release; `which` API/behavior risk in command resolution paths |

### Pre-Migration Checklist

- [ ] Re-run fresh audits on the v0.5.3 baseline to capture any new releases in the interim
  - `uv lock --upgrade` then `uv run pip list --outdated`
  - `npm outdated` from `fiberpath_gui/`
  - `cargo outdated -R` from `fiberpath_gui/src-tauri/`
- [ ] Update the intake table above with actual post-v0.5.3 candidate versions
- [ ] Record baseline test counts: Python tests passing, GUI tests passing
- [ ] Read migration guides for each High-risk item before touching code:
  - [ ] Starlette 1.0 migration guide
  - [ ] Vite 6 → 8 migration path (review 6.x and 7.x notes)
  - [ ] Vitest 3/4 changelog
  - [ ] React 19 upgrade guide
  - [ ] Zod v4 migration guide
  - [ ] thiserror 2.x changelog

---

## Phase 2: High-Risk Upgrade Execution

Deliverable: each Bucket B item either merged (with tests passing) or formally re-deferred with rationale.

### Execution Order and Rationale

Execute in this sequence to minimize compounding risk:

1. **Rust ecosystem first** — independent of Python/Node; small code surface; failures are compile-time
2. **Python: starlette 1.0** — lower-level; fastapi depends on it; migrate before upgrading fastapi
3. **Python: fastapi** — re-evaluate against the updated starlette baseline
4. **Python: typer and websockets** — independent of starlette/fastapi; can run in parallel with step 3
5. **Node: vite + vitest together** — vitest depends on vite's core; upgrade as a coordinated pair
6. **Node: react / react-dom** — major framework bump; isolated React-layer changes
7. **Node: zod** — schema API migration; audit all `z.` usages before upgrading
8. **Node: stylelint** — config/rule migration; low functional risk

### Rust

- [ ] Upgrade `thiserror` to 2.x in `fiberpath_gui/src-tauri/Cargo.toml`
  - Audit all `#[derive(thiserror::Error)]` uses in the crate for derive macro changes
  - Confirm display/source attribute syntax is unchanged or migrate accordingly
  - `cargo build` and `cargo test` pass in `fiberpath_gui/src-tauri/`
- [ ] Upgrade `which` to 8.x in `fiberpath_gui/src-tauri/Cargo.toml`
  - Audit call sites for API/behavior changes (return type, error type)
  - `cargo build` pass
- [ ] Run `cargo audit` post-Rust upgrades and confirm no new advisories introduced
- [ ] Run Tauri build (`npm run build` from `fiberpath_gui/`) to confirm packaging still produces artifacts

### Python — starlette

- [ ] Bump `starlette` constraint in `pyproject.toml` to `>=1.0.0`
- [ ] Run `uv lock --upgrade-package starlette`
- [ ] Run full test suite; record any new failures
- [ ] Focus areas for regression: TestClient behavior, middleware ordering, WebSocket route handling
- [ ] Fix regressions in `fiberpath_api/` route tests and `tests/api/`
- [ ] Confirm uvicorn startup smoke still passes

### Python — fastapi

- [ ] After starlette 1.0 is confirmed stable, bump `fastapi` constraint to `>=0.135.1`
- [ ] Run `uv lock --upgrade-package fastapi`
- [ ] Re-run full test suite; record failures
- [ ] Focus areas: router config, lifespan events, response model handling, any deprecated parameters
- [ ] API smoke: start with `uvicorn fiberpath_api.main:app` and hit `/plan` and `/simulate` endpoints
- [ ] Fix regressions in `fiberpath_api/` and `tests/api/`

### Python — typer

- [ ] Bump `typer` constraint in `pyproject.toml` to `>=0.24.1`
- [ ] Run `uv lock --upgrade-package typer`
- [ ] Run full CLI regression pass:
  - `uv run fiberpath plan examples/simple_cylinder/input.wind`
  - `uv run fiberpath simulate examples/simple_cylinder/input.wind`
  - `uv run fiberpath plot examples/simple_cylinder/input.wind`
  - `uv run fiberpath stream examples/simple_cylinder/input.wind --dry-run`
  - `uv run fiberpath validate examples/simple_cylinder/input.wind`
- [ ] Run `uv run pytest tests/cli/` and confirm all pass
- [ ] Check for help text regressions (`--help` output) that may affect docs

### Python — websockets

- [ ] Check if `websockets` is a direct dependency or transitive (from fastapi/starlette streaming path)
- [ ] If direct: bump constraint and run streaming smoke test
- [ ] If transitive only: confirm version resolved post-starlette/fastapi upgrade satisfies security requirements
- [ ] `stream` command dry-run: `uv run fiberpath stream examples/simple_cylinder/input.wind --dry-run`

### Node — vite + vitest (coordinated)

- [ ] Read Vite 6.x, 7.x, and 8.x migration docs; note required config changes
- [ ] Read Vitest 3.x and 4.x changelogs for test API changes
- [ ] Update `vite` in `fiberpath_gui/package.json` to `^8.0.0`
- [ ] Update `vitest` in `fiberpath_gui/package.json` to `^4.0.0`
- [ ] Update `vite.config.ts` and `vitest.config.ts` as required by migration docs
- [ ] `npm install` and attempt `npx vitest run`
- [ ] Fix test runner configuration errors before addressing test failures
- [ ] Run `npm run build` to confirm Tauri artifact build is unaffected
- [ ] Run `npm run lint` and fix any new lint warnings from the tooling change

### Node — react / react-dom

- [ ] Read React 19 upgrade guide; note which APIs used in the codebase are affected
- [ ] Search for deprecated patterns: `React.FC` type erasure, `forwardRef`, legacy `createRoot` usage, `act()` in tests
- [ ] Update `react` and `react-dom` (and `@types/react`, `@types/react-dom`) in `package.json`
- [ ] `npm install`; run `npx vitest run` and record failures
- [ ] Fix component-level changes in `fiberpath_gui/src/`
- [ ] Re-run full GUI test suite (target: all tests passing at parity with v0.5.3 baseline)
- [ ] Visual smoke: launch dev server (`npm run dev`) and exercise main UI flows

### Node — zod

- [ ] Audit all zod schema definitions in `fiberpath_gui/src/` and `fiberpath_api/schemas.py`-adjacent TS schemas
- [ ] Review Zod v4 migration guide for API changes (`.default()`, `.optional()`, coercion, error maps)
- [ ] Update `zod` in `package.json` to `^4.0.0`
- [ ] `npm install`; compile TypeScript (`npx tsc --noEmit`)
- [ ] Fix schema definition errors
- [ ] Re-run GUI test suite; fix any schema validation test failures

### Node — stylelint

- [ ] Check if stylelint is configured in `fiberpath_gui/` (look for `.stylelintrc.*`)
- [ ] If in use: update to 17.x, run lint, fix rule changes
- [ ] If not currently wired: defer or skip; note finding in close-out

---

## Phase 3: Stabilization and Release Prep

Deliverable: v0.5.4-ready branch with all migrations completed or formally re-deferred.

- [ ] Full Python test suite passes: `uv run --extra dev --extra api pytest` (≥96 tests)
- [ ] Full GUI test suite passes: `npx vitest run` (≥113 tests) from `fiberpath_gui/`
- [ ] `npm run build` from `fiberpath_gui/` produces clean artifact
- [ ] Tauri packaging: `npm run package` produces NSIS and MSI with correct `0.5.4` version labels
- [ ] CLI smoke: all five subcommands complete without error
- [ ] API smoke: uvicorn startup and endpoint hit
- [ ] `cargo audit` and `npm audit --audit-level=moderate` show no new unaddressed findings
- [ ] All items either shipped or re-deferred with rationale logged in this document
- [ ] Bump version to `0.5.4` across all four version anchors:
  - `pyproject.toml`
  - `fiberpath_gui/package.json`
  - `fiberpath_gui/src-tauri/Cargo.toml`
  - `fiberpath_gui/src-tauri/tauri.conf.json`
- [ ] CHANGELOG.md updated with `[0.5.4]` entry
- [ ] README.md version badge updated
- [ ] `docs/index.md` release card updated

### Re-Deferral Log

If any Bucket B item must be deferred from v0.5.4, record here:

| Package | Reason | Target |
| ------- | ------ | ------ |
| *(none yet)* | | |

---

## Phase 4: Close-Out — Dependency Scanning and Update Automation

This is a non-negotiable gate for v0.5.4 closure. Do not skip or stub.

### Dependabot Configuration

- [ ] Create `.github/dependabot.yml` with update schedules for:
  - `pip` (Python / uv-managed) — weekly, targeting `pyproject.toml`
  - `npm` — weekly, targeting `fiberpath_gui/`
  - `cargo` — weekly, targeting `fiberpath_gui/src-tauri/`
  - `github-actions` — monthly
- [ ] Set `open-pull-requests-limit` per ecosystem to a manageable number (suggested: 5)
- [ ] Add `ignore` rules for any explicitly deferred packages to suppress noisy PRs
- [ ] Confirm Dependabot is enabled in the GitHub repository settings

### CI Security Scanning Workflow

- [ ] Add `.github/workflows/dependency-audit.yml` (or integrate into existing CI):
  - Trigger: push to main, PR to main, weekly schedule
  - Python step: `uvx pip-audit --requirement <(uv export --no-hashes)` (or equivalent)
  - Node step: `npm audit --audit-level=high` from `fiberpath_gui/`
  - Rust step: `cargo audit` from `fiberpath_gui/src-tauri/` with `--deny warnings` for CVSS ≥ 7
- [ ] Set workflow to **fail on critical/high findings** so broken dependencies gate PRs
- [ ] Confirm workflow runs clean on the v0.5.4 baseline before marking it as gating

### SBOM Generation

- [ ] Add SBOM generation step to the release CI workflow:
  - Python: `cyclonedx-py` or `pip-licenses` export
  - Node: `cyclonedx-npm` or `npm sbom --sbom-format cyclonedx`
  - Rust: `cargo-cyclonedx` or `cargo sbom`
- [ ] Attach SBOM artifacts to the GitHub release (upload alongside NSIS/MSI installers)
- [ ] Document SBOM artifact names and location in `docs/development/ci-cd.md`

### Dependency Update Policy Documentation

- [ ] Create or update `docs/development/dependency-policy.md` with:
  - Update cadence (patch: monthly; minor: quarterly review; major: planned release slot)
  - Ownership (who triages Dependabot PRs)
  - Triage SLAs (critical CVE: 48 hours; high: 1 week; moderate: next planned slot)
  - Exception handling (document defer decisions with rationale)
  - Tooling references (uv, npm, cargo, pip-audit, cargo-audit)
- [ ] Link the policy doc from `CONTRIBUTING.md` or `docs/development/contributing.md`

### End-to-End Verification

- [ ] Trigger a test Dependabot PR (or simulate by bumping a patch dep) and confirm the PR flow works
- [ ] Confirm security scan workflow fires and passes on main after v0.5.4 commit
- [ ] Confirm SBOM is attached to the v0.5.4 GitHub release

---

## Exit Criteria

v0.5.4 is complete when all of the following are true:

1. All Bucket B items are either merged (with tests passing) or re-deferred with written rationale.
2. Python test suite ≥ baseline (96 tests), GUI test suite ≥ baseline (113 tests), both green on CI.
3. Tauri packaging produces correct `0.5.4`-labeled installers.
4. `cargo audit` and `npm audit --audit-level=moderate` show no unaddressed critical/high findings.
5. Dependabot is live and configured for all four ecosystems.
6. CI dependency scanning workflow is active and gating PRs on critical/high.
7. SBOM attached to the v0.5.4 GitHub release.
8. Dependency update policy document is published in `docs/development/`.
9. All CI workflows green on the release commit.
10. Release workflow executed and artifacts confirmed.
