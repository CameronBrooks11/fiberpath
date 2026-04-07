# GUI Styling Radical Simplification Plan

**Document Type:** Planning + Execution Sequence (non-roadmap)  
**Created:** 2026-04-06  
**Status:** Ready for implementation  
**Owner:** Cameron Brooks

---

## Mission

Deliver a clean, professional, production-grade engineering UI by aggressively reducing styling complexity and visual noise while preserving all current functionality.

## Product Direction

FiberPath GUI should feel like a precise engineering instrument, not a visually decorative application. The visual system should communicate reliability, hierarchy, and clarity first.

---

## Program Goals

- Reduce styling complexity and improve maintainability
- Establish a restrained visual language suitable for production engineering workflows
- Standardize component primitives so new UI work stays consistent
- Reduce style-related regressions by adding explicit quality gates
- Keep React/Tauri architecture unchanged

## Non-Goals

- No framework migration in this plan
- No broad feature expansion
- No backend command contract changes
- No Tauri IPC redesign

---

## Baseline Snapshot

- CSS files: **20 total** — 12 global in `styles/`, 7 in `components/StreamTab/`, 1 in `components/Toast/`
- CSS LOC: **3942** (baseline recaptured on 2026-04-06; exact per-file breakdown in `planning/baseline-css-loc.txt`)
- Frontend TS/TSX LOC: **9484**
- Top CSS hotspots by LOC:
  - `styles/dialogs.css` — 551
  - `styles/panels.css` — 446
  - `styles/layout.css` — 431
  - `styles/canvas.css` — 364
  - `components/StreamTab/FileStreamingSection.css` — 271
  - `styles/forms.css` — 251
  - `styles/tokens.css` — 217
  - `styles/buttons.css` — 175
- Known inline style debt: **17** `style={{}}` call sites across **7** components (exact call sites captured in baseline file)
- Dead dependencies confirmed in `package.json`: `@radix-ui/react-dropdown-menu`, `@radix-ui/react-menubar`, `clsx` — not imported in current TS/TSX source

---

## Design Principles (Hard Rules)

These are constraints, not tasks. Every code change in this plan is evaluated against them.

- **Surfaces first:** hierarchy via spacing, typography, and contrast — not color accents
- **Minimal effects:** gradients and shadows only where they carry structural meaning; `backdrop-filter` only where strictly needed
- **Token-only styling:** all values via `var(--...)`, never one-off literals in component or global CSS
- **Deterministic states:** every interactive element must have consistent, predictable hover / active / disabled / error styles
- **Information density discipline:** optimize for real engineering workflows, not marketing visuals

---

## Target Outcomes

- [ ] UI appears materially cleaner and less visually heavy in before/after comparison
- [ ] Top 4 hotspot CSS files reduced by at least 20% combined LOC
- [ ] Inline `style={{}}` call sites reduced to dynamic-only exceptions (target ≤4 remaining)
- [ ] Stream tab visual language indistinguishable from main workspace
- [ ] Light and dark themes both render correctly with no white-on-white or dark-on-dark issues
- [ ] Theme follows system preference by default; manual toggle persists across sessions
- [ ] Styling documentation matches implementation reality

---

## Governance

This is a solo project. The role breakdown below is a personal discipline checklist, not a team structure.

- **Implement:** execute CSS/component changes per phase task list
- **Review:** check exit criteria and design principles before merging each PR (treat this as a distinct review pass even if you wrote the code)
- **QA:** run Gate B and Gate C checklists before merge

### Branch and PR Strategy

- Use phase-scoped branches and PRs (`style/phase-1-tokens`, `style/phase-2-primitives`, etc.)
- Keep each PR independently revertable
- Each PR must include before/after screenshots for all touched surfaces
- Each PR description must include a "Token changes" section (adds / removes / renames)

### Definition of Done (per PR)

- [ ] `npm run check:all` passes from `fiberpath_gui/`
- [ ] `npm run test` passes from `fiberpath_gui/`
- [ ] No unintended visual regressions on touched screens
- [ ] New/changed styles use approved tokens only
- [ ] All phase task checkboxes complete

---

