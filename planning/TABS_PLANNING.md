# FiberPath GUI Tabs Feature - Planning Document

**Version:** 1.0  
**Date:** 2026-01-08  
**Branch:** tabsgui  
**Status:** Planning Phase

---

## 1. Executive Summary

### Objective

Transform the current single-view GUI into a tabbed interface with:

1. **Main Tab (existing)**: Current project definition, parameters, layers, and visualization
2. **Marlin/Stream Tab**: G-code streaming to Marlin controllers with real-time progress
3. **Settings Tab**: Application preferences and unsurfaced settings

### Key Requirements

- Preserve all existing functionality in Main tab
- Enable G-code streaming without leaving the GUI
- Eventually support direct Marlin command sending
- May require refactoring Python MarlinStreamer for better GUI integration

---

## 2. Current State Analysis

### 2.1 Architecture Overview

**Current Structure:**

```
App.tsx
└── MainLayout
    ├── MenuBar (top)
    ├── Workspace (3-column grid)
    │   ├── LeftPanel (Parameters: Mandrel, Tow, Machine Settings)
    │   ├── CenterCanvas (VisualizationCanvas with PNG preview)
    │   └── RightPanel (Layer editor: Hoop/Helical/Skip)
    ├── BottomPanel (LayerStack)
    └── StatusBar (bottom)
```

**Key Observations:**

- Clean separation of concerns with panel components
- MainLayout uses CSS Grid for responsive layout
- No routing or navigation system currently
- All state managed via Zustand (projectStore)
- Tauri commands for CLI interaction (plan, validate, plot, simulate, stream)

### 2.2 Existing Streaming Functionality

**CLI Implementation (`fiberpath_cli/stream.py`):**

- `stream_command()` function takes G-code file, port, baud rate, timeout
- Uses `MarlinStreamer` class for serial communication
- Progress tracking via `StreamProgress` dataclass
- Supports dry-run mode, verbose logging, JSON output
- Handles Ctrl+C pause/resume with M0/M108 commands

**Python MarlinStreamer (`fiberpath/execution/marlin.py`):**

- `MarlinStreamer` class with PySerial transport
- Connection management: port, baud rate, timeout configuration
- Startup sequence handling (waits for Marlin banner)
- Command queueing with ok/busy/error response parsing
- Pause/resume support via M0/M108
- Iterator-based progress reporting (`iter_stream()`)

**Current Tauri Command (`src-tauri/src/main.rs`):**

- `stream_program()` exists but seems incomplete
- Likely calls CLI via shell command
- No real-time progress updates to GUI
- No port selection UI

**Issues with Current Approach:**

1. **No GUI integration**: Streaming happens via CLI, not exposed in GUI
2. **No port discovery**: User must know COM port beforehand
3. **No real-time feedback**: Can't see streaming progress in GUI
4. **No connection status**: Can't tell if Marlin is connected
5. **No command history**: No log of sent commands
6. **Connection lifecycle unclear**: When to connect/disconnect?

### 2.3 Technology Stack

**Frontend:**

- React 18 with TypeScript
- Vite for build tooling
- Zustand for state management
- No routing library (no React Router)
- lucide-react for icons
- Custom CSS (no UI component library)

**Backend:**

- Tauri 2.x (Rust)
- Python CLI via subprocess/shell
- PySerial for serial communication

**Key Dependencies:**

- `@hello-pangea/dnd` for drag-and-drop (LayerStack)
- `react-zoom-pan-pinch` for canvas zoom
- No tab component library currently installed

---

## 3. Design Approach

### 3.1 Tab Navigation Strategy

**Option A: React State-Based Tabs (Recommended)**

- Use local state (`useState`) to track active tab
- Conditional rendering based on active tab
- No routing overhead
- Simple implementation
- All content loads upfront (may want lazy loading later)

**Option B: React Router**

- Full-featured routing with URL navigation
- More complex setup
- Overkill for 2-3 tabs
- Not recommended for this use case

**Decision: Option A** - Simple state-based tabs with component-level navigation

### 3.2 Layout Architecture

**Proposed Structure:**

```
App.tsx
└── MainLayout
    ├── MenuBar (top - unchanged)
    ├── TabBar (NEW - below menu bar)
    │   ├── Tab: Main (default)
    │   ├── Tab: Marlin/Stream
    │   └── Tab: Settings
    ├── TabContent (NEW - workspace area)
    │   ├── MainTab (current workspace: panels + canvas + bottom)
    │   ├── MarlinTab (NEW - stream controls + progress + log)
    │   └── SettingsTab (NEW - preferences form)
    └── StatusBar (bottom - enhanced with connection status)
```

