# Outstanding Validation Items

Last Updated: 2026-03-22

Purpose: Single reference for all validation and verification items that must be resolved before releasing. Technical findings drive code changes; platform items drive test execution. Items are tracked against target releases via the active roadmaps.

---

## Technical Findings

Open findings from code review (2026-03-22). Each finding must be closed by a merged code change with test coverage before the associated roadmap item can be checked complete.

### Finding 1 — Helical Layer Silent Skip (High)

- **Risk:** Planner may succeed while silently omitting intended fiber placement when the winding angle does not divide evenly.
- **Action:** Enforce divisibility as a validation error; add regression test.
- **Target:** v0.5.2

### Finding 4 — Helical lockDegrees Coverage Defect (High) ✅ Closed

- **Risk:** A `lockDegrees` value incompatible with `patternNumber` (e.g. `270°` with `patternNumber: 3`) caused silent coverage failure — the planner
  produced valid G-code but circuits overlapped, leaving bare strips of mandrel. Observed: single-layer `AvBay(470mm)` winding covered only ~33% of surface.
- **Root cause:** The net mandrel advance per circuit is `(2 × lockDegrees) % 360°`. Two conditions must both hold for even distribution:
  (1) divisibility — `(2 × lockDegrees) % (360 / patternNumber) == 0`; (2) non-aliasing — the resulting slot stride must be coprime with `patternNumber`.
  Neither condition was validated; `lockDegrees` was only constrained to `> 0`.
- **Action:** Added two-condition validation to `validate_helical_layer()` with actionable error messages reporting nearest valid values.
  Fixed `AvBay(470mm)single.wind` and `AvBay(470mm)triple.wind` examples (`270° → 540°`). Added four new unit tests.
- **Finding 5 coupling:** `skipIndex` was not wired into `start_position_increment` (see Finding 5 below); corrected simultaneously.
- **Target:** v0.6.0 (merged as part of helical coverage fixes)

### Finding 5 — skipIndex Phantom Feature (High) ✅ Closed

- **Risk:** `skipIndex > 1` in `.wind` files had no effect on G-code output. `start_position_increment` was hardcoded as `360 / patternNumber`
  regardless of `skipIndex`, so files with `skipIndex = 2` always produced the same output as `skipIndex = 1`.
- **Root cause:** `layer.skip_index` was validated (coprimality check present) but never used in placement computation.
- **Action:** Changed `start_position_increment = 360.0 / pattern_number` → `layer.skip_index * (360.0 / pattern_number)` in
  `plan_helical_layer()`. `skipIndex = 1` produces identical G-code to the previous behaviour. `skipIndex > 1` now changes visit order
  as documented. The `helical_layer.gcode` fixture was regenerated with valid `lockDegrees = 180` (was `160`, which also failed
  condition 1). Note: all existing reference `.wind` files have `skipIndex = 1` or `skipIndex = 2`; only `skipIndex = 2` files
  are affected.
- **Coupled with:** Finding 4 (lockDegrees check uses `skip_index`); both shipped together.
- **Target:** v0.6.0

### Finding 2 — API Path Handling Too Broad (Medium) ✅ Closed

- **Risk:** Broad output path acceptance increases overwrite/traversal risk if the API is exposed outside trusted local use.
- **Action:** Restricted API path access to configured allowed roots and enforced output path policy for planning writes.
- **Target:** v0.5.2

### Finding 3 — CLI Broad Exception Catching (Low)

- **Risk:** Catching all exceptions reduces debugging fidelity and CI triage clarity.
- **Action:** Catch known exception classes first; support an optional debug traceback mode.
- **Target:** v0.6.0

### Closing Criteria

A finding is closed when:

1. Code change is merged.
2. Tests cover the corrected behavior.
3. Corresponding roadmap task is checked complete.

---

## Platform Validation

Execution status for cross-platform testing (v6 scope). Detailed pass/fail task lists live in [roadmap-v6.md](roadmap-v6.md).

| Platform         | Installer       | Status      | Notes                                    |
| ---------------- | --------------- | ----------- | ---------------------------------------- |
| Ubuntu 22.04     | `.deb`          | Not started | Primary Linux target                     |
| Ubuntu 22.04     | `.AppImage`     | Not started | FUSE/Type 2 required                     |
| Debian 12        | `.deb`          | Not started |                                          |
| Fedora 39        | `.rpm` (manual) | Not started | Document RPM gap                         |
| macOS 13 Intel   | `.dmg`          | Not started | Gatekeeper workaround required           |
| macOS 13 Silicon | `.dmg`          | Not started | Separate PyInstaller build may be needed |
| Windows          | `.msi` / `.exe` | ✅ Complete | v0.5.1                                   |

---

## Release Gate — v0.5.2 (Closed)

All items below were completed before v0.5.2 closure.

- [x] Finding 1 (Helical Layer Silent Skip) — code fixed, regression tests added
- [x] Finding 2 (API path handling) — code fixed, tests merged
- [x] UI contrast verification complete across dialogs/stream/notifications/status surfaces (active, hover, disabled, error)

### Completed Baseline Fixes (2026-03-22)

- [x] Restored missing legacy token aliases in `fiberpath_gui/src/styles/tokens.css` for old/new style interoperability.
- [x] Added missing `.button--primary` dialog styles in `fiberpath_gui/src/styles/dialogs.css` to fix Export G-code dark-on-dark button text.
- [x] Added CSS variable guard script + GUI CI step (`npm run lint:css:vars`) to fail on unresolved `var(--token)` usage.
- [x] Added missing `.btn`/`.btn--*` button style variants in `fiberpath_gui/src/styles/buttons.css` to prevent browser-default contrast regressions in CLI dialogs/warnings.
- [x] Enforced helical divisibility validation in planner validators and added regression coverage in planning tests.
- [x] Added API allowed-root path policy for plan/validate/simulate routes and API tests for allowed + forbidden paths.

## Release Gate — v0.6.0

- [ ] Finding 3 (CLI exceptions) — code fixed, tests merged
- [ ] Linux: no-Python install confirmed on Ubuntu 22.04 (`.deb` and `.AppImage`)
- [ ] macOS: no-Python install confirmed on Intel + Apple Silicon
- [ ] Platform-specific shortcuts and serial discovery verified (with docs complete)
- [ ] Dev fallback (system PATH) works without bundled CLI on Linux and macOS
- [ ] Cross-platform docs complete: `getting-started.md`, `troubleshooting.md`, serial naming guide
- [ ] Cross-platform package-level E2E smoke workflow green on Windows/Linux/macOS
- [ ] macOS code signing / Gatekeeper flow resolved or formally deferred
