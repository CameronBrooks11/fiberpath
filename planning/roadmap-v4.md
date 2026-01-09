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

1. **Tab Navigation Foundation** - Basic tab structure (3 days)
2. **Settings Tab** - Configuration UI (4 days)
3. **Marlin Tab UI** - Stream interface layout (4 days)
4. **Serial Port Discovery** - Dynamic port detection (3 days)
5. **Python MarlinStreamer Refactor (MVP)** - Connection-centric backend (3 days)
6. **Connection Features & Commands** - Interactive control (3 days)
7. **Pause/Resume & Statistics** - Enhanced streaming (3 days)
8. **Stream Visualization** - Visual progress (5 days)
9. **Polish & Documentation** - Production ready (4 days)

**MVP Target:** Phases 1-5 (17 days, ~2.5 weeks) - Core streaming working  
**Full Feature:** Phases 1-7 (23 days, ~3.5 weeks) - All features complete  
**Release Ready:** Phases 1-9 (32 days, ~5 weeks) - Polished and documented

**Key Architectural Decision:** Python backend refactor (not Rust reimplementation):

- ✅ **Core stays Python** - accessible to more developers
- ✅ **No code duplication** - GUI reuses same MarlinStreamer as CLI
- ✅ **Simple refactor** - ~30 lines in marlin.py, ~150 lines Tauri glue
- ✅ **Backwards compatible** - CLI unchanged
- ✅ **Connection-centric** - connect → send commands → stream → disconnect

---

## Phase 1: Tab Navigation Foundation (3 days)

**Goal:** Add tab structure without breaking existing functionality

**Tasks:**

- [ ] 1.1 - Refactor MainLayout to accept tabBar and flexible content props
- [ ] 1.2 - Create TabBar component with 3 tabs (Main, Marlin, Settings)
- [ ] 1.3 - Add lucide-react icons to TabBar (FileCode, Radio, Settings)
- [ ] 1.4 - Extract existing workspace into MainTab component
- [ ] 1.5 - Add tab state management in App.tsx (useState<'main' | 'marlin' | 'settings'>)
- [ ] 1.6 - Implement conditional rendering based on active tab
- [ ] 1.7 - Create CSS for TabBar (pill button style, active state, hover effects)
- [ ] 1.8 - Add keyboard navigation (Alt+1/2/3 for tab switching)
- [ ] 1.9 - Test: Verify Main tab looks identical to current UI
- [ ] 1.10 - Test: Verify panel collapse/expand still works
- [ ] 1.11 - Test: Verify all existing MenuBar functionality works
- [ ] 1.12 - Test: Tab switching preserves component state

**Files to Create:**

- `src/components/TabBar.tsx`
- `src/components/tabs/MainTab.tsx`
- `src/styles/tabs.css`

**Files to Modify:**

- `src/layouts/MainLayout.tsx` (add tabBar prop, remove hardcoded workspace)
- `src/App.tsx` (add tab state, extract workspace to MainTab)

**Definition of Done:**

- [ ] All existing functionality works in Main tab
- [ ] Tab switching is smooth and responsive
- [ ] TabBar is styled consistently with rest of UI
- [ ] No visual regression in Main tab
- [ ] Keyboard shortcuts work

---

## Phase 2: Settings Tab Implementation (4 days)

**Goal:** Add functional Settings tab with persistent preferences

**Tasks:**

- [ ] 2.1 - Create settingsStore (Zustand) with streaming/general/export sections
- [ ] 2.2 - Create SettingsTab component with single-panel layout
- [ ] 2.3 - Create GeneralSettings component (autoSaveInterval, recentFilesLimit)
- [ ] 2.4 - Create StreamingSettings component (defaultBaudRate, defaultTimeout, verboseLogging)
- [ ] 2.5 - Create ExportSettings component (defaultNamingPattern placeholder)
- [ ] 2.6 - Add Tauri command: load_settings (read from app_data/settings.json)
- [ ] 2.7 - Add Tauri command: save_settings (write to app_data/settings.json)
- [ ] 2.8 - Implement default settings constant in Rust
- [ ] 2.9 - Add form validation (e.g., baud rate must be positive)
- [ ] 2.10 - Add "Save Settings" button
- [ ] 2.11 - Add "Reset to Defaults" button with confirmation
- [ ] 2.12 - Wire settings to streamStore defaults
- [ ] 2.13 - Add loading state while fetching settings
- [ ] 2.14 - Add error handling for read/write failures
- [ ] 2.15 - Create CSS for settings forms (form-control, form-section, form-actions)
- [ ] 2.16 - Test: Settings persist across app restarts
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