**MainTab Layout (preserve existing):**

```
MainTab
├── LeftPanel (Parameters: Mandrel, Tow, Machine)
├── CenterCanvas (Visualization)
├── RightPanel (Layer Editor)
└── BottomPanel (LayerStack)
```

**MarlinTab Layout (new):**

```
MarlinTab
├── LeftPanel (Stream Controls)
│   ├── Port Selection (dropdown with refresh)
│   ├── Connection Settings (baud, timeout)
│   ├── File Selection (select exported .gcode)
│   ├── Connect/Disconnect Button
│   └── Stream Controls (Start, Pause, Resume, Stop)
├── CenterPanel (Stream Visualization - future)
│   └── Path progress visualization (future enhancement)
└── RightPanel (Stream Log & Status)
    ├── Connection Status (connected/disconnected)
    ├── Progress Bar (N / Total commands)
    ├── Current Command Display
    ├── Response Log (scrollable)
    └── Error Display
```

**SettingsTab Layout (new):**

```
SettingsTab
└── CenterPanel (Settings Form)
    ├── General Settings
    │   ├── Theme (future)
    │   ├── Auto-save interval
    │   └── Default file locations
    ├── Streaming Defaults
    │   ├── Default baud rate
    │   ├── Default timeout
    │   └── Verbose logging preference
    └── Export Settings
        ├── Default G-code flavor (future)
        └── File naming pattern
```

### 3.3 State Management Strategy

**New Zustand Stores:**

1. **streamStore** (NEW):

```typescript
interface StreamState {
  // Connection
  port: string | null;
  baudRate: number;
  timeout: number;
  isConnected: boolean;

  // Streaming
  isStreaming: boolean;
  isPaused: boolean;
  selectedFile: string | null;

  // Progress
  commandsSent: number;
  commandsTotal: number;
  currentCommand: string;

  // Log
  logMessages: LogMessage[];
  errors: string[];

  // Actions
  setPort: (port: string) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  startStream: (file: string) => Promise<void>;
  pauseStream: () => void;
  resumeStream: () => void;
  stopStream: () => void;
  addLogMessage: (msg: LogMessage) => void;
}
```

2. **settingsStore** (NEW):

```typescript
interface SettingsState {
  // Streaming defaults
  defaultBaudRate: number;
  defaultTimeout: number;
  verboseLogging: boolean;

  // General
  autoSaveInterval: number; // 0 = disabled
  recentFilesLimit: number;

  // Actions
  updateSetting: <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
}
```

**Persistence:**

- Settings should persist across sessions (Tauri local storage or file)
- Stream state is ephemeral (resets on app restart)
- Recent files already persisted (existing functionality)

### 3.4 Component Hierarchy

**New Components to Create:**

1. **TabBar.tsx** (navigation)

   - Renders tab buttons
   - Manages active tab state (or receives from parent)
   - Styling: pill/button style tabs

2. **MainTab.tsx** (wrapper)

   - Refactor existing App.tsx workspace into this component
   - Props: none (uses projectStore directly)
   - Returns: existing 3-panel + bottom layout

3. **MarlinTab.tsx** (new feature)

   - Three-panel layout for streaming
   - Subcomponents:
     - `StreamControls.tsx` (left panel)
     - `StreamVisualization.tsx` (center - placeholder for now)
     - `StreamLog.tsx` (right panel)

4. **SettingsTab.tsx** (new feature)

   - Single-panel form layout
   - Subcomponents:
     - `GeneralSettings.tsx`
     - `StreamingSettings.tsx`
     - `ExportSettings.tsx`

5. **StreamControls.tsx**

   - Port selection (dropdown + refresh button)
   - Connection button (connect/disconnect)
   - File picker (select .gcode from filesystem)
   - Stream control buttons (start/pause/resume/stop)
   - Connection settings form (baud, timeout)

6. **StreamLog.tsx**

   - Connection status badge
   - Progress bar + text (N / Total)
   - Current command display
   - Scrollable log area (virtualized if large)
   - Auto-scroll to bottom option

7. **PortSelector.tsx** (utility)
   - Dropdown of available serial ports
   - Refresh button to re-scan
   - Shows port descriptions (if available)

---

## 4. Technical Implementation Details

