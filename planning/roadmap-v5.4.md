# FiberPath Roadmap v5.4 - Dependency Hardening and Scanning Automation (Stub)

**Target Release:** v0.5.4  
**Status:** Planned (stub; to be expanded after v0.5.3 audit execution)  
**Prerequisites:** v0.5.3 released with low-risk dependency upgrades complete  
**Timeline:** TBD after v0.5.3 outcomes

**Scope Boundary:** v5.4 is reserved for higher-risk dependency upgrades and migration-required changes deferred from v0.5.3.
**Related Roadmaps:** [roadmap-v5.3.md](roadmap-v5.3.md) for low-risk refresh; [roadmap-v6.md](roadmap-v6.md) starts after v5.4 stabilization handoff.

---

## Objective

Finish dependency modernization by handling deferred high-risk upgrades safely, then close out with durable dependency scanning automation and policy guardrails.

---

## Planned Phases (Stub)

## Phase 1: Intake From v0.5.3 Deferred Bucket

- [ ] Import deferred dependency list from v5.3 matrix
- [ ] Confirm upgrade candidates and migration needs
- [ ] Define acceptance criteria per ecosystem (Python, Node/Tauri, Rust)

## Phase 2: High-Risk Upgrade Execution

- [ ] Execute major/migration-heavy updates in isolated steps
- [ ] Add or adjust tests where behavior changes are expected
- [ ] Validate packaging and runtime behavior after each change set

## Phase 3: Stabilization and Release Prep

- [ ] Complete full CI and smoke checks
- [ ] Resolve regressions or defer to v0.6.0+ with documented rationale
- [ ] Prepare changelog and release notes for dependency hardening results

## Phase 4: Close-Out - Dependency Scanning and Update Automation

This is the required final step for v5.4 closure.

- [ ] Enable and tune Dependabot for GitHub Actions, Python, npm, and Cargo ecosystems
- [ ] Add scheduled dependency/security scan workflow(s) to CI
- [ ] Add policy checks for high/critical vulnerability gating on PRs
- [ ] Add SBOM generation step and artifact retention in CI
- [ ] Document dependency update policy (cadence, ownership, triage SLAs, and exception handling)
- [ ] Verify alerts-to-PR flow works end-to-end before closing v5.4

---

## Exit Criteria (Stub)

v0.5.4 is complete when:

- Deferred high-risk upgrades are either shipped or explicitly re-scoped.
- CI and packaging are stable after migration-level changes.
- Dependabot plus dependency scanning best practices are in place and verified as operational.
