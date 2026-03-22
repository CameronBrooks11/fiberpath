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

- [ ] Python audit snapshot (`pyproject.toml`, `uv.lock`, transitive updates, security findings)
- [ ] Node/Tauri audit snapshot (`package.json`, `package-lock.json`, Tauri npm/rust parity checks)
- [ ] Rust crate audit snapshot (`Cargo.toml`, `Cargo.lock`, direct + transitive updates)
- [ ] Security sweep recorded for each ecosystem (critical/high findings identified separately)
- [ ] Initial matrix completed with risk labels and target release assignment

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

### Audit Matrix (Fill During Execution)

| Ecosystem | Package | Current | Candidate | Type (runtime/dev/tooling) | Risk | Breaking Signal | Target (0.5.3 or 0.5.4+) | Notes |
| --------- | ------- | ------- | --------- | -------------------------- | ---- | --------------- | ------------------------ | ----- |
| Python    | TBD     | TBD     | TBD       | TBD                        | TBD  | TBD             | TBD                      | TBD   |
| Node      | TBD     | TBD     | TBD       | TBD                        | TBD  | TBD             | TBD                      | TBD   |
| Rust      | TBD     | TBD     | TBD       | TBD                        | TBD  | TBD             | TBD                      | TBD   |

---

## Phase 2: Risk Triage and Staging Plan

Deliverable: classified upgrade buckets and execution order.

- [ ] Bucket A (v0.5.3): patch updates, safe minors, tooling-only updates with low behavior risk
- [ ] Bucket B (v0.5.4+): majors, migration-required minors, or upgrades with known runtime/build behavior changes
- [ ] Confirm explicit exclusions from v0.5.3 and document why

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

- [ ] Python: tests + packaging smoke pass
- [ ] Node: lint + tests + GUI build pass
- [ ] Rust/Tauri: `tauri build --ci` parity and packaging pass
- [ ] Cross-check Tauri npm/rust major-minor parity after lock updates
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