### 4.1 Tab Navigation Implementation

**In App.tsx:**

```typescript
type TabId = "main" | "marlin" | "settings";

const [activeTab, setActiveTab] = useState<TabId>("main");

return (
  <MainLayout
    menuBar={<MenuBar />}
    tabBar={<TabBar activeTab={activeTab} onTabChange={setActiveTab} />}
    content={
      <>
        {activeTab === "main" && <MainTab />}
        {activeTab === "marlin" && <MarlinTab />}
        {activeTab === "settings" && <SettingsTab />}
      </>
    }
    statusBar={<StatusBar />}
  />
);
```

**MainLayout Refactor:**

- Remove fixed 3-panel workspace
- Add `tabBar` prop
- Add flexible `content` prop (renders different tab layouts)
- Keep menuBar and statusBar

### 4.2 Tauri Commands for Streaming

**Required New Commands:**

1. **`list_serial_ports`**

   - Returns: `Vec<SerialPortInfo>` (port name, description, type)
   - Implementation: Use `serialport` Rust crate
   - Error handling: Return empty list on failure

2. **`connect_marlin`**

   - Params: port, baud_rate, timeout
   - Returns: `Result<ConnectionId, Error>`
   - Implementation: Store connection in app state, don't call Python CLI
   - Challenge: Need to embed Python MarlinStreamer logic in Rust OR use async command streaming

3. **`disconnect_marlin`**

   - Params: connection_id
   - Returns: `Result<(), Error>`

4. **`stream_gcode_file`**

   - Params: connection_id, file_path
   - Returns: Stream of `StreamProgress` events
   - Implementation: Use Tauri event emitter for progress updates
   - Challenge: Real-time bidirectional communication

5. **`send_marlin_command`** (future)
   - Params: connection_id, command (e.g., "G28", "M114")
   - Returns: `Result<String, Error>` (response from Marlin)

**Implementation Challenges:**

**CRITICAL ARCHITECTURE DECISION** (see [ARCHITECTURE_DECISION_MARLIN.md](planning/ARCHITECTURE_DECISION_MARLIN.md) for full analysis):

The current Python `MarlinStreamer` is **fundamentally incompatible** with GUI use case:

- Designed for file-centric workflow (load program → stream → close)
- No public API for single command sending (`_send_command()` is private)
- No "connect and wait" mode - connection is lazy
- Cannot reuse connection between operations

**GUI Requirements:**

- Connect once, keep connection alive
- Send individual commands (G28, M114, etc.)
- Stream files using existing connection
- Send more commands after streaming
- Disconnect when user chooses

**DECISION: Implement Marlin Protocol Natively in Rust**

**Rationale:**

- ✅ Marlin protocol is simple (~300 lines: send command + wait for "ok")
- ✅ Full control over connection lifecycle
- ✅ No subprocess overhead - native performance
- ✅ Better error handling (Result<T, Error>)
- ✅ Type-safe communication (no JSON parsing)
- ✅ Python CLI remains unchanged
- ✅ Faster development (2-3 days vs 3-5 for Python refactor)
- ✅ Superior UX (no IPC lag)

**Implementation:**

```rust
// src-tauri/src/marlin.rs
pub struct MarlinConnection {
    port: Box<dyn SerialPort>,
    timeout: Duration,
}

impl MarlinConnection {
    pub fn connect(port: &str, baud_rate: u32, timeout: Duration) -> Result<Self>
    pub fn send_command(&mut self, cmd: &str) -> Result<Vec<String>>
    pub fn stream_file<F>(&mut self, path: &Path, progress_fn: F) -> Result<()>
}
```

**Rejected Options:**

- ❌ Option A: Refactor Python for subprocess with JSON protocol (complex, slow, subprocess overhead)
- ❌ Option B: Hybrid Python + Rust (maintenance nightmare, two implementations)

**NO Python CLI Changes Required - CLI remains unchanged**

### 4.3 Serial Port Discovery

**Rust Implementation:**

```rust
use serialport::available_ports;

#[tauri::command]
fn list_serial_ports() -> Result<Vec<PortInfo>, String> {
    match available_ports() {
        Ok(ports) => Ok(ports.into_iter().map(|p| PortInfo {
            name: p.port_name,
            description: p.port_type.description(),
        }).collect()),
        Err(e) => Err(format!("Failed to list ports: {}", e))
    }
}
```

**Frontend Usage:**

