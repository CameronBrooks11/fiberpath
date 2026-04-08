# GUI Framework Migration Evaluation and Execution Plan

**Document Type:** Planning + Decision/Execution Sequence (non-roadmap)
**Created:** 2026-04-06
**Last Updated:** 2026-04-07
**Owner:** GUI maintainers
**Status:** Decision complete - no framework migration at this time

## Objective

Evaluate whether moving away from React is justified, then execute only if there is clear net benefit versus improving the current React/Tauri stack.

## Context

Current stack: React + TypeScript + Zustand + Tauri + modular CSS.
Known pain areas were primarily styling complexity and component size, not a proven hard platform blocker.

## Candidate Paths

- Option 0: Stay on React, simplify architecture and styling (baseline/default)
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

---

## Evaluation Sequence (Executed)

### Phase 0 - Baseline Capture (completed 2026-04-07)

**Measured baseline (current mainline):**

| Metric | Result | Evidence |
| --- | --- | --- |
| Frontend TS/TSX LOC | 9727 LOC | `rg --files ... | xargs wc -l` |
| CSS LOC | 3569 LOC | `planning/baseline-css-loc.txt` final snapshot |
| Dev startup responsiveness | Vite ready in 292 ms | `npm run dev` output |
| Production build time | 586 ms | `npm run build` output |
| Production bundle (JS) | 598.96 kB (175.03 kB gzip) | `npm run build` output |
| Production bundle (CSS) | 59.42 kB (9.36 kB gzip) | `npm run build` output |
| GUI test runtime | 117 tests pass, ~2.75s reported by Vitest | `npm run test` output |
| Quality gate state | `check:all` pass, `test` pass | release-prep verification |

**Framework-coupled inventory (current source):**

- Zustand store usage call sites (`useProjectStore/useStreamStore/useToastStore`): 30
- Tauri IPC `invoke(...)` call sites: 15
- Tauri event `listen(...)` call sites: 1
- Drag-and-drop integration surface: 1 primary component (`LayerStack.tsx`)
- Zoom/pan integration surface: 1 primary component (`VisualizationCanvas.tsx`)
- React hook density markers:
  - `useEffect(...)`: 18
  - `useCallback(...)`: 10
  - `useMemo(...)`: 2

**Developer onboarding friction (qualitative baseline):**

- Contributors need multi-runtime setup (Python + Node/npm + Rust/Tauri toolchain).
- Most onboarding complexity is toolchain breadth and packaging requirements, not React-specific ergonomics.

**Tasks:**

- [x] Measure current baseline:
  - [x] Startup responsiveness
  - [x] Common interaction latency proxy (stream progress architecture + no measured runtime gate regressions)
  - [x] Build time and bundle size
  - [x] Test execution time
  - [x] Developer onboarding friction
- [x] Enumerate framework-coupled areas:
  - [x] State hooks/selectors
  - [x] Drag-and-drop integration
  - [x] Zoom/pan integration
  - [x] Event/listener hooks

**Exit Criteria:**

- [x] Baseline report completed and reproducible.

### Phase 1 - Decision Criteria Lock (completed 2026-04-07)

Go/no-go thresholds were defined before any rewrite commitment:

- **DX improvement threshold:** at least 25% LOC reduction in representative UI slices with no testability regression.
- **Runtime performance threshold:** at least 20% JS bundle reduction or at least 15% measured interaction latency improvement on representative workflows.
- **Maintainability threshold:** at least 30% reduction in framework-coupled call sites inside migrated slices.
- **Acceptable migration duration:** feature parity in <= 4 weeks of focused effort.
- **Acceptable regression risk window:** <= 1 release cycle of elevated risk with full Gate A/B/C parity.

**Tasks:**

- [x] Define go/no-go thresholds before prototyping:
  - [x] DX improvement threshold
  - [x] Runtime performance threshold
  - [x] Maintainability threshold
  - [x] Acceptable migration duration
  - [x] Acceptable regression risk window

**Exit Criteria:**

- [x] Written criteria signed off.

### Phase 2 - Timeboxed Spikes (deferred by no-go precheck)

A pre-spike gate was applied after Phase 0/1 evidence.

**Outcome:** no hard React-driven blocker was found; baseline performance and quality gates are already healthy, and primary pain areas were styling/organization (already addressed in the simplification rollout). Rewrite spikes were deferred as unnecessary opportunity cost in the current release window.

**Tasks:**

- [ ] Build tiny equivalent vertical slice in each candidate framework:
  - [ ] Main shell + one representative form
  - [ ] One stateful editor panel
  - [ ] One Tauri command invocation path
  - [ ] One stream-like event display component
