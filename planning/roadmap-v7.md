# FiberPath Roadmap v7 - Production Polish and Developer Infrastructure

**Target Release:** v0.7.0
**Status:** Decision-locked post-v0.6.2 (execution in progress)
**Last Cross-Check:** 2026-04-08
**Focus:** Production-readiness follow-through after v0.6.2 React hotspot cleanup
**Timeline:** 2-3 weeks
**Priority:** High - maintainability, validation UX, and measured performance

**Scope Boundary:** v7 owns developer tooling decisions, residual architecture cleanup, performance implementation, and validation UX completion.
**Related Planning:** [roadmap-backlog.md](roadmap-backlog.md) for intentionally deferred work.
**Validation Reference:** [CHANGELOG.md](../CHANGELOG.md) and [`gui-e2e-smoke.yml`](../.github/workflows/gui-e2e-smoke.yml)

**Philosophy:** Keep only high ROI work in v7. Prefer measured changes over speculative rewrites.

---

## Decision Lock (2026-04-08)

Locked by maintainer input (`1A 2B 3A 4A 5A 6AB*`):

1. `1A` - Frontend lint strategy is `tsc + stylelint` (no ESLint/Prettier adoption in v7).
2. `2B` - Use repo-root `pre-commit` for commit-time automation.
3. `3A` - `docs/gui` is canonical; `fiberpath_gui/docs` is sync output.
4. `4A` - Performance work is baseline-first, then CI regression threshold.
5. `5A` - Validation UX uses non-blocking debounced hints; backend submit-time validation remains authoritative.
6. `6AB*` - Execute docs pass A during v7; full docs pass B is the very last item after the v7 PR is green.

---

## Cross-Check Snapshot (Evidence)

Evidence captured from the current repo state on 2026-04-08:

| Signal | Value |
| --- | ---: |
| TSX LOC total | 4004 |
| Largest TSX file | `components/MenuBar.tsx` (249 LOC) |
| `state/projectStore` imports in `fiberpath_gui/src` | 0 |
| Canonical StreamTab path | `components/StreamTab/StreamTab.tsx` |
| `React.memo` usage | 1 (`LayerRow`) |
| `React.lazy` usage | 5 (`AboutDialog`, `DiagnosticsDialog`, `ExportConfirmationDialog` in App + Menu) |
| Preview stale-response guard | Present (`usePreviewGeneration` request id check) |
| Tools > Validate wiring | Present (`tools.validateDefinition -> handleValidate`) |
| Inline form/editor error styling | Present (`param-form__input--error`, `layer-editor__input--error`) |
| ESLint/Prettier config files | Not present |
| pre-commit/husky/lint-staged config | Present (`.pre-commit-config.yaml`) |
| `.vscode/launch.json` | Present |
| Stale docs refs to `src/state/projectStore.ts` | 0 (Pass A complete) |

Primary finding: v0.6.2 delivered most architecture cleanup goals; v7 now needs to focus on tooling decision clarity, performance implementation, and doc/validation follow-through.

---

## Phase 1: Release Management and Changelog Discipline

**Goal:** Keep release history process explicit and durable.

- [x] `CHANGELOG.md` is the release source of truth and includes v0.6.2.
- [x] Semantic version heading convention is in use (`## [X.Y.Z] - YYYY-MM-DD`).
- [x] `Unreleased` section exists at the top.
- [x] Add explicit maintenance guidance in release docs (who updates changelog, when, and required section structure).

**Progress:** 4/4 tasks complete

---

## Phase 2: Developer Tooling Alignment

**Goal:** Remove ambiguity in frontend lint/format workflow and tighten local ergonomics.

- [x] Tooling strategy locked for v7: `tsc + stylelint` is the enforced frontend path.
- [x] VSCode extension recommendations already include ESLint/Prettier/Rust tooling (`.vscode/extensions.json`).
- [x] Rename misleading GUI CI labels/step names to match executed commands.
- [x] Add repo-root `.pre-commit-config.yaml` and document usage for cross-stack checks.
- [x] Add `.vscode/launch.json` debug profiles (GUI dev, Rust backend, Vitest target).

**Progress:** 5/5 tasks complete

**Note:** GUI CI label drift is resolved (type-check step now matches `npm run lint` behavior).

---

## Phase 3: Architecture and Navigation Cleanup

**Goal:** Keep import boundaries and component ownership unambiguous.

