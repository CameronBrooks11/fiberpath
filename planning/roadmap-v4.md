# FiberPath v4 Roadmap - Tabs & Streaming Feature

**Goal:** Transform GUI into tabbed interface with integrated Marlin streaming capabilities

**Status:** Planning Complete - Architecture Decision Made  
**Branch:** tabsgui  
**Start Date:** 2026-01-08

**ARCHITECTURAL DECISION:** Refactoring Python MarlinStreamer for connection-centric workflow (see [ARCHITECTURE_DECISION_MARLIN.md](planning/ARCHITECTURE_DECISION_MARLIN.md))

**References:**

- [TABS_PLANNING.md](planning/TABS_PLANNING.md) - Comprehensive design document
- [ARCHITECTURE_DECISION_MARLIN.md](planning/ARCHITECTURE_DECISION_MARLIN.md) - Connection-centric refactor rationale

---

## Overview

### Phases Summary

**MVP Approach:** Quick minimal implementation first, then full features

1. **Streaming MVP** - Single Marlin tab with basic streaming (5 days)
2. **Settings Tab** - Configuration UI (4 days)
3. **Enhanced Marlin Tab** - Advanced controls and UI (3 days)
4. **Connection Features & Commands** - Interactive control (3 days)
5. **Pause/Resume & Statistics** - Enhanced streaming (3 days)
6. **Stream Visualization** - Visual progress (5 days)
7. **Polish & Documentation** - Production ready (4 days)

**MVP Target:** Phase 1 (5 days, ~1 week) - Basic streaming functional  
**Full Feature:** Phases 1-5 (18 days, ~3 weeks) - All streaming features complete  
**Release Ready:** Phases 1-7 (27 days, ~4 weeks) - Polished and documented

**Key Architectural Decision:** Python backend refactor (not Rust reimplementation):

- ✅ **Core stays Python** - accessible to more developers
- ✅ **No code duplication** - GUI reuses same MarlinStreamer as CLI
- ✅ **Simple refactor** - ~30 lines in marlin.py, ~150 lines Tauri glue
- ✅ **Backwards compatible** - CLI unchanged
- ✅ **Connection-centric** - connect → send commands → stream → disconnect

---

## Phase 1: Streaming MVP (5 days)

**Goal:** Single Marlin tab with basic G-code streaming and status display - nothing else

**Scope:** Minimal viable implementation to stream G-code files and see progress. No settings tab, no advanced controls, no command input - just stream and watch status.

**Tasks:**

### Day 1: Tab Infrastructure

- [ ] 1.1 - Refactor MainLayout to accept tabBar and flexible content props
- [ ] 1.2 - Create TabBar component with 2 tabs only (Main, Stream)
- [ ] 1.3 - Add lucide-react icons to TabBar (FileCode, Radio)
- [ ] 1.4 - Extract existing workspace into MainTab component
- [ ] 1.5 - Add tab state management in App.tsx (useState<'main' | 'stream'>)
- [ ] 1.6 - Implement conditional rendering based on active tab
- [ ] 1.7 - Create CSS for TabBar (pill button style, active state, hover effects)
- [ ] 1.8 - Add keyboard navigation (Alt+1/2 for tab switching)

### Day 1-2: Python Backend Refactor

- [ ] 1.9 - Make `_send_command()` public: rename to `send_command()`
- [ ] 1.10 - Update `send_command()` to return list of response lines
- [ ] 1.11 - Add `connect()` method - explicitly connect without streaming
- [ ] 1.12 - Add `is_connected` property to query connection state
- [ ] 1.13 - Update `iter_stream()` to work without pre-loaded program
- [ ] 1.14 - Test backwards compatibility: existing CLI still works
- [ ] 1.15 - Create `fiberpath_cli/interactive.py` module
- [ ] 1.16 - Add JSON stdin/stdout protocol handler
- [ ] 1.17 - Implement `connect` action
- [ ] 1.18 - Implement `stream` action
- [ ] 1.19 - Implement `disconnect` action
- [ ] 1.20 - Add error responses and progress events
- [ ] 1.21 - Test interactive mode with manual JSON input

### Day 2-3: Tauri Integration

