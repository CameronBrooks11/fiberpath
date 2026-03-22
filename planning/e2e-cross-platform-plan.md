# FiberPath E2E Cross-Platform Automation Plan

Last Updated: 2026-03-22
Owner: v5.2 roadmap
Status: Draft (Ready to execute)

## Goal

Automate end-to-end confidence checks across Windows, Linux, and macOS for FiberPath GUI packaged artifacts and bundled CLI behavior.

## Scope

In scope:
- CI smoke validation of packaged artifacts on all 3 OSes.
- Verification that bundled CLI runs with no external Python requirement.
- Basic workflow validation: validate and plan commands on sample input.
- Optional browser/UI E2E (Playwright) as a separate lane.

Out of scope:
- Full hardware-in-the-loop streaming automation.
- Deep visual regression snapshots in v5.2.

## Current Baseline

Already available:
- Cross-OS packaging matrix workflow in `.github/workflows/gui-packaging.yml`.
- Existing backend/API pytest coverage.
- Tauri-adjacent subprocess tests under `tests/tauri/`.

Gap:
- No dedicated post-package E2E smoke checks on built artifacts per OS.

## Proposed Architecture

### Lane A - Artifact E2E Smoke (Primary for v5.2)

Add new workflow: `.github/workflows/gui-e2e-smoke.yml`

Trigger:
- `workflow_run` after successful GUI Packaging workflow, and `workflow_dispatch`.

Matrix:
- `windows-latest`
- `ubuntu-latest`
- `macos-latest`

Inputs/Artifacts:
- Download packaged artifacts from `gui-packaging`.

Checks per OS:
1. Artifact presence and shape:
- Windows: `.msi` or `.exe` exists.
- Linux: `.deb` and/or `.AppImage` exists.
- macOS: `.dmg` and/or `.app` bundle exists.

2. Bundled CLI smoke:
- Execute bundled CLI `--version`.
- Run `validate` against `examples/simple_cylinder/input.wind`.
- Run `plan` against same input and confirm `.gcode` output generated.

3. Exit criteria:
- All commands exit `0`.
- Output artifact/path checks pass.

### Lane B - GUI Interaction E2E (Secondary)

Add Playwright-based smoke checks in existing GUI CI or a separate workflow:
- Launch app shell/web build.
- Open sample file.
- Run validate action.
- Open Export dialog.
- Confirm expected status text and enabled export action.

Note: keep this secondary to artifact smoke for v5.2 to reduce rollout risk.

## Rollout Plan

### Phase 1 (v5.2)

- [ ] Create `.github/workflows/gui-e2e-smoke.yml` matrix workflow.
- [ ] Add reusable shell/PowerShell smoke scripts under `scripts/ci/`.
- [ ] Validate packaged CLI command path for each OS artifact type.
- [ ] Wire pass/fail reporting with clear logs.

### Phase 2 (v5.2 or v6)

- [ ] Add Playwright smoke test for core GUI flow.
- [ ] Add artifact checksum/report summary.

### Phase 3 (v6)

- [ ] Add optional hardware-adapter test harness for serial simulation.

## Risks and Mitigations

Risk: OS-specific artifact extraction/paths vary.
Mitigation: keep per-OS script adapters and assert exact expected paths.

Risk: macOS signing/Gatekeeper behavior is different in CI.
Mitigation: limit v5.2 automation to artifact and bundled CLI smoke checks, not signed install UX.

Risk: flaky UI timing in browser E2E.
Mitigation: keep UI E2E minimal and deterministic; run separately from packaging smoke.

## Definition of Done (v5.2)

- New E2E smoke workflow runs on Windows/Linux/macOS.
- Workflow validates packaged artifact presence and bundled CLI validate/plan commands.
- Failures are actionable from CI logs without reruns.
- v5.2 roadmap includes this work item and links this plan.

## Tracking Links

- Active roadmap: `planning/roadmap-v5.2.md`
- Validation gate: `planning/OUTSTANDING_VALIDATION.md`
- Packaging baseline: `.github/workflows/gui-packaging.yml`