## Phase 3: Marlin Tab UI & State Setup (4 days)

**Goal:** Create Marlin tab structure (non-functional UI)

**Tasks:**

- [ ] 3.1 - Create streamStore (Zustand) with connection/streaming/progress/log state
- [ ] 3.2 - Create MarlinTab component with 3-panel layout
- [ ] 3.3 - Create StreamControls component (left panel)
- [ ] 3.4 - Add port selector dropdown (static options for now)
- [ ] 3.5 - Add connection settings form (baud rate, timeout inputs)
- [ ] 3.6 - Add file picker button (disabled, mock UI)
- [ ] 3.7 - Add Connect button (disabled, mock)
- [ ] 3.8 - Add stream control buttons (Start, Pause, Resume, Stop - all disabled)
- [ ] 3.9 - Create StreamLog component (right panel)
- [ ] 3.10 - Add connection status badge (Disconnected/Connected/Streaming)
- [ ] 3.11 - Add progress bar component (static 0%)
- [ ] 3.12 - Add current command display area (empty)
- [ ] 3.13 - Add scrollable log area with placeholder messages
- [ ] 3.14 - Create StreamVisualization component (center panel placeholder)
- [ ] 3.15 - Add "Coming Soon" message to visualization panel
- [ ] 3.16 - Create CSS for streaming UI (control panels, log, status badges)
- [ ] 3.17 - Test: Marlin tab renders correctly
- [ ] 3.18 - Test: Layout is responsive
- [ ] 3.19 - Test: Forms are functional (values change, no backend calls yet)

**Files to Create:**

- `src/state/streamStore.ts`
- `src/components/tabs/MarlinTab.tsx`
- `src/components/stream/StreamControls.tsx`
- `src/components/stream/StreamLog.tsx`
- `src/components/stream/StreamVisualization.tsx`
- `src/styles/stream.css`

**Files to Modify:**

- None (pure frontend work)

**Definition of Done:**