- [ ] 1.22 - Add serialport dependency to Cargo.toml
- [ ] 1.23 - Create Tauri command: `list_serial_ports`
- [ ] 1.24 - Create Tauri command: `marlin_start_interactive` (spawn subprocess)
- [ ] 1.25 - Store subprocess handle in Tauri state
- [ ] 1.26 - Implement stdin writer (send JSON commands)
- [ ] 1.27 - Implement stdout reader thread (parse JSON responses)
- [ ] 1.28 - Create Tauri command: `marlin_connect`
- [ ] 1.29 - Create Tauri command: `marlin_disconnect`
- [ ] 1.30 - Create Tauri command: `marlin_stream_file`
- [ ] 1.31 - Emit `stream-progress` events to frontend
- [ ] 1.32 - Emit `stream-complete` / `stream-error` events

### Day 3-4: Stream Tab UI

- [ ] 1.33 - Create streamStore (Zustand) with minimal state (connection, streaming, progress)
- [ ] 1.34 - Create StreamTab component with 2-panel layout (controls | log)
- [ ] 1.35 - Create StreamControls component (left panel)
- [ ] 1.36 - Add port selector dropdown (uses list_serial_ports)
- [ ] 1.37 - Add "Refresh Ports" button
- [ ] 1.38 - Add "Connect" button
- [ ] 1.39 - Add "Disconnect" button
- [ ] 1.40 - Add connection status indicator (Connected/Disconnected)
- [ ] 1.41 - Add "Select G-code File" button (Tauri file dialog)
- [ ] 1.42 - Display selected filename
- [ ] 1.43 - Add "Start Stream" button (enabled when connected + file selected)
- [ ] 1.44 - Add "Stop Stream" button (enabled during streaming)
- [ ] 1.45 - Create StreamLog component (right panel, scrollable)
- [ ] 1.46 - Add progress bar (N / Total commands)
- [ ] 1.47 - Add current command display
- [ ] 1.48 - Style StreamTab with 2-panel layout (no center visualization yet)

### Day 4-5: Frontend Integration & Testing

- [ ] 1.49 - Wire up port selector to list_serial_ports
- [ ] 1.50 - Wire up Connect button to marlin_connect
- [ ] 1.51 - Wire up Disconnect button to marlin_disconnect
- [ ] 1.52 - Wire up "Select File" to Tauri file dialog
- [ ] 1.53 - Wire up "Start Stream" to marlin_stream_file
- [ ] 1.54 - Listen to stream-progress events
- [ ] 1.55 - Update progress bar on each event
- [ ] 1.56 - Update current command display on each event
- [ ] 1.57 - Append log messages to StreamLog
- [ ] 1.58 - Auto-scroll log to bottom
- [ ] 1.59 - Handle connection errors (display in log)
- [ ] 1.60 - Handle streaming errors (display in log)
- [ ] 1.61 - Test: Connect to Marlin hardware (if available)
- [ ] 1.62 - Test: Stream small G-code file (<100 commands)
- [ ] 1.63 - Test: Stream large G-code file (>1000 commands)
- [ ] 1.64 - Test: Connection lifecycle works correctly
- [ ] 1.65 - Test: Error states display correctly

**Files to Create:**

- `src/components/TabBar.tsx`
- `src/components/tabs/MainTab.tsx`
- `src/components/tabs/StreamTab.tsx`
- `src/components/stream/StreamControls.tsx`
- `src/components/stream/StreamLog.tsx`
- `src/state/streamStore.ts`
- `src/styles/tabs.css`
- `src/styles/stream.css`
- `src/types/serial.ts`
- `fiberpath_cli/interactive.py`
- `src/lib/streaming.ts`

**Files to Modify:**

- `src/layouts/MainLayout.tsx` (add tabBar prop)
- `src/App.tsx` (add tab state)
- `fiberpath/execution/marlin.py` (~30 lines of changes)
- `fiberpath_cli/main.py` (add `interactive` command)
- `src-tauri/Cargo.toml` (add serialport dependency)
- `src-tauri/src/main.rs` (~150 lines for subprocess + serial commands)

**Definition of Done:**