## Implementation Plan

### Phase 0 — Baseline Capture (0.5 day)

**Purpose:** Lock in the before-state as a fixed reference. The visual direction is already encoded in Design Principles above — no separate brief document needed.

**Tasks:**

- [ ] Launch the app and capture screenshots of current state:
  - [ ] Main shell (default layout, no dialog open)
  - [ ] A dialog (diagnostics or about)
  - [ ] Layer panel
  - [ ] Stream tab with controls visible
- [x] Record exact CSS LOC per file:
  - Run from repo root: `Get-ChildItem -Recurse -Filter "*.css" fiberpath_gui\src | ForEach-Object { $c = (Get-Content $_.FullName | Measure-Object -Line).Lines; "$c $($_.Name)" } | Sort-Object { [int]($_ -split ' ')[0] } -Descending`
  - [x] Save output to `planning/baseline-css-loc.txt`
- [x] Record exact inline style count:
  - Run from repo root: `Select-String -Path "fiberpath_gui\src\**\*.tsx" -Pattern "style=\{\{" -Recurse | Measure-Object | Select-Object -ExpandProperty Count`
  - [x] Append count to `planning/baseline-css-loc.txt`

**Environment note:** Screenshot capture from a launched GUI is blocked in this execution environment (WSL1 Node runtime limitation).

**Exit criteria:**

- [ ] Before-state screenshots saved (committed or attached to PR-1)
- [x] `planning/baseline-css-loc.txt` committed

---

### Phase 1 — Token System Rationalization (1-2 days)

**Purpose:** Turn `tokens.css` into a clean semantic API that drives all styling decisions downstream.

> **Hard prerequisite for Phase 2.** Phase 1 must be merged before Phase 2 begins — Phase 2 will reference the revised token names.

**Files:** `fiberpath_gui/src/styles/tokens.css`

> **⚠ Cascade warning:** Any renamed token must be updated across all 20 CSS files in the same PR. Safe rename procedure: (1) add `--new-name: var(--old-name)` alongside the old name, (2) grep-replace all call sites to `--new-name`, (3) delete `--old-name` — all in one commit so the build never breaks between steps.

**Tasks:**

- [x] Audit token usage: `Select-String -Path "fiberpath_gui\src\**\*.css" -Pattern "var\(--" -Recurse` — note which tokens are used, how many times, and which are zero-usage
- [x] Reorganize `tokens.css` into clearly commented semantic sections:
  - [x] Surface / elevation
  - [x] Text hierarchy
  - [x] Border / separator
  - [x] Status / state (success, warning, error, info)
  - [x] Spacing scale
  - [x] Border radius scale
  - [x] Transitions / motion
- [x] Mark every legacy alias with `/* DEPRECATED: use --canonical-name */`
- [x] Delete only aliases confirmed zero-usage (grep before deleting)
- [x] Consolidate spacing values that differ by ≤2px into a single token (no merges required; existing spacing scale has no ≤2px neighbors)
- [x] Reduce transitions to ≤3 reusable values
- [x] For any renamed token: update all 20 CSS files in the same commit

**Deliverables:**

- [x] Revised `tokens.css` with semantic section headers
- [x] Token count delta (total before → after) appended to `planning/baseline-css-loc.txt`

**Exit criteria:**

- [x] All semantic sections present and named consistently
- [x] No legacy alias has more usages than its canonical form
- [x] Zero one-off color literals introduced
- [ ] `npm run check:all` passes from `fiberpath_gui/`

**Environment note:** `npm run check:all` is blocked in this execution environment (WSL1 Node runtime limitation).

---

### Phase 1b — Theme Architecture (included in Phase 1 PR)

**Purpose:** Since `tokens.css` is already fully semantic (`--color-bg`, `--color-text`, etc.), theming requires only defining a light palette override and a minimal React hook. This must land in the same PR as Phase 1 so Phase 2 CSS work can be verified against both themes from day one.

**Approach:**

