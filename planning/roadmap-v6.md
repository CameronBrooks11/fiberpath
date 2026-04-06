# FiberPath Roadmap v6 - Release Validation & E2E Automation

**Target Release:** v0.6.0  
**Status:** Active (0/44 tasks complete)
**Prerequisites:** v0.5.4 released with dependency stabilization and scanning close-out complete  
**Timeline:** 2-3 weeks (36-52 hours)

**Scope Boundary:** v6 consolidates remaining cross-platform validation, release-readiness docs, and CI E2E automation.
**Related Roadmaps:** [roadmap-v5.2.md](roadmap-v5.2.md) is closed; [roadmap-v7.md](roadmap-v7.md) owns production polish and developer infrastructure.
**Validation Reference:** [OUTSTANDING_VALIDATION.md](OUTSTANDING_VALIDATION.md)

---

## Objective

Ship durable cross-platform confidence for FiberPath by combining manual platform validation with automated package-level E2E checks in CI.

## Review Outcome (2026-04-06)

- v6 scope is approved and remains the correct release gate for v0.6.0.
- No dependency or security blockers remain from v0.5.4 stabilization close-out.
- Critical path is now: Linux install/runtime validation -> macOS install/runtime validation -> docs and fallback mode verification -> CI package-level E2E automation.
- Finding 3 in [OUTSTANDING_VALIDATION.md](OUTSTANDING_VALIDATION.md) is the only remaining technical finding explicitly tied to v0.6.0 closure.

## Dive-In Plan (Execution Order)

1. Start Linux and CI smoke scaffolding in parallel so package assumptions are validated early.
2. Run macOS validation immediately after Linux happy-path install and bundled CLI checks pass.
3. Complete fallback mode and cross-platform docs once platform behavior is confirmed.
4. Close with workflow hardening and release-gate evidence consolidation.

## Day 0 Readiness Checklist (Enablement, Not Counted in 44 Tasks)

- [ ] Create a v6 tracking issue with 4 checklist sections matching phases below.
- [ ] Confirm latest packaging artifacts exist for Windows/Linux/macOS and are downloadable from CI.
- [ ] Define evidence capture locations (screenshots, logs, command transcripts) under `docs/testing/`.
- [ ] Confirm test hosts are available: Ubuntu 22.04, Debian 12, Fedora 39, macOS Intel, macOS Apple Silicon.
- [ ] Prepare serial test strategy per platform (real hardware vs virtual serial fallback).
- [ ] Lock sample files for validation runs (`examples/simple_cylinder/input.wind` and one helical sample).
- [ ] Confirm ownership and time-box for each phase before first execution run.
- [ ] Create issue labels for v6 execution tracking (`v6-linux`, `v6-macos`, `v6-docs`, `v6-e2e`).

## Evidence Requirements (Release Gate Artifacts)

| Area | Minimum Evidence Required |
| ---- | ------------------------- |
| Linux install/runtime | Installer run notes, bundled CLI `--version`, command outputs for validate/plan, streaming and serial notes |
| macOS install/runtime | Gatekeeper launch notes, bundled CLI `--version`, command outputs for validate/plan, driver/serial notes |
| Fallback mode | Logs proving PATH-based CLI discovery with bundled CLI disabled on Linux and macOS |
| Docs | Updated docs pages with platform-specific install, serial, troubleshooting, and fallback guidance |
| CI E2E | Green matrix run proving artifact presence plus bundled CLI smoke execution on all 3 OSes |

## Week 1 Target Outcomes

- Linux validation reaches at least 10/15 tasks complete, including bundled CLI checks.
- CI E2E workflow scaffold exists and can run manually via `workflow_dispatch`.
- macOS validation begins with installer + Gatekeeper + bundled CLI verification.
- Any blockers are filed as issues within 24 hours with severity and proposed owner.

---

## Phase 1: Linux Validation (Ubuntu 22.04 primary, Debian 12, Fedora 39)

- [ ] Install `.deb` and `.AppImage` on fresh Ubuntu 22.04, verify no Python needed
- [ ] Verify `.deb` integration: system menu, desktop file, icons, `.wind` associations
- [ ] Verify `.AppImage`: FUSE/Type 2, permissions, runs from any directory
- [ ] Test `.deb` on Debian 12, manual test on Fedora (document RPM need)
- [ ] Bundled CLI: verify `resources/fiberpath` location, test `--version` discovery
- [ ] Test all CLI commands via GUI: validate, plan, simulate, plot, stream, interactive
- [ ] Serial ports: test `/dev/ttyUSB0`, `/dev/ttyACM0`, document `dialout` group requirement
- [ ] Hardware: test real Marlin (if available) or virtual serial (socat)
- [ ] Full workflow: example -> validate -> plan -> simulate -> visualize
- [ ] File ops: open `.wind`, save, export G-code, import/export configs
- [ ] Shortcuts: Ctrl+S, Ctrl+O, Ctrl+N, Ctrl+Q
- [ ] Streaming: connect, stream, monitor, cancel, disconnect
- [ ] Upgrade: v0.5.0 -> v0.6.0, verify CLI updated, settings preserved
- [ ] Uninstall: `.deb` via apt, `.AppImage` manual, check `/opt`, `~/.local`, `~/.config` clean
- [ ] Platform-specific: Wayland/X11, desktop environments (GNOME/KDE/XFCE), OpenGL, themes