- [ ] Capture effort and complexity for each spike
- [x] Apply no-go pre-spike gate using measured baseline and thresholds

**Exit Criteria:**

- [x] Comparable decision evidence exists without committing spike implementation.

### Phase 3 - Scoring and Recommendation (completed 2026-04-07)

Weighted score model (higher is better; effort score is "lower effort = higher score"):

- Migration effort: 30%
- Team familiarity: 20%
- Maintenance overhead: 15%
- Ecosystem/tooling maturity: 15%
- Test strategy impact: 10%
- Packaging/CI impact: 10%

| Option | Effort (30) | Familiarity (20) | Maintenance (15) | Ecosystem (15) | Test Impact (10) | CI/Packaging (10) | Total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Option 0: Stay React | 30 | 20 | 12 | 15 | 10 | 10 | **97** |
| Option 2: Vue 3 + Tauri | 18 | 12 | 12 | 15 | 8 | 8 | **73** |
| Option 1: Svelte + Tauri | 12 | 8 | 9 | 12 | 6 | 8 | **55** |
| Option 3: Solid + Tauri | 12 | 4 | 6 | 9 | 6 | 8 | **45** |

**Recommendation:**

- [x] Stay React
- [ ] Migrate (single selected target)

**Exit Criteria:**

- [x] Final decision memo with rationale and risk profile.

---

## Decision Outcome

**Selected path:** Option 0 (Stay on React/Tauri)

**Why selected:**

- Migration thresholds are not met by current evidence.
- Current stack shows strong baseline health (`npm run build`, `npm run check:all`, `npm run test` all passing with fast feedback loops).
- Remaining risks are delivery-risk and parity-risk, not platform limitation risk.
- Highest ROI is continued incremental improvement, not framework replacement.

## If Decision Is Stay on React

Execute this sequence instead of migration:

- [x] Run styling simplification plan to completion
- [ ] Decompose large components (`MenuBar`, stream sections, helical editor)
- [ ] Tighten state boundaries/selectors where needed
- [ ] Reassess after one release cycle

**Exit Criteria:**

- [ ] Documented improvement and no migration required.

## If Decision Is Migrate (deferred)

No migration execution phases are authorized until the revisit gate is triggered and thresholds are re-tested.

---

## Acceptance Criteria (Migration Justification)

Migration is only justified if all are true:

- [ ] Measured improvement exceeds pre-defined thresholds
- [ ] Delivery timeline is acceptable versus competing priorities
- [ ] No unacceptable risk to release cadence
- [ ] Team can sustainably maintain target stack

**Current state:** No-go for migration (criteria not met).

---

## Risks and Mitigations

- Risk: Large rewrite stalls feature delivery
  - Mitigation: Keep no-go default; require threshold breach before spikes
- Risk: Hidden parity gaps (especially streaming flows)
  - Mitigation: If revisit is triggered, require stream vertical slice first
- Risk: Test and CI churn
  - Mitigation: Preserve Tauri command contracts and Gate A/B/C parity as hard constraints

## Recommended Default

Default recommendation remains **do not migrate yet**.

Complete post-styling component decomposition and state-boundary cleanup first, then revisit migration with fresh baseline data.

## Revisit Triggers and Date

Re-open framework migration evaluation only if one or more triggers occur:

- UI interaction latency regresses > 15% in target workflows and cannot be solved within React architecture boundaries.
- JS bundle grows > 25% without feature value justification.
- Component decomposition and store-boundary cleanup fail to reduce maintenance friction over one release cycle.

**Revisit date:** 2026-07-15 (or earlier if any trigger fires).

## External Ecosystem Snapshot (for Phase 3 context)

- Tauri v2 officially supports React, Vue, Svelte, and Solid templates in create-project flow.
  - https://v2.tauri.app/start/create-project/
- Vue core release line is stable with active 3.x maintenance (latest stable + active beta channel visible in official releases).
  - https://github.com/vuejs/core/releases
- Svelte 5 introduces runes-based reactivity changes; official migration guide indicates non-trivial syntax/mental-model shift.
  - https://svelte.dev/docs/svelte/v5-migration-guide
- Solid release channel currently includes 2.0 beta pre-releases, increasing near-term migration churn risk.
  - https://github.com/solidjs/solid/releases

## Decision Log

- Decision date: 2026-04-07
- Selected path: Stay on React/Tauri
- Why selected: Best weighted score and thresholds not met for migration ROI
- Evidence used: baseline metrics, coupling inventory, quality gates, ecosystem snapshot
- Risks accepted: continued incremental cleanup effort instead of rewrite reset
- Revisit date: 2026-07-15
