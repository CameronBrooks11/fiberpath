# FiberPath Roadmap v5.3 - Dependency Audit and Low-Risk Refresh

**Target Release:** v0.5.3  
**Status:** Active (planning baseline established; audit pending)  
**Prerequisites:** v0.5.2 released and stable  
**Timeline:** 3-5 days once audit starts

**Scope Boundary:** v5.3 is a dependency maintenance release for low-risk upgrades across Python, Node/Tauri, and Rust crates. High-risk or migration-heavy upgrades are deferred to v0.5.4.
**Related Roadmaps:** [roadmap-v6.md](roadmap-v6.md) begins only after v5.3 stabilization is complete; [roadmap-v7.md](roadmap-v7.md) remains post-v6 work.

---

## Objective

Establish a repeatable dependency audit workflow, classify upgrades by risk, and ship the low-risk set in a single coordinated release (v0.5.3) before v0.6.0 feature work.

---

## Strategy Decision

- Use one coordinated v0.5.3 dependency release for low-risk updates across all ecosystems.
- Do not do one patch release per package manager by default.
- Defer high-risk or migration-heavy changes to v0.5.4.

Rationale:

- Minimizes release overhead and fragmented testing.
- Preserves one clear stabilization point before v0.6.0.
- Keeps risk controlled with explicit staging and gates.

---

## Phase 1: Audit Inventory (Rolling)

Deliverable: a dependency matrix in this document populated with current and candidate versions.

- [x] Python audit snapshot (`pyproject.toml`, `uv.lock`, transitive updates, security findings)
- [x] Node/Tauri audit snapshot (`package.json`, `package-lock.json`, Tauri npm/rust parity checks)
- [x] Rust crate audit snapshot (`Cargo.toml`, `Cargo.lock`, direct + transitive updates)
- [x] Security sweep recorded for each ecosystem (critical/high findings identified separately)
- [x] Initial matrix completed with risk labels and target release assignment

### Command Checklist (Run and Record)

Run from repository root unless otherwise noted.

- Python
  - `uv lock --upgrade`
  - `uv run pip list --outdated`
  - `uv run pip-audit` (install first if unavailable)
- Node/Tauri (run from `fiberpath_gui`)
  - `npm outdated`
  - `npm audit --audit-level=moderate`
  - `npm ls @tauri-apps/api @tauri-apps/plugin-dialog --depth=0`
- Rust/Tauri crates (run from `fiberpath_gui/src-tauri`)
  - `cargo outdated -R`
  - `cargo audit` (requires cargo-audit)

Record outputs as summarized entries in the matrix (do not commit raw tool dumps unless needed for debugging).

### Audit Matrix (Initial Pass - 2026-03-22)

| Ecosystem | Package | Current | Candidate | Type (runtime/dev/tooling) | Risk | Breaking Signal | Target (0.5.3 or 0.5.4+) | Notes |
| --------- | ------- | ------- | --------- | -------------------------- | ---- | --------------- | ------------------------ | ----- |
| Python | anyio | 4.12.0 | 4.12.1 | runtime | Low | None observed | 0.5.3 | Patch update |
| Python | pydantic | 2.12.4 | 2.12.5 | runtime | Low | None observed | 0.5.3 | Patch update |
| Python | pydantic_core | 2.41.5 | 2.42.0 | runtime | Low | None observed | 0.5.3 | Patch update |
| Python | python-dotenv | 1.2.1 | 1.2.2 | runtime | Low | None observed | 0.5.3 | Patch update |
| Python | filelock | 3.20.2 | 3.20.3 | runtime | Low | None observed | 0.5.3 | Security fix (CVE-2026-22701) |
| Python | pillow | 12.0.0 | 12.1.1 | runtime | Low | None observed | 0.5.3 | Security fix (CVE-2026-25990) |
| Python | virtualenv | 20.35.4 | 20.36.1 | tooling | Low | None observed | 0.5.3 | Security fix (CVE-2026-22702) |
| Python | fastapi | 0.128.0 | 0.135.1 | runtime | Medium | Minor jump likely includes behavior deltas | 0.5.4+ | Evaluate with Starlette compatibility constraints |
| Python | starlette | 0.50.0 | 1.0.0 | runtime | High | Major release | 0.5.4+ | Migration risk |
| Python | typer | 0.20.0 | 0.24.1 | runtime | Medium | Minor jump with CLI behavior risk | 0.5.4+ | Needs CLI regression pass |
| Node | @tauri-apps/cli | 2.9.4 | 2.10.1 | tooling | Low | None (minor parity alignment) | 0.5.3 | Align with tauri crates 2.10.x |
| Node | @tauri-apps/plugin-shell | 2.3.4 | 2.3.5 | runtime | Low | None observed | 0.5.3 | Patch update |
| Node | @testing-library/react | 16.3.1 | 16.3.2 | dev | Low | None observed | 0.5.3 | Patch update |
| Node | ajv | 8.17.1 | 8.18.0 | runtime | Low | None observed | 0.5.3 | Addresses audit advisory path |
| Node | zustand | 5.0.9 | 5.0.12 | runtime | Low | None observed | 0.5.3 | Patch update |
| Node | vite | 5.4.21 | 8.0.1 | tooling | High | Major release | 0.5.4+ | Breaking; tied to esbuild advisory fix path |
| Node | vitest | 2.1.9 | 4.1.0 | tooling | High | Major release | 0.5.4+ | Breaking test-runner jump |
| Node | react/react-dom | 18.3.1 | 19.2.4 | runtime | High | Major release | 0.5.4+ | Framework migration risk |
| Node | zod | 3.25.76 | 4.3.6 | runtime | High | Major release | 0.5.4+ | Schema/runtime API changes |
| Rust | thiserror | 1.0.69 | 2.0.18 | runtime | High | Major release | 0.5.4+ | Code changes likely required |
| Rust | which | 7.0.3 | 8.0.2 | runtime | High | Major release | 0.5.4+ | API/behavior risk |

### Security Snapshot (Initial Pass)

- Python (`uvx pip-audit`): 5 vulnerabilities in 4 packages
  - filelock 3.20.2 (fix 3.20.3)
  - pillow 12.0.0 (fix 12.1.1)
  - pip 25.0.1 (fix 25.3 / 26.0)
  - virtualenv 20.35.4 (fix 20.36.1)
- Node (`npm audit --audit-level=moderate`): 12 vulnerabilities (9 moderate, 3 high)
  - High-impact paths include rollup, minimatch, and flatted
  - Some fixes imply major jumps (vite/vitest track) and are deferred to 0.5.4+
- Rust (`cargo audit`): no immediate CVE exploit findings surfaced; multiple advisory warnings are inherited via GTK3/WebKit/Tauri dependency chains (including unmaintained and unsound advisories), with 18 allowed warnings reported and deferred to v0.5.4+ review track

### Initial Bucket Split (Draft)

Bucket A candidate set for 0.5.3 (low-risk):
- Python: anyio, pydantic, pydantic_core, python-dotenv, filelock, pillow, virtualenv, plus low-risk patch updates from the outdated list
- Node: @tauri-apps/cli, @tauri-apps/plugin-shell, @testing-library/react, ajv, zustand, and similar patch-level updates
- Rust: none yet (current outdated results are major-only)

Bucket B candidate set for 0.5.4+ (higher risk):
- Python: fastapi, starlette, typer (and any majors)
- Node: vite, vitest, react/react-dom, zod, stylelint 17 path
- Rust: thiserror 2.x, which 8.x

---

## Phase 2: Risk Triage and Staging Plan

Deliverable: classified upgrade buckets and execution order.

- [x] Bucket A (v0.5.3): patch updates, safe minors, tooling-only updates with low behavior risk
- [x] Bucket B (v0.5.4+): majors, migration-required minors, or upgrades with known runtime/build behavior changes
- [x] Confirm explicit exclusions from v0.5.3 and document why

### Risk Rules

- Low:
  - patch updates
  - minor updates with no migration notes and no API-surface changes used in this repo
- Medium:
  - minor updates with behavior changes, lockfile churn touching packaging, or expanded permissions/sandboxing
- High:
  - major updates, deprecations/removals, migration guides required, or test/build breakage observed

---

## Phase 3: Execute Bucket A for v0.5.3

Deliverable: merged upgrade set and release-ready branch.

Execution order:

1. Python low-risk updates and validation
2. Node low-risk updates and validation
3. Rust/Tauri low-risk updates and validation
4. Full integration sweep and release prep

- [x] Python: tests + packaging smoke pass
- [x] Node: lint + tests + GUI build pass
- [x] Rust/Tauri: `tauri build --ci` parity and packaging pass
- [x] Cross-check Tauri npm/rust major-minor parity after lock updates
- [ ] Changelog and planning docs updated for final 0.5.3 contents

---

## Phase 4: Release Gate and Stabilization

Deliverable: v0.5.3 released with known risk profile.

- [ ] All CI workflows green on release commit
- [ ] No unresolved critical/high security issues in included upgrade set
- [ ] CLI/API/GUI smoke checks pass on release commit
- [ ] Release workflow executed and artifacts verified
- [ ] Post-release notes capture deferred items for v0.5.4

---

## Working Agreements

- Favor minimal version jumps needed to resolve security and maintenance debt.
- Avoid mixing high-risk migrations into v0.5.3.
- If a low-risk upgrade causes runtime or packaging instability, reclassify to v0.5.4 and proceed.
- Keep this roadmap as a rolling source of truth as audit data arrives.
- Keep each audit run small and attributable (ecosystem by ecosystem) even if release remains coordinated.

---

## Exit Criteria

v0.5.3 planning-to-execution handoff is complete when:

- Audit matrix is populated for direct dependencies across Python/Node/Rust.
- Every candidate is assigned to v0.5.3 or v0.5.4+ with a documented reason.
- Bucket A has a concrete execution checklist ready for implementation.