- [ ] Two-tab interface (Main, Stream) works smoothly
- [ ] User can see available serial ports
- [ ] User can connect to Marlin controller
- [ ] User can select G-code file
- [ ] User can start streaming
- [ ] Progress bar updates in real-time
- [ ] Current command displays in real-time
- [ ] Log shows all commands being sent
- [ ] Stream completes successfully
- [ ] User can disconnect
- [ ] Errors display in log with helpful messages
- [ ] Main tab functionality unchanged
- [ ] MVP is demo-ready

---

## Phase 2: Settings Tab (4 days)

**Goal:** Add functional Settings tab with persistent preferences

**Tasks:**

- [ ] 2.1 - Add Settings tab to TabBar (now 3 tabs: Main, Stream, Settings)
- [ ] 2.2 - Create settingsStore (Zustand) with streaming/general/export sections
- [ ] 2.3 - Create SettingsTab component with single-panel layout
- [ ] 2.4 - Create GeneralSettings component (autoSaveInterval, recentFilesLimit)
- [ ] 2.5 - Create StreamingSettings component (defaultBaudRate, defaultTimeout, verboseLogging)
- [ ] 2.6 - Create ExportSettings component (defaultNamingPattern placeholder)
- [ ] 2.7 - Add Tauri command: load_settings (read from app_data/settings.json)
- [ ] 2.8 - Add Tauri command: save_settings (write to app_data/settings.json)
- [ ] 2.9 - Implement default settings constant in Rust
- [ ] 2.10 - Add form validation (e.g., baud rate must be positive)
- [ ] 2.11 - Add "Save Settings" button
- [ ] 2.12 - Add "Reset to Defaults" button with confirmation
- [ ] 2.13 - Wire settings to streamStore defaults
- [ ] 2.14 - Add loading state while fetching settings
- [ ] 2.15 - Add error handling for read/write failures
- [ ] 2.16 - Create CSS for settings forms (form-control, form-section, form-actions)
- [ ] 2.17 - Test: Settings persist across app restarts
- [ ] 2.18 - Test: Baud rate setting affects new connections
- [ ] 2.17 - Test: Reset to defaults works correctly
- [ ] 2.18 - Test: Validation prevents invalid values

**Files to Create:**

- `src/state/settingsStore.ts`
- `src/components/tabs/SettingsTab.tsx`
- `src/components/settings/GeneralSettings.tsx`
- `src/components/settings/StreamingSettings.tsx`
- `src/components/settings/ExportSettings.tsx`
- `src/styles/settings.css`

**Files to Modify:**

- `src/components/TabBar.tsx` (add Settings tab)
- `src-tauri/src/main.rs` (add load_settings, save_settings commands)
- `src-tauri/Cargo.toml` (add serde_json dependency if missing)

**Definition of Done:**

- [ ] Settings tab renders correctly
- [ ] Settings persist across app restarts
- [ ] Settings apply to streaming functionality
- [ ] Validation works for all fields
- [ ] Reset to defaults works
- [ ] Error messages are helpful

---

## Phase 3: Enhanced Marlin Tab (3 days)

**Goal:** Add advanced controls and 3-panel layout to Stream tab

**Tasks:**

- [ ] 3.1 - Refactor StreamTab to 3-panel layout (controls | log | visualization)
- [ ] 3.2 - Create CommandInput component for manual G-code entry
- [ ] 3.3 - Add common command buttons (Home, Get Position, etc.)
- [ ] 3.4 - Implement manual command sending (uses send_command)
- [ ] 3.5 - Add command history (up/down arrows to recall)
- [ ] 3.6 - Create StreamVisualization component (center panel placeholder)
- [ ] 3.7 - Add "Coming Soon" message to visualization panel
- [ ] 3.8 - Add baud rate selector (115200, 250000 options)
- [ ] 3.9 - Add timeout setting input
- [ ] 3.10 - Add verbose logging checkbox
- [ ] 3.11 - Update CSS for 3-panel layout
- [ ] 3.12 - Test: 3-panel layout is responsive
- [ ] 3.13 - Test: Manual commands work correctly
- [ ] 3.14 - Test: Command history recalls previous commands
- [ ] 3.15 - Test: Common command buttons send correct G-code

**Files to Create:**

- `src/components/stream/CommandInput.tsx`
- `src/components/stream/StreamVisualization.tsx`