**Progress:** 0/15 tasks

---

## Phase 2: macOS Validation (macOS 13+, Intel + Apple Silicon)

- [ ] Install `.dmg` on fresh macOS (Intel and Apple Silicon), verify no Python needed
- [ ] Verify installation: drag to Applications, launch (Gatekeeper), icons, `.wind` associations
- [ ] Document Gatekeeper: "Open anyway" workaround, plan code signing decisions
- [ ] Bundled CLI: verify `../Resources/fiberpath` location, test `--version` discovery
- [ ] Test all CLI commands via GUI: validate, plan, simulate, plot, stream, interactive
- [ ] Serial ports: test `/dev/tty.usbserial*`, `/dev/cu.usbserial*`, document driver needs (FTDI/CH340/CP210x)
- [ ] Hardware: test real Marlin (if available) or virtual serial (if feasible)
- [ ] Full workflow: example -> validate -> plan -> simulate -> visualize
- [ ] File ops: open `.wind`, save, export G-code, import/export configs
- [ ] Shortcuts: Cmd+S, Cmd+O, Cmd+N, Cmd+Q
- [ ] Streaming: connect, stream, monitor, cancel, disconnect
- [ ] Upgrade: v0.5.0 -> v0.6.0, verify CLI updated, settings preserved
- [ ] Uninstall: remove from Applications, check `~/Library/Application Support`, `~/Library/Caches` clean
- [ ] Platform-specific: Retina displays, Touch Bar, accessibility, Full Disk Access

**Progress:** 0/14 tasks

---

## Phase 3: Fallback, Docs, and Release Guidance

- [ ] Linux/macOS: build without bundled CLI, verify system PATH fallback works
- [ ] Test `pip install -e .` in venv, verify CLI discovery on both platforms
- [ ] Document dev mode in `fiberpath_gui/docs/development.md`, add troubleshooting
- [ ] Create `docs/testing/cross-platform-checklist.md` with platform-specific considerations
- [ ] Update `README.md`, `docs/getting-started.md`, `fiberpath_gui/README.md` with platform notes
- [ ] Create `docs/troubleshooting.md`: Linux (`dialout` group), macOS (Gatekeeper, drivers), Windows (v0.5.1)
- [ ] Document serial naming: Windows (`COM1`), Linux (`/dev/ttyUSB0`), macOS (`/dev/tty.usbserial-*`)
- [ ] Fix critical bugs, document non-critical quirks, create GitHub issues, update CI if needed

**Progress:** 0/8 tasks

---

## Phase 4: Cross-Platform E2E CI Automation

- [x] Create `.github/workflows/gui-e2e-smoke.yml` matrix workflow (Windows/Linux/macOS)
- [ ] Trigger via `workflow_run` from GUI Packaging and `workflow_dispatch`
- [ ] Add reusable smoke scripts under `scripts/ci/` (shell + PowerShell)
- [ ] Validate packaged artifact presence per OS (`.msi/.exe`, `.deb/.AppImage`, `.dmg/.app`)
- [ ] Verify bundled CLI `--version` from packaged outputs on each OS
- [ ] Run bundled CLI `validate` and `plan` on sample input; assert output generated
- [ ] Add clear pass/fail diagnostics in workflow logs for fast triage

**Progress:** 1/7 tasks

---

## Summary

| Phase                 | Tasks  | Effort          |
| --------------------- | ------ | --------------- |
| 1 - Linux Validation  | 15     | 12-16 hours     |
| 2 - macOS Validation  | 14     | 12-16 hours     |
| 3 - Fallback & Docs   | 8      | 8-12 hours      |
| 4 - E2E CI Automation | 7      | 4-8 hours       |
| **Total**             | **44** | **36-52 hours** |

## Success Criteria

- Linux and macOS packaged app flows are manually validated and documented.
- Dev fallback mode (system PATH) is verified on Linux/macOS.
- New E2E smoke workflow validates package artifacts and bundled CLI across all 3 OSes.
- Outstanding v0.6.0 validation gate items are either verified or explicitly waived.

**Next:** After v6 completion, proceed to [roadmap-v7.md](roadmap-v7.md) for production polish and developer infrastructure.