```typescript
const ports = await invoke<PortInfo[]>("list_serial_ports");
// Display in dropdown
```

### 4.4 Real-Time Progress Updates

**Tauri Event System:**

```rust
// In Rust backend
app_handle.emit_all("stream-progress", StreamProgress {
    sent: 10,
    total: 100
}).unwrap();

// In React frontend
import { listen } from '@tauri-apps/api/event';

useEffect(() => {
  const unlisten = listen<StreamProgress>('stream-progress', (event) => {
    // Update streamStore
    streamStore.getState().updateProgress(event.payload);
  });

  return () => {
    unlisten.then(fn => fn());
  };
}, []);
```

### 4.5 Connection Lifecycle Management

**State Machine:**

```
[Disconnected]
  ↓ connect()
[Connecting]
  ↓ success
[Connected/Idle]
  ↓ startStream()
[Streaming]
  ↓ pauseStream()
[Paused]
  ↓ resumeStream()
[Streaming]
  ↓ stopStream() / complete / error
[Connected/Idle]
  ↓ disconnect()
[Disconnected]
```

**Considerations:**

- Handle unexpected disconnections (serial cable unplugged)
- Timeout on connection attempt (5-10 seconds)
- Cleanup on app close (disconnect gracefully)
- Prevent starting new stream while one is active

---

## 5. Settings Management

### 5.1 Settings Storage

**Tauri Approach:**

```rust
// Use tauri::Manager::path_resolver() to get app data dir
// Store as JSON file: app_data/settings.json

#[tauri::command]
fn load_settings() -> Result<Settings, String> {
    let app_data = app.path_resolver().app_data_dir().unwrap();
    let settings_path = app_data.join("settings.json");
    // Read and deserialize
}

#[tauri::command]
fn save_settings(settings: Settings) -> Result<(), String> {
    // Serialize and write
}
```

**Default Settings:**

```json
{
  "streaming": {
    "defaultBaudRate": 250000,
    "defaultTimeout": 10.0,
    "verboseLogging": false
  },
  "general": {
    "autoSaveInterval": 300,
    "recentFilesLimit": 10
  },
  "export": {
    "defaultNamingPattern": "{project_name}_{timestamp}.gcode"
  }
}
```

### 5.2 Settings UI

**Form Structure:**

- Group settings by category (accordion or tabs within Settings tab)
- Save button (or auto-save on change)
- Reset to defaults button
- Validation (e.g., baud rate must be positive)

**Unsurfaced Settings to Add:**

- Auto-save interval (currently not configurable)
- Recent files limit (currently hardcoded)
- Default export directory preference
- Canvas refresh behavior (manual vs auto)
- Layer scrubber behavior settings

---

## 6. Implementation Phases

### Phase 1: Tab Navigation Foundation

**Goal:** Add tab structure without breaking existing functionality

1.1. Refactor MainLayout to support tabs
1.2. Create TabBar component (3 tabs: Main, Marlin, Settings)
1.3. Extract existing workspace into MainTab component
1.4. Wire up tab switching (useState in App.tsx)
1.5. Add tab icons (lucide-react)
1.6. Style TabBar (pill buttons, active state)
1.7. Test: Main tab should look identical to current UI

**Deliverables:**

- TabBar.tsx component
- MainTab.tsx component (existing UI extracted)
- Updated MainLayout.tsx
- Updated App.tsx with tab state
- CSS for tab styling

**Testing:**

- All existing functionality works in Main tab
- Tab switching preserves state
- Layout is responsive
- Panel collapse/expand still works

---

### Phase 2: Settings Tab Implementation

**Goal:** Add Settings tab with actual configurable preferences

2.1. Create settingsStore (Zustand)
2.2. Create SettingsTab.tsx layout
2.3. Create setting category components: - GeneralSettings.tsx - StreamingSettings.tsx - ExportSettings.tsx
2.4. Create Tauri commands: - load_settings - save_settings
2.5. Implement settings persistence (JSON file)
2.6. Add form validation
2.7. Add "Reset to Defaults" button
2.8. Wire up settings to existing functionality (e.g., default baud rate)

**Deliverables:**

- settingsStore.ts
- SettingsTab.tsx + subcomponents
- Tauri settings commands
- Settings persistence
- CSS for settings forms

**Testing:**

- Settings persist across app restarts
- Settings apply to streaming functionality
- Validation prevents invalid values
- Reset to defaults works correctly

---

### Phase 3: Marlin Tab - UI & State Setup