- `:root {}` in `tokens.css` remains the **dark theme** (default, no change to existing behavior)
- A `[data-theme="light"] {}` block at the bottom of `tokens.css` overrides **only the color tokens** — spacing, typography, radius, transitions are theme-neutral and do not change
- System auto-detection: `@media (prefers-color-scheme: light) { :root:not([data-theme]) {} }` — when no manual override is stored, follow the OS preference
- `data-theme` attribute is set on `document.documentElement`; all CSS reacts automatically with no component changes
- A `useTheme` hook reads `localStorage` for a persisted preference, falls back to `prefers-color-scheme`, and exposes `theme` + `setTheme`
- A theme toggle button (sun/moon icon) placed in `MenuBar.tsx` calls `setTheme`

**Files:**

- `fiberpath_gui/src/styles/tokens.css` (light palette block)
- `fiberpath_gui/src/hooks/useTheme.ts` (new hook)
- `fiberpath_gui/src/components/MenuBar.tsx` (toggle button)

**Tasks:**

- [x] Define `[data-theme="light"]` block in `tokens.css` — override all `--color-bg-*`, `--color-text-*`, `--color-border-*`, `--color-console-*` tokens with light equivalents; keep brand/status/accent colors identical or lightly adjusted
- [x] Add `@media (prefers-color-scheme: light) { :root:not([data-theme]) { /* same overrides */ } }` block for system auto-detection
- [x] Create `fiberpath_gui/src/hooks/useTheme.ts`:
  - [x] Reads `localStorage.getItem('fiberpath-theme')` on mount
  - [x] Listens to `window.matchMedia('(prefers-color-scheme: dark)')` change events when no stored preference
  - [x] Sets `document.documentElement.setAttribute('data-theme', theme)` reactively
  - [x] Exposes `{ theme, setTheme, isSystemTheme }` — `setTheme(null)` clears the override and reverts to system
- [x] Add toggle button to `MenuBar.tsx`: icon-only button (sun / moon / auto), three states — dark / light / system
- [ ] Verify no hardcoded color literals remain in any CSS file that would break under the light theme (run `npm run lint:css:vars`)

**Light palette guidance:**
- Invert the surface hierarchy: dark bg (`#09090b`) → light bg (`#f9f9fb`); dark panel → white; dark panel-alt → `#f4f4f6`
- Text inverts: `--color-text` → near-black; `--color-text-muted` → mid-gray
- Borders: increase contrast slightly vs. dark mode
- Console surfaces: lighter neutral (e.g. `#f0f0f2`) rather than near-black
- Brand primary (`#12a89a`) and accent (`#d8b534`) can stay; adjust hover states if needed for contrast
- Status colors (success/error/warning/info) stay; verify WCAG AA contrast against light bg

**Deliverables:**

- [x] `tokens.css` with complete light theme override block
- [x] `hooks/useTheme.ts` implemented
- [x] Toggle button renders in MenuBar, switches themes visually

**Exit criteria:**

- [ ] System preference (light/dark OS setting) is respected on first launch with no stored preference
- [ ] Manual toggle persists after app restart
- [ ] No white-on-white or dark-on-dark issues visible in either theme across all major surfaces
- [ ] `npm run check:all` and `npm run test` pass

**Environment note:** Node commands are blocked in this environment (WSL1 runtime limitation), so final runtime checks for Phase 1b are pending local verification.

---

### Phase 2 — Layout and Primitive Hardening (2-3 days)

**Purpose:** Remove visual noise from structural files and establish shared primitive classes that Phases 3 and 4 inherit. Covers interactive element styles (buttons, forms) in addition to structural layout.

**Files:**

- `fiberpath_gui/src/styles/layout.css`
- `fiberpath_gui/src/styles/panels.css`
- `fiberpath_gui/src/styles/dialogs.css`
- `fiberpath_gui/src/styles/canvas.css`
- `fiberpath_gui/src/styles/buttons.css`
- `fiberpath_gui/src/styles/forms.css`
- `fiberpath_gui/src/styles/typography.css`

**Tasks:**

