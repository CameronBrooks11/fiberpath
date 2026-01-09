# FiberPath Roadmap v4 - Tabbed Interface & Marlin Streaming

**Focus:** Enable basic Marlin G-code streaming directly from the GUI  
**Timeline:** 2 weeks  
**Branch:** tabsgui

**Philosophy:** Ship minimal viable streaming FAST, then enhance based on user feedback

---

## Phase 1: Tab Infrastructure & Python Backend

- [x] Refactor MainLayout to accept tabBar and content props
- [x] Create TabBar component with Main and Stream tabs
- [x] Add lucide-react icons (FileCode, Radio)
- [x] Extract existing workspace into MainTab component
- [x] Add tab state management in App.tsx
- [x] Implement conditional rendering based on active tab
- [x] Create CSS for TabBar (pill buttons, active state, hover)
- [x] Add keyboard navigation (Alt+1/2 for tab switching)
- [x] Refactor MarlinStreamer: make `iter_stream()` require commands parameter
- [x] Add `connect()` method for explicit connection
- [x] Add `is_connected` property to query connection state
- [x] Update `send_command()` to return response list
- [x] Create `fiberpath_cli/interactive.py` with JSON stdin/stdout protocol
- [x] Implement connect, disconnect, send, stream actions
- [x] Add error responses with error codes
- [x] Add progress event streaming
- [x] Test: All 73 Python tests pass with new API
- [x] Update REST API to use new connection-centric pattern
- [x] Update CLI stream command to use new API
- [x] Update all test cases for new API

**Progress:** 21/21 tasks complete (100%) ✅

---

## Phase 2: Tauri Integration

- [ ] Add serialport dependency to Cargo.toml
- [ ] Create Tauri command: `list_serial_ports`
- [ ] Create Tauri command: `marlin_start_interactive` (spawn Python subprocess)
- [ ] Store subprocess handle in Tauri state
- [ ] Implement stdin writer for JSON commands
- [ ] Implement stdout reader thread for JSON responses
- [ ] Create Tauri command: `marlin_connect`
- [ ] Create Tauri command: `marlin_disconnect`
- [ ] Create Tauri command: `marlin_send_command`
- [ ] Create Tauri command: `marlin_stream_file`
- [ ] Emit `stream-progress` events to frontend
- [ ] Emit `stream-complete` / `stream-error` events
- [ ] Add error handling for subprocess failures
- [ ] Test subprocess lifecycle (start, communicate, cleanup)

**Progress:** 0/14 tasks complete

---

## Phase 3: Stream Tab UI (Simplified)

- [ ] Create streamStore (Zustand) with minimal state (connection, streaming, progress)
- [ ] Create StreamTab component with 2-panel layout (controls | log)
- [ ] Create StreamControls component (left panel)
- [ ] Add port selector dropdown (uses list_serial_ports)
- [ ] Add Refresh Ports button
- [ ] Add baud rate selector dropdown (115200, 250000, 500000)
- [ ] Add Connect button with connection status indicator
- [ ] Add Disconnect button
- [ ] Add Select G-code File button (Tauri file dialog)
- [ ] Display selected filename
- [ ] Add Start Stream button (enabled when connected + file selected)
- [ ] Add Stop Stream button (enabled during streaming)
- [ ] Create StreamLog component (right panel, simple scrollable text area)
- [ ] Add progress bar (N / Total commands)
- [ ] Add current command display
- [ ] Style StreamTab with clean, professional appearance

**Progress:** 0/16 tasks complete

---

## Phase 4: Frontend Integration & Testing

- [ ] Wire port selector to list_serial_ports
- [ ] Wire Connect button to marlin_connect
- [ ] Wire Disconnect button to marlin_disconnect
- [ ] Wire Select File to Tauri file dialog
- [ ] Wire Start Stream to marlin_stream_file
- [ ] Listen to stream-progress events and update UI
- [ ] Update progress bar on each event
- [ ] Update current command display on each event
- [ ] Append log messages to StreamLog
- [ ] Handle connection errors with user-friendly messages
- [ ] Handle streaming errors with user-friendly messages
- [ ] Add loading states for all async operations
- [ ] Test: Connect to Marlin hardware (if available)
- [ ] Test: Stream small G-code file (<100 commands)
- [ ] Test: Stream large G-code file (>1000 commands)
- [ ] Test: Connection lifecycle works correctly
- [ ] Test: Error states display clearly
- [ ] Test: Tab switching during operations

