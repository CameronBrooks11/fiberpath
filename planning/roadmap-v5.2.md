# FiberPath Roadmap v5.2 - Cross-Platform Testing & Validation

**Version:** 0.5.2  
**Prerequisites:** v0.5.1 (Windows bundling complete)  
**Timeline:** 1-2 weeks (32-44 hours)

---

## Objective

Validate bundled CLI on Linux and macOS. Ensure "no Python required" promise holds across all platforms.

**v5.1 Status:** Windows complete (installation, bundling, workflows, upgrades)  
**v5.2 Focus:** Linux/macOS validation, development fallback, cross-platform docs

---

## Phase 1: Linux Testing (Ubuntu 22.04 primary, Debian 12, Fedora 39)

- [ ] Install `.deb` and `.AppImage` on fresh Ubuntu 22.04, verify no Python needed
- [ ] Verify `.deb` integration: system menu, desktop file, icons, `.wind` associations
- [ ] Verify `.AppImage`: FUSE/Type 2, permissions, runs from any directory
- [ ] Test `.deb` on Debian 12, manual test on Fedora (document RPM need)
- [ ] Bundled CLI: verify `resources/fiberpath` location, test `--version` discovery
- [ ] Test all CLI commands via GUI: validate, plan, simulate, plot, stream, interactive
- [ ] Serial ports: test `/dev/ttyUSB0`, `/dev/ttyACM0`, document `dialout` group requirement
- [ ] Hardware: test real Marlin (if available) or virtual serial (socat)
- [ ] Full workflow: example → validate → plan → simulate → visualize
- [ ] File ops: open `.wind`, save, export G-code, import/export configs
- [ ] Shortcuts: Ctrl+S, Ctrl+O, Ctrl+N, Ctrl+Q
- [ ] Streaming: connect, stream, monitor, cancel, disconnect
- [ ] Upgrade: v0.5.0 → v0.5.2, verify CLI updated, settings preserved
- [ ] Uninstall: `.deb` via apt, `.AppImage` manual, check `/opt`, `~/.local`, `~/.config` clean
- [ ] Platform-specific: Wayland/X11, desktop environments (GNOME/KDE/XFCE), OpenGL, themes

**Progress:** 0/15 tasks

**Notes:** Serial requires `dialout` group. AppImage needs FUSE or Type 2. Document prominently.

---

## Phase 2: macOS Testing (macOS 13+, Intel + Apple Silicon)

- [ ] Install `.dmg` on fresh macOS (Intel and Apple Silicon), verify no Python needed
- [ ] Verify installation: drag to Applications, launch (Gatekeeper), icons, `.wind` associations
- [ ] Document Gatekeeper: "Open anyway" workaround, plan code signing for v0.6.0
- [ ] Bundled CLI: verify `../Resources/fiberpath` location, test `--version` discovery
- [ ] Test all CLI commands via GUI: validate, plan, simulate, plot, stream, interactive
- [ ] Serial ports: test `/dev/tty.usbserial*`, `/dev/cu.usbserial*`, document driver needs (FTDI/CH340/CP210x)
- [ ] Hardware: test real Marlin (if available) or virtual serial (if feasible)
- [ ] Full workflow: example → validate → plan → simulate → visualize
- [ ] File ops: open `.wind`, save, export G-code, import/export configs
- [ ] Shortcuts: **Cmd+S, Cmd+O, Cmd+N, Cmd+Q** (not Ctrl)
- [ ] Streaming: connect, stream, monitor, cancel, disconnect
- [ ] Upgrade: v0.5.0 → v0.5.2, verify CLI updated, settings preserved
- [ ] Uninstall: remove from Applications, check `~/Library/Application Support`, `~/Library/Caches` clean
- [ ] Platform-specific: Retina displays, Touch Bar, accessibility, Full Disk Access

**Progress:** 0/14 tasks

**Notes:** Cmd shortcuts (not Ctrl). Unsigned requires "Open anyway" workaround. Serial drivers often manual install. Test Intel + ARM separately.

---

## Phase 3: Development Fallback & Docs

- [ ] Linux/macOS: build without bundled CLI, verify system PATH fallback works
- [ ] Test `pip install -e .` in venv, verify CLI discovery on both platforms
- [ ] Document dev mode in `fiberpath_gui/docs/development.md`, add troubleshooting
- [ ] Create `docs/testing/cross-platform-checklist.md` with platform-specific considerations
- [ ] Update `README.md`, `docs/getting-started.md`, `fiberpath_gui/README.md` with platform notes
- [ ] Create `docs/troubleshooting.md`: Linux (`dialout` group), macOS (Gatekeeper, drivers), Windows (v0.5.1)
- [ ] Document serial naming: Windows (`COM1`), Linux (`/dev/ttyUSB0`), macOS (`/dev/tty.usbserial-*`)
- [ ] Fix critical bugs, document non-critical quirks, create GitHub issues, update CI if needed

**Progress:** 0/8 tasks

**Notes:** Dev fallback critical for contributors. Serial port docs essential—naming varies widely.

---

## Summary

| Phase               | Tasks  | Effort          |
| ------------------- | ------ | --------------- |
| 1 - Linux Testing   | 15     | 12-16 hours     |
| 2 - macOS Testing   | 14     | 12-16 hours     |
| 3 - Fallback & Docs | 8      | 8-12 hours      |
| **Total**           | **37** | **32-44 hours** |

**Prerequisites:** Linux VM (Ubuntu 22.04+), macOS 13+ (Intel + ARM if possible), USB serial hardware or virtual ports

**Platform Differences:**

| Aspect       | Linux                 | macOS                    | Windows (v0.5.1)        |
| ------------ | --------------------- | ------------------------ | ----------------------- |
| Installer    | `.deb`, `.AppImage`   | `.dmg`, `.app`           | `.msi`, `.exe`          |
| Shortcuts    | Ctrl+S/O              | Cmd+S/O                  | Ctrl+S/O                |
| Serial       | `/dev/ttyUSB0`        | `/dev/tty.usbserial-*`   | `COM1`                  |
| Permissions  | `dialout` group       | Driver install           | Works OOTB              |
| Code Signing | Not needed            | Gatekeeper workaround    | Not needed              |
| CLI Path     | `resources/fiberpath` | `../Resources/fiberpath` | `resources/` or `_up_/` |

**Risks:** PyInstaller may need separate Intel/ARM macOS builds. Test oldest Linux distro for glibc compatibility. Document serial driver install for macOS.

**Success Criteria:**

- ✅ `.deb`/`.AppImage` run without Python on Ubuntu 22.04
- ✅ `.dmg` runs without Python on Intel + Apple Silicon
- ✅ Platform-specific shortcuts/serial discovery work (with docs)
- ✅ Dev mode works without bundled CLI
- ✅ Cross-platform checklist and docs complete

**Next:** After v5.2, proceed to v6 (Production Polish) or release v0.5.2 as cross-platform production release.