- [x] Menu definitions extracted to `src/lib/menuConfig.ts`.
- [x] Project store consolidated under `src/stores/projectStore.ts`.
- [x] StreamTab wrapper indirection removed; app imports canonical module path.
- [x] Evaluate barrel exports only where they improve readability and do not hide ownership.
- [x] Remove stale docs/examples referencing `src/state/projectStore.ts`.

**Progress:** 5/5 tasks complete

---

## Phase 4: Performance Implementation (Measured, Not Assumed)

**Goal:** Convert performance guidance into validated implementation and guardrails.

- [x] Added latest-request-wins race protection in preview generation (`usePreviewGeneration`).
- [x] Establish baseline metrics (bundle size, startup time, common interaction render cost) and record them in docs.
- [x] Lazy-load low-frequency dialogs (`AboutDialog`, `DiagnosticsDialog`, `ExportConfirmationDialog`) and verify UX impact.
- [x] Apply targeted `React.memo` only for measured hotspots (for example `LayerRow`) after profiling.
- [x] Decide on preview caching policy; v7 keeps no preview cache (request-id stale-response guard remains) to avoid stale image invalidation complexity.
- [x] Add CI performance guardrail (bundle budget + reporting artifact).

**Progress:** 6/6 tasks complete

---

## Phase 5: Documentation Completeness and Drift Control

**Goal:** Eliminate drift between code reality and developer docs.

- [x] Keyboard shortcuts are documented in `docs/guides/marlin-streaming.md`.
- [x] GUI development common tasks already exist in `docs/gui/development.md`.
- [x] Docs source-of-truth policy locked: `docs/gui` canonical, `fiberpath_gui/docs` sync output.
- [x] Pass A (in-scope now): fix targeted stale refs (for example `src/state/projectStore.ts`) and directly related drift.
- [ ] Pass B (final close-out): full docs-wide sweep after v7 PR is green.
- [x] Raise JSDoc coverage for exported utility APIs in `commands.ts` and `validation.ts` (converters and marlin-api already have baseline docs).

**Progress:** 5/6 tasks complete

---

## Phase 6: Validation UX Completion

**Goal:** Move from basic validation signaling to high-clarity in-form guidance.

- [x] "Tools > Validate Definition" is wired through file operations and user notifications.
- [x] Inline field error presentation exists in forms/editors (error text + error classes).
- [x] Validation UX policy locked: non-blocking debounced hints + backend submit-time hard validation.
- [x] Add debounced on-change validation for high-frequency numeric inputs while keeping blur validation.
- [x] Map schema/backend validation errors to specific form fields where possible (not only aggregate messages).
- [x] Add frontend cross-field hints for geometry-dependent checks without replacing backend hard validation.

**Progress:** 6/6 tasks complete

---

## Execution Order (Recommended)

1. Execute Phase 2 with locked strategy (`1A` + `2B`): CI label cleanup and repo-root pre-commit.
2. Execute docs Pass A and targeted architecture-doc cleanup (`3A` + Phase 3/5 leftovers).
3. Implement validation UX work under locked non-blocking model (`5A`).
4. Run performance baseline-first implementation and CI regression guardrail (`4A`).
5. Execute docs Pass B as final close-out task only after v7 PR is green (`6AB*`).

---

## Deferred to Backlog

Items with poor complexity/value ratio remain in [roadmap-backlog.md](roadmap-backlog.md), including Storybook, panel resize handles, shortcut customization, workspace presets, undo/redo, advanced visualization rewrites, and cloud sync.

---

## Updated Effort Estimate

- Phase 1: 1-2 hours
- Phase 2: 4-7 hours
- Phase 3: 2-4 hours
- Phase 4: 8-12 hours
- Phase 5: 4-8 hours
- Phase 6: 6-10 hours

**Total:** 25-43 hours

---

## Success Criteria

- [x] Tooling strategy is explicit and reflected in scripts, CI labels, and contributor docs.
- [x] No stale `state/projectStore` docs references remain.
- [x] Validation errors are visible and actionable near the relevant inputs.
- [x] Performance changes are measured and gated (not just documented intentions).
- [ ] Docs Pass B completes after v7 PR is green, with no unresolved broken/stale references.
- [ ] v7 closes remaining production-polish gaps without reopening architecture churn.

---

**Next:** Execute v7 in thin, verifiable slices; avoid broad refactors without profiling or concrete drift evidence.