**Goal:** Create Marlin tab structure (no streaming yet)

3.1. Create streamStore (Zustand)
3.2. Create MarlinTab.tsx layout (3-panel)
3.3. Create StreamControls.tsx component: - Port selector (static dropdown for now) - Connection settings form (baud, timeout) - File picker button - Connect button (disabled/mock) - Stream buttons (disabled)
3.4. Create StreamLog.tsx component: - Connection status badge - Progress bar (static) - Log area (empty scrollable div)
3.5. Create StreamVisualization.tsx placeholder
3.6. Style Marlin tab components

**Deliverables:**

- streamStore.ts
- MarlinTab.tsx + subcomponents
- StreamControls.tsx
- StreamLog.tsx
- StreamVisualization.tsx (placeholder)
- CSS for streaming UI

**Testing:**

- Marlin tab renders correctly
- Forms are functional (no backend yet)
- Layout is responsive
- UI matches design mockup

---

### Phase 4: Serial Port Discovery

**Goal:** Enable dynamic port detection

4.1. Add serialport Rust dependency to Cargo.toml
4.2. Implement list_serial_ports Tauri command
4.3. Create PortSelector.tsx component: - Dropdown of ports - Refresh button - Port descriptions
4.4. Integrate PortSelector into StreamControls
4.5. Add loading state while scanning ports
4.6. Handle errors (no ports found, permission denied)

**Deliverables:**

- list_serial_ports Tauri command
- PortSelector.tsx component
- Updated StreamControls.tsx
- Error handling UI

**Testing:**

- Port list populates correctly
- Refresh button updates port list
- Works on Windows, macOS, Linux
- Handles no ports gracefully
- Permission errors show helpful message

---

### Phase 5: Rust Marlin Implementation (MVP)

**Goal:** Implement native Marlin serial communication in Rust

**5.1 - Rust Module Structure**

- Create `src-tauri/src/marlin.rs` module
- Define `MarlinConnection` struct
- Define `MarlinError` enum (Serial, Timeout, MarlinError, NotConnected)
- Define `StreamProgress` struct for progress events

**5.2 - Core Connection Logic**

- Implement `MarlinConnection::connect()` - open serial port, wait for startup banner
- Implement `wait_for_startup()` - consume startup lines until 0.5s quiet period
- Implement `wait_for_ok()` - read lines until "ok", handle "echo:busy", detect errors
- Add connection timeout handling (5-10 seconds)

**5.3 - Command Sending**

- Implement `send_command()` - write command + newline, wait for ok, return responses
- Handle Marlin responses (ok, echo:busy, Error:...)
- Add command timeout with busy-wait extension
- Collect non-ok responses as log messages

**5.4 - File Streaming**

- Implement `stream_gcode_file()` - read file, send commands, emit progress
- Parse file: skip empty lines and comments
- Call progress callback after each command
- Handle streaming errors (connection lost, timeout, marlin error)

**5.5 - Tauri Commands**

- Create `MarlinState` with `Mutex<Option<MarlinConnection>>`
- Implement `marlin_connect` command (port, baud, timeout)
- Implement `marlin_disconnect` command
- Implement `marlin_send_command` command (returns responses)
- Implement `marlin_stream_file` command (emits events)

**5.6 - Event Emitter Integration**

- Emit `stream-progress` events during file streaming
- Emit `stream-complete` event on successful completion
- Emit `stream-error` event on failures
- Add progress data: sent, total, current command

**5.7 - Error Handling**

- Convert Rust errors to user-friendly strings
- Handle serial port errors (not found, permission denied, in use)
- Handle Marlin errors (parse error responses)
- Handle timeout errors (slow moves, unresponsive controller)
- Add reconnection hints in error messages

**5.8 - Frontend Integration**

- Add Tauri command types to TypeScript
- Update streamStore with Rust command actions
- Wire up Connect button → marlin_connect
- Wire up Disconnect button → marlin_disconnect
- Wire up Start Stream button → marlin_stream_file
- Wire up Stop Stream button (kill operation)

**5.9 - Real-Time Progress**

- Listen to `stream-progress` events in React
- Update StreamLog progress bar in real-time
- Update StreamLog current command display
- Append log messages to scrollable area
- Auto-scroll log to bottom

**5.10 - Testing**

- Unit test: MarlinConnection with mock serial port
- Unit test: Command parsing and error handling
- Integration test: Full streaming workflow (dry-run with simulator)
- Integration test: Connection lifecycle (connect/disconnect)
- Manual test: Real Marlin controller (if hardware available)