**Files to Modify:**

- `src/components/tabs/StreamTab.tsx` (refactor to 3-panel layout)
- `src/components/stream/StreamLog.tsx` (add manual command display)
- `src/state/streamStore.ts` (add command history)
- `src/styles/stream.css` (3-panel layout styles)

**Definition of Done:**

- [ ] 3-panel layout renders correctly
- [ ] Manual commands can be sent
- [ ] Command history works
- [ ] Common command buttons work
- [ ] Layout is responsive

---

## Phase 4: Connection Features & Commands (3 days)

**Goal:** Add command input UI and common command buttons for interactive control

**Tasks:**

### Day 1: Command Input UI

- [ ] 4.1 - Add Tauri command: `marlin_send_command` (sends single G-code command)
- [ ] 4.2 - Update streamStore with sendCommand action
- [ ] 4.3 - Wire CommandInput component to marlin_send_command
- [ ] 4.4 - Add keyboard shortcut (Enter to send)
- [ ] 4.5 - Display command responses in StreamLog
- [ ] 4.6 - Clear input after sending command
- [ ] 4.7 - Add loading indicator during command execution
- [ ] 4.8 - Add error handling for failed commands

### Day 2: Common Commands & Features

- [ ] 4.9 - Wire common command buttons to marlin_send_command
- [ ] 4.10 - Add tooltips to command buttons
- [ ] 4.11 - Add loading states to buttons
- [ ] 4.12 - Add command confirmation for dangerous commands (M112)
- [ ] 4.13 - Create command response parser (extract coordinates from M114)
- [ ] 4.14 - Display parsed data in UI (current position badge)
- [ ] 4.15 - Add "Copy Log" button (clipboard API)

### Day 3: Connection Management & Testing

- [ ] 4.16 - Add connection timeout detection (show warning after N seconds idle)
- [ ] 4.17 - Add reconnect button (visible after disconnect/error)
- [ ] 4.18 - Add connection status details (port, baud rate display)
- [ ] 4.19 - Test: Send commands while streaming (should queue or reject)
- [ ] 4.20 - Test: Connection persists between operations
- [ ] 4.21 - Test: Reconnect after error works correctly
- [ ] 4.22 - Test: All common commands work with real hardware
- [ ] 4.23 - Test: Error messages are clear and actionable

**Files to Create:**

- None (uses components from Phase 3)

**Files to Modify:**

- `src-tauri/src/main.rs` (add marlin_send_command)
- `src/components/stream/CommandInput.tsx` (wire to backend)
- `src/components/stream/StreamLog.tsx` (add copy button)
- `src/state/streamStore.ts` (add sendCommand action)

**Definition of Done:**

- [ ] Manual commands can be sent
- [ ] Common command buttons work
- [ ] Command responses display correctly
- [ ] Connection management is robust
- [ ] All features tested with hardware

---

## Phase 5: Pause/Resume & Statistics (3 days)

**Tasks:**

### Day 1: Pause/Resume Backend

- [ ] 5.1 - Add pause() method to MarlinStreamer (Python)
- [ ] 5.2 - Add resume() method to MarlinStreamer (Python)
- [ ] 5.3 - Add is_paused property to query pause state
- [ ] 5.4 - Update iter_stream() to check pause state
- [ ] 5.5 - Add `pause` action to interactive.py
- [ ] 5.6 - Add `resume` action to interactive.py
- [ ] 5.7 - Create Tauri command: marlin_pause
- [ ] 5.8 - Create Tauri command: marlin_resume
- [ ] 5.9 - Emit `stream-paused` event
- [ ] 5.10 - Emit `stream-resumed` event

### Day 2: Pause/Resume UI & Statistics

- [ ] 5.11 - Add Pause button to StreamControls (enabled during streaming)
- [ ] 5.12 - Add Resume button (enabled when paused)
- [ ] 5.13 - Update connection status indicator (add "Paused" state)
- [ ] 5.14 - Wire Pause button to marlin_pause
- [ ] 5.15 - Wire Resume button to marlin_resume
- [ ] 5.16 - Calculate ETA based on progress rate
- [ ] 5.17 - Add StreamStatistics.tsx component
- [ ] 5.18 - Display: progress %, commands sent/total, elapsed time, ETA
- [ ] 5.19 - Update statistics in real-time
- [ ] 5.20 - Reset statistics on stream start