**Progress:** 0/18 tasks complete

---

## Phase 5: Pause/Resume Controls

- [ ] Add Pause button to StreamControls (enabled during streaming)
- [ ] Add Resume button to StreamControls (enabled when paused)
- [ ] Update connection status indicator to show Paused state
- [ ] Add `pause` and `resume` actions to interactive.py (Python backend)
- [ ] Create Tauri commands: marlin_pause, marlin_resume
- [ ] Emit stream-paused and stream-resumed events
- [ ] Wire Pause/Resume buttons to backend commands
- [ ] Test: Pause during large stream, resume successfully

**Progress:** 0/8 tasks complete

**Note:** Python backend already supports pause/resume via M0/M108 commands. UI integration is straightforward.

---

## Phase 6: Polish, Testing & Documentation

- [ ] Review all components for consistent styling
- [ ] Add loading states for all async operations
- [ ] Improve error messages (user-friendly, actionable)
- [ ] Add tooltips for stream controls
- [ ] Add keyboard shortcuts documentation
- [ ] Test on Windows/macOS/Linux
- [ ] Fix platform-specific issues
- [ ] Test all tab navigation paths
- [ ] Test connection lifecycle (connect, disconnect, reconnect)
- [ ] Test streaming with various file sizes (<100, 1000+, 10000+ commands)
- [ ] Test pause/resume cycle
- [ ] Test error scenarios (invalid port, connection lost, invalid G-code)
- [ ] Test concurrent operations (can't stream while already streaming)
- [ ] Add auto-scroll to log (scroll to bottom on new messages)
- [ ] Add Clear Log button
- [ ] Update GUI README with streaming features
- [ ] Add Marlin streaming section to docs
- [ ] Add troubleshooting guide (common errors, solutions)
- [ ] Add CHANGELOG entry for v4.0.0
- [ ] Bump version to 0.4.0 in all files

**Progress:** 0/20 tasks complete

---

## Summary

**Total Tasks:** 83  
**Completed:** 21  
**Remaining:** 62  
**Overall Progress:** 25%

| Phase                 | Tasks | Complete | Progress |
| --------------------- | ----- | -------- | -------- |
| 1 - Infrastructure    | 21    | 21       | 100% ✅  |
| 2 - Tauri Integration | 14    | 0        | 0%       |
| 3 - Stream Tab UI     | 16    | 0        | 0%       |
| 4 - Frontend Wiring   | 18    | 0        | 0%       |
| 5 - Pause/Resume      | 8     | 0        | 0%       |
| 6 - Polish & Testing  | 20    | 0        | 0%       |

**Timeline Estimate:** 2 weeks (down from original 4-5 weeks)

**Milestones:**

- ✅ **Phase 1 Complete** - Tab infrastructure working, Python backend refactored (100%)
- **Phase 4 Complete** - Basic streaming functional (MVP achieved)
- **Phase 5 Complete** - Pause/resume working (full streaming features)
- **Phase 6 Complete** - Production ready for release

---

## Scope Decisions

**Removed from v4 (moved to v5 or later):**

- Settings tab with persistent preferences → **v5**
- Manual G-code command input → **v5**
- Command history (up/down arrows) → **v5**
- Common command buttons (Home, Get Position, etc.) → **v5**
- Advanced statistics (ETA, time elapsed) → **v5**
- Log filtering (errors only, commands only) → **v5**
- Export log to file → **v5**
- Timestamps on log messages → **v5**
- 3-panel layout with visualization → **v5 or v6**
- Real-time 3D streaming visualization → **v6 or future**

**Why simplified?**

Focus on core value: stream G-code files successfully with progress feedback. Everything else is enhancement that can be added based on user feedback. Ship fast, iterate based on real usage.

---

## Notes

**Architecture:** Python backend with JSON stdin/stdout subprocess communication.

**Python Backend:**

- Connection-centric API (connect → send commands → stream → disconnect)
- JSON protocol in `fiberpath_cli/interactive.py`
- All 73 tests passing

**Tauri Integration:**

- Spawn Python subprocess (~150 lines Rust)
- JSON stdin/stdout for communication
- Event streaming for progress updates

**Scope:** Minimal viable streaming. Settings, manual commands, and statistics deferred to v5.

**Last Updated:** 2026-01-09