**Deliverables:**

- `src-tauri/src/marlin.rs` (~300 lines)
- Tauri commands in `main.rs`
- Updated streamStore with Rust integration
- Functional streaming UI
- Real-time progress updates
- Comprehensive error handling

**Testing:**

- Connection establishes successfully
- Single commands work (G28, M114, etc.)
- File streaming completes successfully
- Progress updates in real-time
- Stop/disconnect works cleanly
- Errors are handled gracefully
- Works with actual Marlin (if hardware available)

**Definition of Done:**

- [ ] User can connect to Marlin from GUI
- [ ] User can see connection status
- [ ] User can stream G-code file
- [ ] Progress updates in real-time
- [ ] User can stop streaming mid-way
- [ ] Errors display helpful messages
- [ ] Connection persists between operations
- [ ] MVP feature is complete and demo-ready

---

### Phase 6: Enhanced Connection Features

**Goal:** Add single command sending, command input, and common commands

**6.1 - Command Input UI**

- Add command input field to StreamControls
- Add "Send" button next to input
- Enable input only when connected
- Clear input after successful send
- Show sending indicator during command

**6.2 - Single Command Functionality**

- Already implemented in Phase 5 (`marlin_send_command`)
- Wire up Send button to call command
- Display response in StreamLog
- Add command to history
- Handle errors gracefully

**6.3 - Common Commands Component**

- Create CommonCommands component (button grid)
- Add homing buttons (G28, G28 X, G28 Y, G28 Z)
- Add query buttons (M114 position, M119 endstops, M503 settings, M105 temp)
- Add tooltips to each button
- Wire up to `marlin_send_command`

**6.4 - Command History**

- Track manual command history in streamStore
- Add up/down arrow navigation in input (command recall)
- Save command history to localStorage
- Limit history to last 50 commands

**6.5 - Response Display**

- Show responses in StreamLog with different styling
- Add "Command" vs "Response" badges
- Color-code by type (info, success, error)
- Add timestamp to each entry

**6.6 - Connection Status Enhancement**

- Add connection indicator to StatusBar
- Show connected port and baud rate
- Add "Connected" / "Disconnected" badge with color
- Show last command sent timestamp

**Deliverables:**

- CommandInput.tsx component
- CommonCommands.tsx component
- Enhanced StreamLog with response display
- Command history with recall
- Connection status in StatusBar

**Testing:**

- Manual commands send successfully
- Responses display correctly
- Common command buttons work
- Command history recall works
- Connection status updates correctly

---

### Phase 7: Pause/Resume and Enhanced Streaming

**Goal:** Add pause/resume, statistics, and better streaming UX

**7.1 - Pause/Resume Implementation**

- Add `pause_stream()` method to MarlinConnection (send M0)
- Add `resume_stream()` method to MarlinConnection (send M108)
- Create `marlin_pause` Tauri command
- Create `marlin_resume` Tauri command
- Add paused state to streamStore
- Wire up Pause button (enabled during streaming)
- Wire up Resume button (enabled during pause)

**7.2 - Streaming Statistics**

- Track streaming start time in streamStore
- Calculate elapsed time (update every second)
- Calculate commands per second (rolling average)
- Estimate time remaining based on CPS
- Add statistics display to StreamLog
- Show: Elapsed, Remaining, Progress %, CPS

**7.3 - Log Enhancements**
7.4. Add "Clear Log" button
7.5. Add streaming statistics: - Time elapsed - Estimated time remaining - Commands per second
7.6. Add visual progress indicator (percentage)
7.7. Add sound notification on completion (optional)
7.8. Add export log to file button

**Deliverables:**

- Pause/Resume functionality
- Command history component
- Log search/filter
- Statistics display
- Enhanced progress UI

**Testing:**

- Pause interrupts streaming correctly
- Resume continues from correct position
- Statistics are accurate
- Log filter works correctly
- Export log creates valid file

---

### Phase 8: Direct Marlin Commands (Future)

**Goal:** Send arbitrary G-code commands for testing

8.1. Add command input field to StreamControls
8.2. Implement send_command Tauri command
8.3. Add response display
8.4. Add common command buttons: - G28 (Home all axes) - M114 (Get current position) - M119 (Get endstop status) - M503 (Get settings)
8.5. Add command history/autocomplete
8.6. Add command validation (basic syntax check)