### Day 3: Enhanced Logging & Polish

- [ ] 5.21 - Add timestamps to log messages
- [ ] 5.22 - Add log filtering (show all, errors only, commands only)
- [ ] 5.23 - Add "Export Log" button (save to .txt file)
- [ ] 5.24 - Add "Clear Log" button
- [ ] 5.25 - Test: Pause during large stream
- [ ] 5.26 - Test: Resume after pause
- [ ] 5.27 - Test: Multiple pause/resume cycles
- [ ] 5.28 - Test: Statistics accuracy with real hardware

**Files to Create:**

- `src/components/stream/StreamStatistics.tsx`

**Files to Modify:**

- `fiberpath/execution/marlin.py` (add pause/resume methods)
- `fiberpath_cli/interactive.py` (add pause/resume actions)
- `src-tauri/src/main.rs` (add pause/resume commands)
- `src/state/streamStore.ts` (add pause/resume state, statistics)
- `src/components/stream/StreamControls.tsx` (add pause/resume buttons)
- `src/components/stream/StreamLog.tsx` (add filtering, timestamps, export)
- `src/components/tabs/StreamTab.tsx` (add StreamStatistics)

**Definition of Done:**

- [ ] User can pause streaming at any point
- [ ] User can resume from paused state
- [ ] Statistics display accurately during stream
- [ ] Log filtering works correctly
- [ ] Log export creates valid file

---

## Phase 6: Stream Visualization (5 days)

**Goal:** Display live toolpath visualization during streaming

**Tasks:**

### Day 1: Three.js Setup

- [ ] 6.1 - Add three.js and @react-three/fiber dependencies
- [ ] 6.2 - Update StreamVisualization.tsx component (replace "Coming Soon")
- [ ] 6.3 - Set up Canvas with camera, lights, controls
- [ ] 6.4 - Add coordinate axes helper (X=red, Y=green, Z=blue)
- [ ] 6.5 - Add grid helper (build plate)
- [ ] 6.6 - Configure OrbitControls
- [ ] 6.7 - Test basic 3D scene renders
- [ ] 6.8 - Add responsive sizing
- [ ] 6.9 - Add dark/light theme support
- [ ] 6.10 - Verify integration in StreamTab center panel

### Day 2: G-code Parsing

- [ ] 6.11 - Create gcode-parser.ts utility
- [ ] 6.12 - Parse G0/G1 movement commands (X, Y, Z, E)
- [ ] 6.13 - Handle absolute vs relative positioning (G90/G91)
- [ ] 6.14 - Track current position state
- [ ] 6.15 - Generate line segments from G-code
- [ ] 6.16 - Add unit tests for parser
- [ ] 6.17 - Handle edge cases (missing coordinates, comments)
- [ ] 6.18 - Optimize for large files (chunked parsing)

### Day 3: Toolpath Rendering

- [ ] 6.19 - Create Toolpath.tsx component
- [ ] 6.20 - Render line segments as BufferGeometry
- [ ] 6.21 - Color-code by move type (travel=red, extrude=blue)
- [ ] 6.22 - Add thickness to lines (LineBasicMaterial)
- [ ] 6.23 - Optimize rendering (instancing for large paths)
- [ ] 6.24 - Add bounding box calculation
- [ ] 6.25 - Auto-fit camera to toolpath bounds
- [ ] 6.26 - Test with small file (100-500 commands)
- [ ] 6.27 - Test with large file (10,000+ commands)

### Day 4: Live Progress Indicator

- [ ] 6.28 - Add current position marker (sphere/cone)
- [ ] 6.29 - Update marker position during streaming
- [ ] 6.30 - Highlight current line segment
- [ ] 6.31 - Fade completed segments (opacity 0.3)
- [ ] 6.32 - Keep upcoming segments at full opacity
- [ ] 6.33 - Smooth marker animation (interpolation)
- [ ] 6.34 - Test synchronization with actual stream progress

### Day 5: Visualization Controls & Polish