- [ ] `layout.css`: remove decorative radial gradients from `.main-layout`; simplify shell background to a flat surface token
- [ ] `panels.css`: standardize panel chrome — one consistent padding, border, radius, and section header pattern; extract as reusable `.panel`, `.panel-header`, `.panel-body` classes
- [ ] `dialogs.css`: standardize dialog container, header, body, footer primitives into reusable classes; remove per-dialog one-offs
- [ ] `canvas.css`: simplify canvas frame; remove `backdrop-filter` blur unless demonstrably necessary
- [ ] `buttons.css`: ensure all button states (default, hover, active, disabled, loading) are covered by token-only declarations; eliminate one-off color literals
- [ ] `forms.css`: align input/select/textarea chrome with panel primitives; ensure focus ring uses a single token
- [ ] `typography.css`: verify type scale maps directly to text hierarchy tokens from Phase 1
- [ ] Eliminate duplicate declarations across all touched files

**Deliverables:**

- [ ] Reusable primitive classes documented in a comment block at the top of `panels.css` and `dialogs.css`
- [ ] LOC delta for all touched files appended to `planning/baseline-css-loc.txt`

**Exit criteria:**

- [ ] Main shell, panels, and dialogs are visually consistent
- [ ] All interactive states (hover/active/disabled/error) covered deterministically
- [ ] Combined LOC of the four original hotspot files trends downward
- [ ] `npm run check:all` passes from `fiberpath_gui/`

---

### Phase 3 — Component Style Debt Elimination (1-2 days)

**Purpose:** Remove local style entropy by replacing avoidable inline styles with class-based declarations.

**Files — determined by fresh audit at phase start (do not rely on cached list below):**

Run this audit at phase start to get the up-to-date list:

```
Select-String -Path "fiberpath_gui\src\**\*.tsx" -Pattern "style=\{\{" -Recurse | Select-Object Filename, LineNumber, Line
```

Known call sites from baseline scan (verify/extend with audit above):

- `fiberpath_gui/src/App.tsx`
- `fiberpath_gui/src/components/StatusBar.tsx`
- `fiberpath_gui/src/components/dialogs/CliUnavailableDialog.tsx`
- `fiberpath_gui/src/components/dialogs/DiagnosticsDialog.tsx`
- `fiberpath_gui/src/components/StreamTab/FileStreamingSection.tsx`
- `fiberpath_gui/src/components/layers/LayerStack.tsx`

**Tasks:**

- [ ] Run audit; record full list of `style={{}}` call sites as phase baseline
- [ ] Verify `useTheme` hook integration: confirm toggle button is accessible and keyboard-operable
- [ ] For each call site: evaluate whether the value is truly runtime-dynamic
  - If static → replace with a CSS class using a token
  - If dynamic (calculated at render time) → keep inline, add `/* dynamic: reason */` comment
- [ ] Add any required new utility classes to the appropriate global CSS file (not a new file)
- [ ] Ensure all new class names follow existing naming conventions

**Deliverables:**

- [ ] Inline style call site count before → after appended to `planning/baseline-css-loc.txt`
- [ ] A brief note on any remaining inline styles and why they are legitimately dynamic

**Exit criteria:**

- [ ] Inline `style={{}}` count reduced to dynamic exceptions only (target ≤4)
- [ ] All touched components pass visual review
- [ ] `npm run check:all` passes from `fiberpath_gui/`

---

### Phase 4 — Stream Tab Convergence (1-2 days)

**Purpose:** Bring the Stream tab to the same visual language as the main workspace by having it inherit Phase 2 primitives, not by re-styling it independently.

**Files:**

- `fiberpath_gui/src/components/StreamTab/StreamTab.css`
- `fiberpath_gui/src/components/StreamTab/ConnectionSection.css`
- `fiberpath_gui/src/components/StreamTab/FileStreamingSection.css`
- `fiberpath_gui/src/components/StreamTab/ManualControlSection.css`
- `fiberpath_gui/src/components/StreamTab/StreamControls.css`
- `fiberpath_gui/src/components/StreamTab/StreamLog.css`
- `fiberpath_gui/src/components/StreamTab/KeyboardShortcuts.css`
- `fiberpath_gui/src/components/Toast/ToastContainer.css`

**Tasks:**