**Deliverables:**

- Command input UI
- send_command implementation
- Response display
- Common command buttons
- Command validation

**Testing:**

- Commands send successfully
- Responses display correctly
- Invalid commands are rejected
- Common commands work as expected
- History saves previous commands

---

### Phase 9: Stream Visualization (Advanced)

**Goal:** Visual representation of streaming progress

9.1. Design visualization approach: - Option A: Highlight current line in path preview - Option B: Animate tool path as it streams - Option C: Both
9.2. Implement path tracking in visualization
9.3. Add sync between stream progress and visualization
9.4. Add option to disable (performance)

**Deliverables:**

- Stream visualization in center panel
- Path highlighting
- Progress animation
- Performance optimization

**Testing:**

- Visualization syncs with stream progress
- Performance doesn't impact streaming
- Disable option works correctly
- Large programs don't slow down UI

---

### Phase 9: Polish & Documentation

**Goal:** Production-ready feature

9.1. UI/UX Polish:

- Comprehensive error messages
- Tooltips for all controls
- Keyboard shortcuts (Space = pause/resume, Alt+1/2/3 tab switching)
- Consistent styling across all components
- Loading states for all async operations

9.2. Documentation:

- Streaming workflow guide
- Troubleshooting section
- Common Marlin configurations
- Keyboard shortcuts reference

9.3. Performance Optimization:

- Virtualize log if >1000 lines
- Throttle progress updates if too fast
- Bundle size optimization

9.4. Accessibility:

- ARIA labels
- Keyboard navigation
- Screen reader support

9.5. Testing:

- Full end-to-end test suite
- Cross-platform testing (Windows/macOS/Linux)
- Hardware testing with real Marlin devices
- Performance profiling
- Memory leak testing

**Deliverables:**

- Polished, production-ready UI
- Complete user documentation
- Cross-platform tested installers
- v4.0.0 release ready

**Definition of Done:**

- All features working on Windows/macOS/Linux
- No critical bugs or performance issues
- Documentation complete and accurate
- Release installers tested

---

## 7. Risk Analysis & Mitigation

### 7.1 Technical Risks

| Risk                                        | Probability | Impact | Mitigation                                                       |
| ------------------------------------------- | ----------- | ------ | ---------------------------------------------------------------- |
| **Python subprocess management complexity** | Medium      | Medium | Use simple JSON stdin/stdout protocol, extensive error handling  |
| **Serial communication reliability**        | Medium      | High   | Extensive error handling, timeout management, reconnection logic |
| **Real-time performance issues**            | Medium      | Medium | Event throttling, log virtualization, performance profiling      |
| **Cross-platform serial port differences**  | Medium      | Medium | Test on all platforms, handle platform-specific quirks           |
| **Connection state synchronization**        | Medium      | High   | Careful state machine design, atomic operations                  |
| **UI responsiveness during streaming**      | Low         | Medium | Offload streaming to background, use web workers if needed       |

### 7.2 UX Risks

| Risk                                    | Probability | Impact | Mitigation                                            |
| --------------------------------------- | ----------- | ------ | ----------------------------------------------------- |
| **Confusing connection lifecycle**      | Medium      | Medium | Clear status indicators, helpful error messages       |
| **Loss of streaming progress on error** | Low         | High   | Save streaming state, allow resume from last position |
| **Overwhelming log information**        | Medium      | Low    | Filtering, collapsing, verbosity settings             |
| **Unclear streaming status**            | Low         | Medium | Prominent progress indicators, visual feedback        |

### 7.3 Integration Risks

| Risk                                         | Probability | Impact | Mitigation                                                 |
| -------------------------------------------- | ----------- | ------ | ---------------------------------------------------------- |
| **Breaking existing Main tab functionality** | Low         | High   | Extract carefully, comprehensive testing                   |
| **Settings not applying correctly**          | Medium      | Medium | Thorough integration testing, clear settings documentation |
| **Port conflicts with other software**       | Low         | Medium | Detect and report port in use errors                       |

---

## 8. Success Criteria

### 8.1 MVP (Phases 1-5)

- [ ] Tab navigation works smoothly
- [ ] Settings tab persists preferences
- [ ] Marlin tab displays and functions
- [ ] Port discovery works on all platforms
- [ ] G-code streaming completes successfully
- [ ] Real-time progress updates work
- [ ] Basic error handling is present
- [ ] Existing functionality is unaffected

### 8.2 Full Feature (Phases 6-8)

