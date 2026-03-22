# FiberPath Roadmap v6 - Release Validation & E2E Automation

**Target Release:** v0.6.0  
**Status:** Active (0/44 tasks complete)  
**Prerequisites:** v0.5.2 released and stable baseline confirmed  
**Timeline:** 2-3 weeks (36-52 hours)

**Scope Boundary:** v6 consolidates remaining cross-platform validation, release-readiness docs, and CI E2E automation.
**Related Roadmaps:** [roadmap-v5.2.md](roadmap-v5.2.md) is closed; [roadmap-v7.md](roadmap-v7.md) owns production polish and developer infrastructure.
**Validation Reference:** [OUTSTANDING_VALIDATION.md](OUTSTANDING_VALIDATION.md)

---

## Objective

Ship durable cross-platform confidence for FiberPath by combining manual platform validation with automated package-level E2E checks in CI.

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

- [ ] Create `.github/workflows/gui-e2e-smoke.yml` matrix workflow (Windows/Linux/macOS)
- [ ] Trigger via `workflow_run` from GUI Packaging and `workflow_dispatch`
- [ ] Add reusable smoke scripts under `scripts/ci/` (shell + PowerShell)
- [ ] Validate packaged artifact presence per OS (`.msi/.exe`, `.deb/.AppImage`, `.dmg/.app`)
- [ ] Verify bundled CLI `--version` from packaged outputs on each OS
- [ ] Run bundled CLI `validate` and `plan` on sample input; assert output generated
- [ ] Add clear pass/fail diagnostics in workflow logs for fast triage

**Progress:** 0/7 tasks

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