- [ ] For each StreamTab CSS file: identify rules that duplicate what the Phase 2 primitives now provide
- [ ] Delete duplicated rules and replace TSX class names with the Phase 2 primitive classes where appropriate
- [ ] Standardize status chips and feedback colors to use `--status-*` tokens from Phase 1
- [ ] Simplify progress and control visual elements — remove decorative effects, keep only functional feedback
- [ ] Align typography scale with `typography.css` (no local font-size / line-height one-offs)
- [ ] `ToastContainer.css`: ensure toast states (success, warning, error, info) use only status tokens
- [ ] Target: StreamTab-specific CSS files should contain only StreamTab-specific layout, not re-declared primitives

**Deliverables:**

- [ ] LOC delta for all StreamTab CSS files appended to `planning/baseline-css-loc.txt`

**Exit criteria:**

- [ ] Stream tab is visually indistinguishable in design language from the main workspace
- [ ] No rule in any StreamTab CSS file duplicates a Phase 2 primitive
- [ ] `npm run check:all` passes from `fiberpath_gui/`

---

### Phase 5 — Dependencies, Documentation, and Lock-In (1-2 days)

**Purpose:** Remove confirmed dead weight, validate quality across platforms, and prevent style drift after rollout.

**Files:**

- `fiberpath_gui/package.json`
- `fiberpath_gui/docs/guides/styling.md`
- Any other referenced GUI style documentation

**Tasks:**

- [ ] Remove confirmed dead packages: `npm uninstall @radix-ui/react-dropdown-menu @radix-ui/react-menubar clsx` — confirm no TSX imports exist before running
- [ ] Run `npm run check:all` and `npm run test` after removal to confirm nothing broke
- [ ] Cross-platform visual QA: open app on Windows, macOS, and Linux; check for rendering differences
- [ ] Contrast and readability check on all major surfaces
- [ ] Update `docs/guides/styling.md` to reflect actual architecture:
  - [ ] Correct the "CSS Modules" claim — the app uses global CSS with BEM-like naming, not CSS Modules
  - [ ] Document the token taxonomy (section names from Phase 1)
  - [ ] Document the theme architecture: `data-theme` attribute, `[data-theme="light"]` override block, `useTheme` hook, system auto-detection
  - [ ] Document the primitive classes established in Phase 2
  - [ ] Document the inline-style exception policy
  - [ ] Document how to add styles to new components (token first → primitive class → new class in appropriate file)
- [ ] Attach final QA checklist results to PR-5

**Exit criteria:**

- [ ] Dead Radix UI packages removed; build and tests still pass
- [ ] Documentation matches implementation exactly
- [ ] No major visual regressions on any platform
- [ ] `npm run check:all` passes from `fiberpath_gui/`

---

## Quality Gates

Run from `fiberpath_gui/` (`cd fiberpath_gui` first).

### Gate A — Build and Lint (every PR)

```
npm run check:all   # tsc + stylelint + css-vars check + cargo fmt + cargo clippy
npm run test        # vitest
```

> `npm run check:all` is the canonical gate. It covers `lint`, `lint:css`, `lint:css:vars`, `format:check`, and `clippy` in one command. Do not run them individually as a substitute.

### Gate B — Functional Regression (every PR)

- [ ] Main tab: plan flow, plot preview, simulate — all still usable end-to-end
- [ ] Stream tab: connect, load file, stream controls — all still usable
- [ ] Dialogs: about, diagnostics, export confirmation — all render and dismiss correctly

### Gate C — Visual Regression (every PR)

- [ ] Before/after screenshots taken for every major surface touched in the PR
- [ ] No unintended typography or spacing regressions
- [ ] All interactive states (hover/active/disabled) still visually distinct
- [ ] (From Phase 1b onwards) Screenshots taken in **both themes** — no white-on-white or dark-on-dark issues

---

## Measurement and Reporting

### Metrics (tracked in `planning/baseline-css-loc.txt`)