- [ ] Connection management is robust
- [ ] Pause/resume works correctly
- [ ] Direct command sending works
- [ ] Command history is useful
- [ ] Statistics are accurate
- [ ] Error messages are helpful
- [ ] Cross-platform compatibility verified

### 8.3 Polish (Phases 9-10)

- [ ] Visualization syncs with streaming
- [ ] Performance is acceptable for large files
- [ ] Documentation is comprehensive
- [ ] Accessibility requirements met
- [ ] User testing feedback incorporated

---

## 9. Dependencies & Prerequisites

### 9.1 External Libraries

- **serialport** (Rust crate): For serial port enumeration
- **tokio** (Rust): Already present, for async subprocess management
- Consider: **comfy-table** (Rust) for formatting command output

### 9.2 Python CLI Changes

- Add --json-stream flag to stream.py
- Add newline-delimited JSON output mode
- Add connection lifecycle commands (future)

### 9.3 Infrastructure

- None (all existing Tauri/React stack)

---

## 10. Open Questions & Decisions Needed

### 10.1 Architecture Decisions

1. **Streaming Implementation:**

   - ✅ **Decision:** Refactor Python MarlinStreamer for connection-centric workflow (see [ARCHITECTURE_DECISION_MARLIN.md](planning/ARCHITECTURE_DECISION_MARLIN.md))
   - **Rationale:** Keep core Python-accessible, reuse existing MarlinStreamer, no code duplication, backwards compatible

2. **Tab State Management:**

   - ✅ **Decision:** Local component state in App.tsx
   - **Rationale:** Simple, no URL routing needed, all tabs co-exist

3. **Settings Persistence:**
   - ✅ **Decision:** JSON file in Tauri app data directory
   - **Rationale:** Simple, no database needed, easy to edit manually

### 10.2 Design Decisions

1. **Tab Layout:**

   - **Question:** Should tabs be above or below menu bar?
   - **Recommendation:** Below menu bar (like browser tabs)

2. **Marlin Tab Layout:**

   - **Question:** 3-panel like Main tab, or different layout?
   - **Recommendation:** 3-panel for consistency

3. **Settings Organization:**
   - **Question:** Accordions, nested tabs, or flat list?
   - **Recommendation:** Start flat, add categories if >10 settings

### 10.3 Future Enhancements

1. **Multiple Connections:** Support streaming to multiple printers simultaneously?
2. **Profiles:** Save connection profiles (port, baud, name) for quick switching?
3. **Macros:** Define reusable command sequences (e.g., "Home + Preheat")?
4. **Terminal:** Full REPL-style terminal for advanced users?
5. **Simulation:** Show simulated path before streaming?

---

## 11. Timeline Estimates

**Assumptions:**

- 1 developer, part-time (4-6 hours/day)
- Includes testing and documentation
- Buffer for unknowns (+25%)

| Phase | Description                      | Estimated Days | Cumulative |
| ----- | -------------------------------- | -------------- | ---------- |
| 1     | Tab Navigation Foundation        | 3 days         | 3 days     |
| 2     | Settings Tab Implementation      | 4 days         | 7 days     |
| 3     | Marlin Tab UI & State Setup      | 4 days         | 11 days    |
| 4     | Serial Port Discovery            | 3 days         | 14 days    |
| 5     | Rust Marlin Implementation (MVP) | 5 days         | 19 days    |
| 6     | Enhanced Connection Features     | 3 days         | 22 days    |
| 7     | Pause/Resume & Statistics        | 4 days         | 26 days    |
| 8     | Stream Visualization             | 6 days         | 32 days    |
| 9     | Polish & Documentation           | 5 days         | 37 days    |

**Total:** ~5.5 weeks (37 working days) for full implementation

**MVP (Phases 1-5):** ~3 weeks (19 working days) - Core streaming working
**Full Feature (Phases 1-7):** ~4 weeks (26 working days) - All streaming features

---

## 12. Next Steps

1. **Review this document** with stakeholders/team
2. **Revise based on feedback** (architecture, scope, timeline)
3. **Create roadmap-v4.md** with phases broken into tasks
4. **Set up tabsgui branch** (already done)
5. **Begin Phase 1** implementation

---

## Revision History

| Version | Date       | Author      | Changes                                 |
| ------- | ---------- | ----------- | --------------------------------------- |
| 1.0     | 2026-01-08 | AI Planning | Initial comprehensive planning document |