- [ ] 6.35 - Add "Show/Hide Visualization" toggle
- [ ] 6.36 - Add "Reset Camera" button
- [ ] 6.37 - Add layer slider (show specific layers)
- [ ] 6.38 - Add move type filter (show travel, extrude, or both)
- [ ] 6.39 - Add speed indicator (color by feedrate)
- [ ] 6.40 - Save visualization preferences
- [ ] 6.41 - Add loading indicator for large files
- [ ] 6.42 - Optimize performance (60fps target)
- [ ] 6.43 - Add tooltips for controls
- [ ] 6.44 - Improve visual styling
- [ ] 6.45 - Test with various G-code files
- [ ] 6.46 - Test performance with very large files (50k+ commands)
- [ ] 6.47 - Add error handling for invalid G-code
- [ ] 6.48 - Add fallback UI if WebGL not supported

**Files to Create:**

- `src/components/stream/Toolpath.tsx`
- `src/lib/gcode-parser.ts`
- `src/lib/gcode-parser.test.ts`

**Files to Modify:**

- `package.json` (add three, @react-three/fiber, @react-three/drei)
- `src/components/stream/StreamVisualization.tsx` (replace placeholder)
- `src/components/tabs/StreamTab.tsx` (wire visualization state)
- `src/state/streamStore.ts` (add visualization state)

**Definition of Done:**

- [ ] Toolpath displays correctly for various G-code files
- [ ] Live progress indicator updates during streaming
- [ ] Visualization controls work smoothly
- [ ] Performance is acceptable (60fps, <2s load for 10k commands)
- [ ] Visualization enhances UX (not just eye candy)

---

## Phase 7: Polish & Documentation (4 days)

**Goal:** Final polish, comprehensive testing, documentation

**Tasks:**

### Day 1: UI/UX Polish

- [ ] 7.1 - Review all components for consistent styling
- [ ] 7.2 - Add loading states for all async operations
- [ ] 7.3 - Improve error messages (user-friendly, actionable)
- [ ] 7.4 - Add keyboard shortcuts documentation
- [ ] 7.5 - Improve accessibility (ARIA labels, keyboard nav)
- [ ] 7.6 - Add tooltips/help text for complex controls
- [ ] 7.7 - Optimize bundle size (check for unused deps)
- [ ] 7.8 - Add app icon and branding
- [ ] 7.9 - Test on Windows/macOS/Linux
- [ ] 7.10 - Fix any platform-specific issues

### Day 2: Comprehensive Testing

- [ ] 7.11 - Test all tab navigation paths
- [ ] 7.12 - Test all settings combinations
- [ ] 7.13 - Test Marlin connection edge cases
- [ ] 7.14 - Test streaming with various file sizes
- [ ] 7.15 - Test pause/resume thoroughly
- [ ] 7.16 - Test error recovery scenarios
- [ ] 7.17 - Test visualization with different G-code
- [ ] 7.18 - Load test (10+ consecutive operations)
- [ ] 7.19 - Memory leak testing (dev tools)
- [ ] 7.20 - Performance profiling

### Day 3: Documentation

- [ ] 7.21 - Update GUI README with features
- [ ] 7.22 - Add "Getting Started" guide
- [ ] 7.23 - Document Marlin streaming workflow
- [ ] 7.24 - Document settings and their effects
- [ ] 7.25 - Add troubleshooting section
- [ ] 7.26 - Add screenshots/GIFs of features
- [ ] 7.27 - Update main project README
- [ ] 7.28 - Add CHANGELOG entry for v4.0

### Day 4: Bug Fixes & Release

- [ ] 7.29 - Fix any bugs found during testing
- [ ] 7.30 - Address user feedback (if beta testing)
- [ ] 7.31 - Optimize performance bottlenecks
- [ ] 7.32 - Improve error handling where needed
- [ ] 7.33 - Refactor any messy code
- [ ] 7.34 - Add remaining unit tests
- [ ] 7.35 - Bump version to 4.0.0 in all files
- [ ] 7.36 - Update tauri.conf.json with new features
- [ ] 7.37 - Test installers on all platforms
- [ ] 7.38 - Prepare release notes
- [ ] 7.39 - Create release tag
- [ ] 7.40 - Deploy to GitHub releases