- [ ] Marlin tab renders without errors
- [ ] All UI components are styled
- [ ] Forms accept input (but don't do anything)
- [ ] Layout matches design from TABS_PLANNING.md
- [ ] Responsive on different screen sizes

---

## Phase 4: Serial Port Discovery (3 days)

**Goal:** Enable dynamic serial port detection

**Tasks:**

- [ ] 4.1 - Add serialport Rust crate to Cargo.toml
- [ ] 4.2 - Create PortInfo struct in Rust (name, description, port_type)
- [ ] 4.3 - Implement list_serial_ports Tauri command
- [ ] 4.4 - Add error handling for port enumeration failures
- [ ] 4.5 - Create PortSelector component with dropdown + refresh button
- [ ] 4.6 - Integrate PortSelector into StreamControls
- [ ] 4.7 - Add loading spinner while scanning ports
- [ ] 4.8 - Display port name + description in dropdown
- [ ] 4.9 - Add "Refresh Ports" button with icon
- [ ] 4.10 - Handle empty port list gracefully (show message)
- [ ] 4.11 - Handle permission errors (show helpful message)
- [ ] 4.12 - Update streamStore with selected port
- [ ] 4.13 - Add auto-refresh on tab focus (optional)
- [ ] 4.14 - Test: Port list populates on Windows
- [ ] 4.15 - Test: Port list populates on macOS (if available)
- [ ] 4.16 - Test: Port list populates on Linux (if available)
- [ ] 4.17 - Test: Refresh button updates list correctly
- [ ] 4.18 - Test: Error states display correctly

**Files to Create:**

- `src/components/stream/PortSelector.tsx`
- `src/types/serial.ts` (TypeScript types for PortInfo)

**Files to Modify:**

- `src-tauri/Cargo.toml` (add serialport dependency)
- `src-tauri/src/main.rs` (add list_serial_ports command)
- `src/components/stream/StreamControls.tsx` (integrate PortSelector)
- `src/state/streamStore.ts` (add port selection state)

**Definition of Done:**

- [ ] Ports are detected on all platforms
- [ ] Dropdown shows port names and descriptions
- [ ] Refresh button works
- [ ] Errors are handled gracefully
- [ ] UI is responsive and intuitive

---

## Phase 5: Python MarlinStreamer Refactor (MVP) (3 days)

**Goal:** Refactor MarlinStreamer for connection-centric workflow and add interactive CLI mode

**CRITICAL:** This phase enables GUI integration by making MarlinStreamer connection-centric. See [ARCHITECTURE_DECISION_MARLIN.md](planning/ARCHITECTURE_DECISION_MARLIN.md) for rationale.

**Tasks:**

### Python Backend Refactor (Day 1)

- [ ] 5.1 - Make `_send_command()` public: rename to `send_command()`
- [ ] 5.2 - Update `send_command()` to return list of response lines (for GUI display)
- [ ] 5.3 - Add `connect()` method - explicitly connect without streaming
- [ ] 5.4 - Add `is_connected` property to query connection state
- [ ] 5.5 - Make `_ensure_connection()` idempotent (safe to call multiple times)
- [ ] 5.6 - Update `iter_stream()` to work without pre-loaded program (backwards compatible)
- [ ] 5.7 - Add `disconnect()` as alias for `close()` (clearer API)
- [ ] 5.8 - Write unit tests for new connection-centric workflow
- [ ] 5.9 - Test backwards compatibility: existing CLI still works

### Interactive CLI Mode (Day 1-2)

- [ ] 5.10 - Create `fiberpath_cli/interactive.py` module
- [ ] 5.11 - Add JSON stdin/stdout protocol handler
- [ ] 5.12 - Implement `connect` action: `{"action": "connect", "port": "...", "baud": 115200}`
- [ ] 5.13 - Implement `send` action: `{"action": "send", "gcode": "G28"}`
- [ ] 5.14 - Implement `stream` action: `{"action": "stream", "file": "path.gcode"}`
- [ ] 5.15 - Implement `disconnect` action
- [ ] 5.16 - Add error responses: `{"status": "error", "message": "..."}`
- [ ] 5.17 - Add progress events during streaming: `{"status": "progress", ...}`
- [ ] 5.18 - Add `interactive` command to CLI entry point
- [ ] 5.19 - Test interactive mode with manual JSON input

### Tauri Backend Integration (Day 2-3)

- [ ] 5.20 - Create Tauri command: `marlin_start_interactive` (spawn Python subprocess)
- [ ] 5.21 - Store subprocess handle in Tauri state
- [ ] 5.22 - Implement stdin writer (send JSON commands)
- [ ] 5.23 - Implement stdout reader thread (parse JSON responses)
- [ ] 5.24 - Create Tauri command: `marlin_connect` (send connect action via stdin)
- [ ] 5.25 - Create Tauri command: `marlin_disconnect`
- [ ] 5.26 - Create Tauri command: `marlin_send_command`
- [ ] 5.27 - Create Tauri command: `marlin_stream_file`
- [ ] 5.28 - Emit `stream-progress` events to frontend
- [ ] 5.29 - Emit `stream-complete` / `stream-error` events
- [ ] 5.30 - Add error handling for subprocess crashes
- [ ] 5.31 - Add cleanup on disconnect (kill subprocess if needed)

### Frontend Integration (Day 3)

- [ ] 5.32 - Update streamStore with connection actions
- [ ] 5.33 - Add `connect()` action calling `marlin_connect`
- [ ] 5.34 - Add `disconnect()` action calling `marlin_disconnect`
- [ ] 5.35 - Add `sendCommand()` action calling `marlin_send_command`
- [ ] 5.36 - Add `startStream()` action calling `marlin_stream_file`
- [ ] 5.37 - Wire up Connect button to `connect()` action
- [ ] 5.38 - Wire up Disconnect button to `disconnect()` action
- [ ] 5.39 - Wire up "Select File" button (Tauri file dialog)
- [ ] 5.40 - Wire up "Start Stream" button to `startStream()` action
- [ ] 5.41 - Enable/disable buttons based on connection state
- [ ] 5.42 - Listen to `stream-progress` events
- [ ] 5.43 - Update StreamLog progress bar in real-time
- [ ] 5.44 - Update StreamLog current command display
- [ ] 5.45 - Append commands/responses to log
- [ ] 5.46 - Auto-scroll log to bottom

### Error Handling & Testing (Day 3)

- [ ] 5.47 - Handle connection errors (port not found, permission denied)
- [ ] 5.48 - Handle Marlin errors (error responses from controller)
- [ ] 5.49 - Handle timeout errors with helpful messages
- [ ] 5.50 - Handle subprocess crash (Python process dies)
- [ ] 5.51 - Add retry logic for transient errors
- [ ] 5.52 - Test: Connect to real Marlin (if hardware available)
- [ ] 5.53 - Test: Send single commands (G28, M114)
- [ ] 5.54 - Test: Stream small G-code file (<100 commands)
- [ ] 5.55 - Test: Stream large G-code file (>1000 commands)
- [ ] 5.56 - Test: Error handling (wrong port, wrong baud rate)
- [ ] 5.57 - Test: Connection lifecycle (connect → commands → disconnect → reconnect)

**Files to Create:**

- `fiberpath_cli/interactive.py` (~100 lines)
- `src/lib/streaming.ts` (TypeScript types)

**Files to Modify:**

- `fiberpath/execution/marlin.py` (~30 lines of changes)
- `fiberpath_cli/main.py` (add `interactive` command)
- `src-tauri/src/main.rs` (~150 lines for subprocess management)
- `src/state/streamStore.ts` (add connection state, actions)
- `src/components/stream/StreamControls.tsx` (wire up buttons)
- `src/components/stream/StreamLog.tsx` (real-time updates)

**Definition of Done:**

- [ ] User can connect to Marlin from GUI
- [ ] Connection status displays correctly
- [ ] User can select and stream G-code file
- [ ] Progress updates in real-time
- [ ] User can stop streaming mid-way
- [ ] Single commands work (G28, M114, etc.)
- [ ] Errors display helpful messages
- [ ] Connection persists between operations
- [ ] No subprocess overhead - native performance
- [ ] MVP feature is complete and demo-ready

---

**Definition of Done:**

- [ ] User can connect to Marlin from GUI
- [ ] Connection status displays correctly
- [ ] User can send single commands (G28, M114, etc.)
- [ ] User can select and stream G-code file
- [ ] Progress updates in real-time
- [ ] User can disconnect cleanly
- [ ] Errors display helpful messages
- [ ] Python CLI unchanged (backwards compatible)
- [ ] MVP feature is complete and demo-ready

---

## Phase 6: Connection Features & Commands (3 days)

**Goal:** Add command input UI and common command buttons for interactive control.

### Tasks:

**Day 1: Command Input UI (8 tasks)**

- [ ] 6.1 - Create CommandInput.tsx component with text input
- [ ] 6.2 - Add "Send" button that calls marlin_send_command
- [ ] 6.3 - Display command responses in StreamLog
- [ ] 6.4 - Add keyboard shortcut (Enter to send)
- [ ] 6.5 - Disable input when disconnected
- [ ] 6.6 - Clear input after sending command
- [ ] 6.7 - Add loading indicator during command execution
- [ ] 6.8 - Add error handling for failed commands

**Day 2: Common Commands (7 tasks)**

- [ ] 6.9 - Create CommonCommands.tsx with button grid
- [ ] 6.10 - Add "Home All" button (G28)
- [ ] 6.11 - Add "Get Position" button (M114)
- [ ] 6.12 - Add "Disable Motors" button (M84)
- [ ] 6.13 - Add "Emergency Stop" button (M112)
- [ ] 6.14 - Style buttons with appropriate colors/icons
- [ ] 6.15 - Wire buttons to marlin_send_command

**Day 3: Command History & Polish (5 tasks)**

- [ ] 6.16 - Add command history to streamStore (last 50 commands)
- [ ] 6.17 - Add up/down arrow navigation in CommandInput
- [ ] 6.18 - Add "Clear History" button
- [ ] 6.19 - Persist command history to localStorage
- [ ] 6.20 - Add command autocomplete (optional enhancement)

**Files to Create:**

- `src/components/stream/CommandInput.tsx`
- `src/components/stream/CommonCommands.tsx`

**Files to Modify:**

- `src/state/streamStore.ts` (add command history)
- `src/components/stream/StreamTab.tsx` (add CommandInput, CommonCommands)
- `src/components/stream/StreamLog.tsx` (display command responses)

**Definition of Done:**

- [ ] User can type and send G-code commands
- [ ] Common commands available as buttons
- [ ] Command history works with arrow keys
- [ ] Responses display in log
- [ ] Commands disabled when not connected

---

## Phase 7: Pause/Resume & Statistics (3 days)

**Goal:** Add pause/resume capability and streaming statistics.

### Tasks:

**Day 1: Pause/Resume Backend (6 tasks)**

- [ ] 7.1 - Update Python interactive mode: add `pause` action
- [ ] 7.2 - Update Python interactive mode: add `resume` action
- [ ] 7.3 - Use existing MarlinStreamer `pause()` / `resume()` methods
- [ ] 7.4 - Add Tauri command: `marlin_pause` (send pause action to subprocess)
- [ ] 7.5 - Add Tauri command: `marlin_resume` (send resume action)
- [ ] 7.6 - Test pause/resume with Python CLI directly

**Day 2: Pause/Resume Frontend (7 tasks)**

- [ ] 7.9 - Add pause/resume state to streamStore
- [ ] 7.10 - Add pauseStream action
- [ ] 7.11 - Add resumeStream action
- [ ] 7.12 - Add "Pause" button to StreamControls (enabled during streaming)
- [ ] 7.13 - Add "Resume" button (enabled when paused)
- [ ] 7.14 - Update StreamLog to show pause status
- [ ] 7.15 - Test pause/resume workflow end-to-end

**Day 3: Streaming Statistics (7 tasks)**

- [ ] 7.15 - Add statistics to streamStore (start time, elapsed, ETA)
- [ ] 7.16 - Calculate ETA based on progress rate
- [ ] 7.17 - Add StreamStatistics.tsx component
- [ ] 7.18 - Display: progress %, commands sent/total, elapsed time, ETA
- [ ] 7.19 - Update statistics in real-time
- [ ] 7.20 - Reset statistics on stream start
- [ ] 7.21 - Add log filtering (show all, errors only, commands only)

**Files to Create:**

- `src/components/stream/StreamStatistics.tsx`

**Files to Modify:**

- `fiberpath_cli/interactive.py` (add pause/resume actions)
- `src-tauri/src/main.rs` (add pause/resume commands)
- `src/state/streamStore.ts` (add pause/resume state, statistics)
- `src/components/stream/StreamControls.tsx` (add pause/resume buttons)
- `src/components/stream/StreamLog.tsx` (add filtering, timestamps)
- `src/components/stream/StreamTab.tsx` (add StreamStatistics)

**Definition of Done:**

- [ ] User can pause streaming at any point
- [ ] User can resume from paused state
- [ ] Statistics display accurately during stream
- [ ] Log filtering works correctly
- [ ] Log export creates valid file

---

## Phase 8: Stream Visualization (6 days)

**Goal:** Display live toolpath visualization during streaming.

### Tasks:

**Day 1: Three.js Setup (10 tasks)**

- [ ] 8.1 - Add three.js and @react-three/fiber dependencies
- [ ] 8.2 - Create StreamVisualization.tsx component
- [ ] 8.3 - Set up Canvas with camera, lights, controls
- [ ] 8.4 - Add coordinate axes helper (X=red, Y=green, Z=blue)
- [ ] 8.5 - Add grid helper (build plate)
- [ ] 8.6 - Configure OrbitControls
- [ ] 8.7 - Test basic 3D scene renders
- [ ] 8.8 - Add responsive sizing
- [ ] 8.9 - Add dark/light theme support
- [ ] 8.10 - Integrate into StreamTab center panel

**Day 2: G-code Parsing (8 tasks)**

- [ ] 8.11 - Create gcode-parser.ts utility
- [ ] 8.12 - Parse G0/G1 movement commands (X, Y, Z, E)
- [ ] 8.13 - Handle absolute vs relative positioning (G90/G91)
- [ ] 8.14 - Track current position state
- [ ] 8.15 - Generate line segments from G-code
- [ ] 8.16 - Add unit tests for parser
- [ ] 8.17 - Handle edge cases (missing coordinates, comments)
- [ ] 8.18 - Optimize for large files (chunked parsing)

**Day 3: Toolpath Rendering (9 tasks)**

- [ ] 8.19 - Create Toolpath.tsx component
- [ ] 8.20 - Render line segments as BufferGeometry
- [ ] 8.21 - Color-code by move type (travel=red, extrude=blue)
- [ ] 8.22 - Add thickness to lines (LineBasicMaterial)
- [ ] 8.23 - Optimize rendering (instancing for large paths)
- [ ] 8.24 - Add bounding box calculation
- [ ] 8.25 - Auto-fit camera to toolpath bounds
- [ ] 8.26 - Test with small file (100-500 commands)
- [ ] 8.27 - Test with large file (10,000+ commands)

**Day 4: Live Progress Indicator (7 tasks)**

- [ ] 8.28 - Add current position marker (sphere/cone)
- [ ] 8.29 - Update marker position during streaming
- [ ] 8.30 - Highlight current line segment
- [ ] 8.31 - Fade completed segments (opacity 0.3)
- [ ] 8.32 - Keep upcoming segments at full opacity
- [ ] 8.33 - Smooth marker animation (interpolation)
- [ ] 8.34 - Test synchronization with actual stream progress

**Day 5: Visualization Controls (8 tasks)**

- [ ] 8.35 - Add "Show/Hide Visualization" toggle
- [ ] 8.36 - Add "Reset Camera" button
- [ ] 8.37 - Add layer slider (show specific layers)
- [ ] 8.38 - Add move type filter (show travel, extrude, or both)
- [ ] 8.39 - Add speed indicator (color by feedrate)
- [ ] 8.40 - Save visualization preferences
- [ ] 8.41 - Add loading indicator for large files
- [ ] 8.42 - Optimize performance (60fps target)

**Day 6: Polish & Testing (8 tasks)**

- [ ] 8.43 - Add tooltips for controls
- [ ] 8.44 - Improve visual styling
- [ ] 8.45 - Test with various G-code files
- [ ] 8.46 - Test performance with very large files (50k+ commands)
- [ ] 8.47 - Add error handling for invalid G-code
- [ ] 8.48 - Add fallback UI if WebGL not supported
- [ ] 8.49 - Write user documentation
- [ ] 8.50 - Create demo video

**Files to Create:**

- `src/components/stream/StreamVisualization.tsx`
- `src/components/stream/Toolpath.tsx`
- `src/lib/gcode-parser.ts`
- `src/lib/gcode-parser.test.ts`

**Files to Modify:**

- `package.json` (add three, @react-three/fiber, @react-three/drei)
- `src/components/stream/StreamTab.tsx` (integrate visualization)
- `src/state/streamStore.ts` (add visualization state)

**Definition of Done:**

- [ ] Toolpath displays correctly for various G-code files
- [ ] Live progress indicator updates during streaming
- [ ] Visualization controls work smoothly
- [ ] Performance is acceptable (60fps, <2s load for 10k commands)
- [ ] Visualization enhances UX (not just eye candy)

---

## Phase 9: Polish & Documentation (4 days)

**Goal:** Final polish, comprehensive testing, documentation.

### Tasks:

**Day 1: UI/UX Polish (10 tasks)**

- [ ] 9.1 - Review all components for consistent styling
- [ ] 9.2 - Add loading states for all async operations
- [ ] 9.3 - Improve error messages (user-friendly, actionable)
- [ ] 9.4 - Add keyboard shortcuts documentation
- [ ] 9.5 - Improve accessibility (ARIA labels, keyboard nav)
- [ ] 9.6 - Add tooltips/help text for complex controls
- [ ] 9.7 - Optimize bundle size (check for unused deps)
- [ ] 9.8 - Add app icon and branding
- [ ] 9.9 - Test on Windows/macOS/Linux
- [ ] 9.10 - Fix any platform-specific issues

**Day 2: Comprehensive Testing (10 tasks)**

- [ ] 9.11 - Test all tab navigation paths
- [ ] 9.12 - Test all settings combinations
- [ ] 9.13 - Test Marlin connection edge cases
- [ ] 9.14 - Test streaming with various file sizes
- [ ] 9.15 - Test pause/resume thoroughly
- [ ] 9.16 - Test error recovery scenarios
- [ ] 9.17 - Test visualization with different G-code
- [ ] 9.18 - Load test (10+ consecutive operations)
- [ ] 9.19 - Memory leak testing (dev tools)
- [ ] 9.20 - Performance profiling

**Day 3: Documentation (8 tasks)**

- [ ] 9.21 - Update GUI README with features
- [ ] 9.22 - Add "Getting Started" guide
- [ ] 9.23 - Document Marlin streaming workflow
- [ ] 9.24 - Document settings and their effects
- [ ] 9.25 - Add troubleshooting section
- [ ] 9.26 - Add screenshots/GIFs of features
- [ ] 9.27 - Update main project README
- [ ] 9.28 - Add CHANGELOG entry for v4.0

**Day 4: Bug Fixes & Refinements (6 tasks)**

- [ ] 9.29 - Fix any bugs found during testing
- [ ] 9.30 - Address user feedback (if beta testing)
- [ ] 9.31 - Optimize performance bottlenecks
- [ ] 9.32 - Improve error handling where needed
- [ ] 9.33 - Refactor any messy code
- [ ] 9.34 - Add remaining unit tests

**Day 5: Release Preparation (6 tasks)**

- [ ] 9.35 - Bump version to 4.0.0 in all files
- [ ] 9.36 - Update tauri.conf.json with new features
- [ ] 9.37 - Test installers on all platforms
- [ ] 9.38 - Prepare release notes
- [ ] 9.39 - Create release tag
- [ ] 9.40 - Deploy to GitHub releases

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

**Overall:** 0/9 phases complete (0%)

| Phase                     | Tasks | Complete | Progress | Status         |
| ------------------------- | ----- | -------- | -------- | -------------- |
| 1 - Tab Navigation        | 12    | 0        | 0%       | 🔵 Not Started |
| 2 - Settings Tab          | 18    | 0        | 0%       | 🔵 Not Started |
| 3 - Marlin Tab UI         | 19    | 0        | 0%       | 🔵 Not Started |
| 4 - Port Discovery        | 18    | 0        | 0%       | 🔵 Not Started |
| 5 - Python Refactor (MVP) | 57    | 0        | 0%       | 🔵 Not Started |
| 6 - Connection Features   | 20    | 0        | 0%       | 🔵 Not Started |
| 7 - Pause/Resume          | 21    | 0        | 0%       | 🔵 Not Started |
| 8 - Visualization         | 50    | 0        | 0%       | 🔵 Not Started |
| 9 - Polish & Docs         | 34    | 0        | 0%       | 🔵 Not Started |

**Total Tasks:** 249  
**Completed:** 0  
**Remaining:** 249

**MVP Checkpoint:** Phase 5 complete = core streaming functional (17 days)  
**Full Feature:** Phase 7 complete = all streaming features (23 days)  
**Release Ready:** Phase 9 complete = polished & documented (32 days)

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

---

## Progress Tracking

**Overall:** 0/9 phases complete (0%)

| Phase                 | Tasks | Complete | Progress | Status         |
| --------------------- | ----- | -------- | -------- | -------------- |
| 1 - Tab Navigation    | 12    | 0        | 0%       | 🔵 Not Started |
| 2 - Settings Tab      | 18    | 0        | 0%       | 🔵 Not Started |
| 3 - Marlin Tab UI     | 19    | 0        | 0%       | 🔵 Not Started |
| 4 - Port Discovery    | 18    | 0        | 0%       | 🔵 Not Started |
| 5 - Rust Marlin (MVP) | 70    | 0        | 0%       | 🔵 Not Started |
| 6 - Enhanced Connect  | 20    | 0        | 0%       | 🔵 Not Started |
| 7 - Pause/Resume      | 25    | 0        | 0%       | 🔵 Not Started |
| 8 - Visualization     | 50    | 0        | 0%       | 🔵 Not Started |
| 9 - Polish & Docs     | 40    | 0        | 0%       | 🔵 Not Started |

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