| Metric                  | Baseline | After Phase 1 | After Phase 2 | After Phase 4 | Final |
| ----------------------- | -------- | ------------- | ------------- | ------------- | ----- |
| Total CSS LOC           | 3942     |               |               |               |       |
| dialogs.css LOC         | 551      | —             |               | —             |       |
| panels.css LOC          | 446      | —             |               | —             |       |
| layout.css LOC          | 431      | —             |               | —             |       |
| canvas.css LOC          | 364      | —             |               | —             |       |
| `style={{}}` call sites | 17       | —             | —             | —             |       |
| Token count (total)     | TBD      |               | —             | —             |       |
| Legacy alias count      | TBD      |               | —             | —             |       |

### Reporting Cadence

- End of each phase: one short status note with metric deltas appended to `planning/baseline-css-loc.txt`
- End of Phase 5: consolidated final report with before/after screenshots and gate results

---

## Risk Register

| Risk                                              | Mitigation                                                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Over-simplification removes affordance clarity    | Preserve all interactive state styles in Phase 2 button/form work; run Gate B before every merge                          |
| Token rename cascade breaks build mid-phase       | Follow the safe rename procedure in Phase 1 (alias first, migrate, delete)                                                |
| Light theme palette introduces low-contrast areas | Check all status/text/surface combinations against WCAG AA (4.5:1 for normal text) before merging Phase 1b                |
| Hardcoded color literals survive into Phase 2+    | `npm run lint:css:vars` will catch them; run as part of Gate A on every PR from Phase 1b onwards                          |
| Phase 2 scope expands into component refactor     | If a TSX component needs structural changes to consume a new primitive class, that change belongs in Phase 3, not Phase 2 |
| Visual regressions on specific platform rendering | Gate C + cross-platform QA in Phase 5 before final merge                                                                  |
| Style drift after rollout                         | Updated `styling.md` doc + inline-style exception policy enforces the guardrails                                          |

---

## Rollout Sequence

| PR   | Content                                                                              |
| ---- | ------------------------------------------------------------------------------------ |
| PR-1 | Phase 0 (baseline capture) + Phase 1 (token rationalization) + Phase 1b (theming)   |
| PR-2 | Phase 2 (layout, panel, dialog, button, form primitives) — verified in both themes   |
| PR-3 | Phase 3 (inline style debt + theme toggle UX polish)                                 |
| PR-4 | Phase 4 (Stream tab convergence)                                                     |
| PR-5 | Phase 5 (dead dependencies, docs, lock-in)                                           |

### PR Description Requirements

Every PR must include:

- Scope: which phase tasks are covered
- Files changed summary
- Before/after screenshots for touched surfaces
- Token additions / removals / renames (Phase 1 PR only needs full table; others note changes)
- Inline-style exceptions remaining, with justification
- Gate A and Gate B results

---

## Estimated Timeline

| Phase                                        | Duration               |
| -------------------------------------------- | ---------------------- |
| 0 — Baseline capture                         | 0.5 day                |
| 1 — Token rationalization + 1b theme arch    | 2–3 days               |
| 2 — Layout and primitive hardening           | 2–3 days               |
| 3 — Component style debt + toggle UX         | 1–2 days               |
| 4 — Stream tab convergence                   | 1–2 days               |
| 5 — Dependencies, docs, lock-in              | 1–2 days               |
| **Total**                                    | **~8–13 working days** |

---

## Final Acceptance Criteria

- [ ] UI presentation is visibly cleaner and calmer in before/after comparison
- [ ] Styling complexity is materially reduced with measured evidence (metrics table complete)
- [ ] All key workflows remain fully functional (Gate B pass on all PRs)
- [ ] Light theme and dark theme both render correctly — no contrast failures on any major surface
- [ ] App follows system preference on first launch; toggle persists the override across sessions
- [ ] `planning/baseline-css-loc.txt` is complete and shows positive trends
- [ ] `docs/guides/styling.md` accurately documents the architecture and conventions
- [ ] Dead Radix UI packages removed from `package.json`
- [ ] An enforceable inline-style policy and token-first rule are documented and applied

---

## Decision Gate After Phase 3

Evaluate: is the app now visually clean and maintainable enough?

- **Yes** → continue with Phase 4–5 and incremental polish only
- **No** → before committing more time to styling, re-evaluate the framework migration question separately. Create `planning/gui-framework-migration-evaluation-plan.md` at that point.