**Files to Create:**

- `fiberpath_gui/docs/GETTING_STARTED.md`
- `fiberpath_gui/docs/MARLIN_STREAMING.md`
- `fiberpath_gui/docs/TROUBLESHOOTING.md`

**Files to Modify:**

- `README.md` (update with v4 features)
- `fiberpath_gui/README.md` (comprehensive update)
- `CHANGELOG.md` (add v4.0.0 entry)
- `pyproject.toml` (bump version)
- `fiberpath_gui/package.json` (bump version)
- `fiberpath_gui/src-tauri/Cargo.toml` (bump version)
- `fiberpath_gui/src-tauri/tauri.conf.json` (bump version)

**Definition of Done:**

- [ ] All features working on all platforms
- [ ] No critical bugs or performance issues
- [ ] Documentation complete and accurate
- [ ] Release installers tested
- [ ] Version 4.0.0 ready for release

---

## Progress Tracking

**Overall:** 0/7 phases complete (0%)

| Phase                     | Tasks | Days | Complete | Progress | Status         |
| ------------------------- | ----- | ---- | -------- | -------- | -------------- |
| 1 - Streaming MVP         | 65    | 5    | 0        | 0%       | 🔵 Not Started |
| 2 - Settings Tab          | 18    | 4    | 0        | 0%       | 🔵 Not Started |
| 3 - Enhanced Marlin       | 15    | 3    | 0        | 0%       | 🔵 Not Started |
| 4 - Connection & Commands | 23    | 3    | 0        | 0%       | 🔵 Not Started |
| 5 - Pause/Resume          | 28    | 3    | 0        | 0%       | 🔵 Not Started |
| 6 - Visualization         | 48    | 5    | 0        | 0%       | 🔵 Not Started |
| 7 - Polish & Docs         | 40    | 4    | 0        | 0%       | 🔵 Not Started |

**Total Tasks:** 237  
**Completed:** 0  
**Remaining:** 237

**Total Duration:** 27 days (~4 weeks)

**MVP Checkpoint:** Phase 1 complete = basic streaming functional (5 days)  
**Full Feature:** Phase 5 complete = all streaming features (18 days)  
**Release Ready:** Phase 7 complete = polished & documented (27 days)

---

## Notes

See [TABS_PLANNING.md](planning/TABS_PLANNING.md) for:

- Comprehensive design rationale
- Architecture decisions and trade-offs
- Risk analysis and mitigation strategies
- Detailed component specifications
- Success criteria for each phase

See [ARCHITECTURE_DECISION_MARLIN.md](planning/ARCHITECTURE_DECISION_MARLIN.md) for:

- Analysis of current MarlinStreamer limitations
- Decision rationale for Python refactor approach
- Implementation details and API changes
- Comparison with alternative approaches (Rust native)

**Last Updated:** 2026-01-08
| 5 - Rust Marlin (MVP) | 70 | 0 | 0% | 🔵 Not Started |
| 6 - Enhanced Connect | 20 | 0 | 0% | 🔵 Not Started |
| 7 - Pause/Resume | 25 | 0 | 0% | 🔵 Not Started |
| 8 - Visualization | 50 | 0 | 0% | 🔵 Not Started |
| 9 - Polish & Docs | 40 | 0 | 0% | 🔵 Not Started |

**Total Tasks:** 272  
**Completed:** 0  
**Remaining:** 272

**MVP Checkpoint:** Phase 5 complete = core streaming functional (19 days)  
**Full Feature:** Phase 7 complete = all streaming features (26 days)  
**Release Ready:** Phase 9 complete = polished & documented (37 days)

---

## Notes

See [TABS_PLANNING.md](planning/TABS_PLANNING.md) for:

- Comprehensive design rationale
- Architecture decisions and trade-offs
- Risk analysis and mitigation strategies
- Detailed component specifications
- Success criteria for each phase

See [ARCHITECTURE_DECISION_MARLIN.md](planning/ARCHITECTURE_DECISION_MARLIN.md) for:

- Critical analysis of Python MarlinStreamer limitations
- Decision rationale for Rust native implementation
- Code examples and implementation guide

**Last Updated:** 2026-01-08
