# GUI Framework Migration Evaluation and Execution Plan

**Document Type:** Planning + Decision/Execution Sequence (non-roadmap)  
**Created:** 2026-04-06  
**Owner:** GUI maintainers

## Objective

Evaluate whether moving away from React is justified, then execute only if there is clear net benefit versus improving the current React/Tauri stack.

## Context

Current stack: React + TypeScript + Zustand + Tauri + modular CSS.  
Known pain areas are primarily styling complexity and component size, not a proven hard platform blocker.

## Candidate Paths

- Option 0: Stay on React, simplify architecture and styling (default baseline)
- Option 1: Migrate to Svelte + Tauri
- Option 2: Migrate to Vue 3 + Tauri
- Option 3: Migrate to Solid + Tauri

## Non-Negotiable Constraints

- Preserve current functional scope:
  - Planner workflows
  - Visualization/plot preview
  - Stream tab functionality
  - Diagnostics and file operations
- Preserve packaging and CI reliability across Windows/macOS/Linux
- No regression in CLI/Tauri command bridge behavior

## Evaluation Sequence

## Phase 0 - Baseline Capture (1-2 days)

- [ ] Measure current baseline:
  - [ ] Startup responsiveness
  - [ ] Common interaction latency
  - [ ] Build time and bundle size
  - [ ] Test execution time
  - [ ] Developer onboarding friction
- [ ] Enumerate framework-coupled areas:
  - [ ] State hooks/selectors
  - [ ] Drag-and-drop integration
  - [ ] Zoom/pan integration
  - [ ] Event/listener hooks

**Exit Criteria:** Baseline report completed and reproducible.

## Phase 1 - Decision Criteria Lock (0.5 day)

- [ ] Define go/no-go thresholds before prototyping:
  - [ ] DX improvement threshold
  - [ ] Runtime performance threshold
  - [ ] Maintainability threshold
  - [ ] Acceptable migration duration
  - [ ] Acceptable regression risk window

**Exit Criteria:** Written criteria signed off.

## Phase 2 - Timeboxed Spikes (4-6 days)

- [ ] Build tiny equivalent vertical slice in each candidate framework:
  - [ ] Main shell + one representative form
  - [ ] One stateful editor panel
  - [ ] One Tauri command invocation path
  - [ ] One stream-like event display component
- [ ] Capture effort and complexity for each spike

**Exit Criteria:** Comparable spike artifacts + notes for all candidates.

## Phase 3 - Scoring and Recommendation (1 day)

- [ ] Score options against weighted matrix:
  - [ ] Migration effort
  - [ ] Team familiarity
  - [ ] Maintenance overhead
  - [ ] Ecosystem/tooling maturity
  - [ ] Test strategy impact
  - [ ] Packaging/CI impact
- [ ] Produce recommendation:
  - [ ] Stay React
  - [ ] Migrate (single selected target)

**Exit Criteria:** Final decision memo with rationale and risk profile.

## If Decision Is Stay on React

Execute this sequence instead of migration:

- [ ] Run styling simplification plan to completion
- [ ] Decompose large components (`MenuBar`, stream sections, helical editor)
- [ ] Tighten state boundaries/selectors where needed
- [ ] Reassess after one release cycle

**Exit Criteria:** Documented improvement and no migration required.

## If Decision Is Migrate

## Phase 4 - Migration Architecture Plan (2-3 days)

- [ ] Define target architecture and directory structure
- [ ] Define state pattern equivalent to current store behavior
- [ ] Define component mapping table (old -> new)
- [ ] Define interoperability and cutover strategy

**Exit Criteria:** Implementation blueprint with ordered work packages.

## Phase 5 - Incremental Port (3-6 weeks, depends on target)

- [ ] Port foundation shell and routing/shell state
- [ ] Port shared primitives (buttons/forms/panels/dialogs)
- [ ] Port planning flows
- [ ] Port stream flows
- [ ] Port diagnostics and settings
- [ ] Keep Tauri command contracts unchanged during port

**Exit Criteria:** Feature parity in staging build.

## Phase 6 - Validation and Cutover (1-2 weeks)

- [ ] Regression test parity against current app behavior
- [ ] Cross-platform packaging validation
- [ ] Performance and DX re-measurement versus baseline
- [ ] Controlled rollout and fallback plan

**Exit Criteria:** Cutover decision with rollback path documented.

## Acceptance Criteria (Migration Justification)

Migration is only justified if all are true:
- [ ] Measured improvement exceeds pre-defined thresholds
- [ ] Delivery timeline is acceptable versus competing priorities
- [ ] No unacceptable risk to release cadence
- [ ] Team can sustainably maintain target stack

## Risks and Mitigations

- Risk: Large rewrite stalls feature delivery
  - Mitigation: Timebox spikes; no-go if ROI unclear
- Risk: Hidden parity gaps (especially streaming flows)
  - Mitigation: Use representative vertical slices early
- Risk: Test and CI churn
  - Mitigation: Preserve Tauri command contracts; keep old/new comparison harness during cutover

## Recommended Default

Default recommendation is **do not migrate yet**.  
Complete styling and component-complexity cleanup first, then revisit migration with fresh baseline data.

## Decision Log Template

- Decision date:
- Selected path:
- Why selected:
- Evidence used:
- Risks accepted:
- Revisit date:
