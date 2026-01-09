# Stream Tab UI/UX Design Specification

**Version:** v4 (Minimal Viable Marlin Controller)  
**Last Updated:** 2026-01-09

---

## Design Philosophy

The Stream tab provides a **complete, minimal G-code controller** for Marlin-based machines. The design prioritizes:

1. **Safety First** - Emergency stop always accessible
2. **Clear Workflow** - Connection → Test → Stream progression
3. **Immediate Feedback** - All actions produce visible responses
4. **Essential Features Only** - No clutter, every element serves a purpose

---

## Layout Overview

### Two-Panel Horizontal Split

```
┌──────────────────────────────────────────────────────┐
│  Stream Tab                                          │
├─────────────────────┬────────────────────────────────┤
│  Controls (Left)    │  Output Log (Right)            │
│  ~400px fixed       │  Flexible width                │
│                     │                                │
│  [3 vertical        │  [Scrollable log with          │
│   sections]         │   syntax highlighting]         │
│                     │                                │
└─────────────────────┴────────────────────────────────┘
```

**Rationale:**
- **Left panel (controls):** Fixed width for consistency, contains all interactive elements
- **Right panel (log):** Expands to fill space, shows command/response history
- **Vertical separation:** Clear functional distinction (input vs output)

---

## Left Panel: Control Sections

### Section 1: Connection

**Purpose:** Establish serial connection to Marlin controller

**Elements:**
```
┌─────────────────────────────┐
│ CONNECTION                  │
├─────────────────────────────┤
│ Port:  [COM3 ▼]  [↻]       │
│ Baud:  [250000 ▼]          │
│                             │
│ Status: ● Disconnected      │
│                             │
│ [Connect]                   │
└─────────────────────────────┘
```

**Components:**
- **Port Selector:** Dropdown populated by `marlin_list_ports`
  - Shows: "COM3 - Arduino Mega (USB VID:PID=2341:0042)"
  - Format: `{port} - {description}`
  - Empty state: "No ports found"

- **Refresh Button (↻):** 
  - Icon: `RefreshCw` from lucide-react
  - Action: Re-query available ports
  - Tooltip: "Refresh ports"

- **Baud Rate Selector:** Dropdown with common rates
  - Options: 115200, 250000, 500000
  - Default: 250000 (most common for Marlin)

- **Status Indicator:**
  - ● Red "Disconnected" (initial)
  - ● Green "Connected to {port}" (after connect)
  - ● Orange "Connecting..." (during connection)
  - ● Yellow "Paused" (during streaming pause)

- **Connect/Disconnect Button:**
  - State 1: "Connect" (enabled when port selected, disconnected)
  - State 2: "Disconnect" (enabled when connected)
  - Loading state: Shows spinner during connection

**Interaction Flow:**
1. User selects port from dropdown
2. Optionally changes baud rate
3. Clicks Connect
4. Status changes to "Connecting..."
5. On success: Status → "Connected", button → "Disconnect"
6. On failure: Error toast, status remains "Disconnected"

**Error Handling:**
- Port not found: "Port {port} not found. Check connection."
- Connection timeout: "Connection timed out. Check baud rate and port."
- Permission denied: "Cannot access {port}. Check permissions."

---

### Section 2: Manual Control

**Purpose:** Send individual G-code commands for testing and machine preparation

**Elements:**
```
┌─────────────────────────────┐
│ MANUAL CONTROL              │
├─────────────────────────────┤
│ [Home] [Get Pos]            │
│ [E-Stop] [Motors]           │
│                             │
│ Command:                    │
│ [____________________]      │
│                      [Send] │
└─────────────────────────────┘
```

**Common Command Buttons:**

1. **Home (G28)**
   - Icon: `Home` from lucide-react
   - Tooltip: "Home all axes (G28)"
   - Action: Sends "G28" command
   - Use case: Required before most operations

2. **Get Position (M114)**
   - Icon: `MapPin` from lucide-react
   - Tooltip: "Get current position (M114)"
   - Action: Sends "M114" command
   - Use case: Verify machine state before/after operations

3. **Emergency Stop (M112)**
   - Icon: `AlertOctagon` from lucide-react
   - Tooltip: "Emergency stop (M112)"
   - Action: Sends "M112" command immediately
   - Style: Red/orange color for visibility
   - Use case: Safety - halt all motion immediately

4. **Disable Motors (M18)**
   - Icon: `Power` from lucide-react
   - Tooltip: "Disable stepper motors (M18)"
   - Action: Sends "M18" command
   - Use case: After streaming, prevent motor overheating

**Button Layout:**
- 2×2 grid for common commands
- Equal button sizes (square-ish)
- Icon + label for clarity
- Adequate spacing (8-12px gaps)

**Command Input Field:**
- Single-line text input
- Placeholder: "Enter G-code command (e.g., G0 X10 Y20)"
- Width: Full section width minus Send button
- Enter key: Submits command
- Clears after successful send

**Send Button:**
- Label: "Send" or icon only (`Send` from lucide-react)
- Loading state: Spinner replaces icon/label
- Disabled when: Not connected OR command empty OR loading

**Behavior:**
- All elements disabled when not connected
- Loading indicator on button during command execution
- Input clears after successful send
- Focus returns to input for rapid commands

**Error Handling:**
- Command fails: Error message in log (red)
- Timeout: "Command timed out. Check connection."
- Invalid command: Marlin error shown in log

---

### Section 3: File Streaming

**Purpose:** Stream complete G-code files to Marlin with progress tracking

**Elements:**
```
┌─────────────────────────────┐
│ FILE STREAMING              │
├─────────────────────────────┤
│ File: test.gcode            │
│       [Select File]         │
│                             │
│ Progress:                   │
│ ▓▓▓▓▓▓░░░░░░░░░░░░░ 42/100 │
│                             │
│ Current: G1 X10 Y20 F3000   │
│                             │
│ [Start Stream]              │
│ [Pause] [Stop]              │
└─────────────────────────────┘
```

**File Selection:**
- Button: "Select File" (opens Tauri file dialog)
- Filter: `*.gcode` files only
- Display: Filename only (not full path)
- State: Shows "No file selected" initially

**Progress Bar:**
- Visual: Horizontal bar with fill
- Label: "N / Total" format (e.g., "42 / 100")
- Updates: Real-time on each `stream-progress` event
- Color: Blue fill for progress

**Current Command Display:**
- Label: "Current:"
- Shows: Most recent G-code command being executed
- Updates: Real-time during streaming
- Style: Monospace font, truncate if too long

**Control Buttons:**

1. **Start Stream**
   - Enabled when: Connected AND file selected AND not streaming
   - Action: Sends `marlin_stream_file` command
   - Loading state: "Streaming..." with spinner
   
2. **Pause**
   - Enabled when: Streaming (not paused)
   - Action: Sends M0 via `marlin_pause`
   - Result: Status → "Paused", button becomes "Resume"

3. **Resume**
   - Enabled when: Paused
   - Action: Sends M108 via `marlin_resume`
   - Result: Status → "Connected", streaming continues

4. **Stop**
   - Enabled when: Streaming or paused
   - Action: Cancels streaming (implementation TBD)
   - Confirmation: "Stop streaming? Progress will be lost."

**Button Layout:**
- Start Stream: Full width, primary action
- Pause/Resume: Half width (left)
- Stop: Half width (right), destructive color

**Streaming States:**
- **Idle:** Start Stream enabled, Pause/Stop disabled
- **Streaming:** Start Stream disabled, Pause enabled, Stop enabled
- **Paused:** Start Stream disabled, Resume enabled, Stop enabled

---

## Right Panel: Output Log

**Purpose:** Display all command output, responses, and status messages with clear visual distinction

**Elements:**
```
┌────────────────────────────────────┐
│ Output Log                  [Clear]│
├────────────────────────────────────┤
│ [Connected] Connected to COM3      │
│ [Command] M114                     │
│ [Response] X:0.00 Y:0.00 Z:0.00   │
│ [Response] ok                      │
│ [Info] Streaming file.gcode...    │
│ [Stream] G1 X10 Y20 F3000         │
│ [Stream] ok                        │
│ [Progress] 42 / 100                │
│ [Error] Connection lost            │
│                                    │
│ ... (scrollable) ...               │
└────────────────────────────────────┘
```

### Entry Types & Styling

**1. Info (Connection/Status)**
- Prefix: `[Info]` or `[●]`
- Color: Gray (#64748b)
- Font: Regular
- Example: "Connected to COM3", "Streaming started"

**2. Command (User Input)**
- Prefix: `[>]` or `[Command]`
- Color: Blue (#60a5fa)
- Font: Bold, Monospace
- Example: "> M114", "> G28"

**3. Response (Marlin Output)**
- Prefix: `[<]` or `[Response]`
- Color: Green (#4ade80)
- Font: Regular, Monospace
- Example: "< X:0.00 Y:0.00 Z:0.00", "< ok"

**4. Stream (File Commands)**
- Prefix: `[Stream]` or none
- Color: Light Gray (#94a3b8)
- Font: Regular, Monospace, Smaller
- Example: "G1 X10 Y20 F3000", "ok"

**5. Progress (Stream Status)**
- Prefix: `[Progress]` or `[→]`
- Color: Cyan (#22d3ee)
- Font: Regular
- Example: "Progress: 42 / 100 (42%)"

**6. Error (Failures)**
- Prefix: `[Error]` or `[!]`
- Color: Red (#f87171)
- Font: Bold
- Example: "Error: Connection timeout", "Error: Invalid command"

### Log Behavior

**Auto-scroll:**
- Automatically scrolls to bottom on new entries
- User can scroll up to read history
- If user scrolls up, auto-scroll pauses
- "Scroll to bottom" button appears when not at bottom

**Clear Button:**
- Location: Top-right of log panel
- Action: Clears all log entries
- Confirmation: None (entries are temporary)
- Icon: `Trash2` from lucide-react

**Performance:**
- Virtualized rendering for large logs (1000+ entries)
- Entry limit: 5000 entries, oldest removed first
- Entries stored in Zustand store

**Copy/Export (v5):**
- v4: Manual selection + Ctrl+C
- v5: "Copy All" and "Export to File" buttons

---

## State Management

### Zustand Store (streamStore)

```typescript
interface StreamStore {
  // Connection
  connected: boolean;
  connecting: boolean;
  port: string | null;
  baudRate: number;
  ports: SerialPort[];
  
  // Streaming
  streaming: boolean;
  paused: boolean;
  selectedFile: string | null;
  progress: {
    sent: number;
    total: number;
  };
  currentCommand: string | null;
  
  // Manual Control
  commandLoading: boolean;
  
  // Log
  log: LogEntry[];
  
  // Actions
  setConnected: (connected: boolean) => void;
  setPort: (port: string) => void;
  setBaudRate: (rate: number) => void;
  setPorts: (ports: SerialPort[]) => void;
  setStreaming: (streaming: boolean) => void;
  setPaused: (paused: boolean) => void;
  setSelectedFile: (file: string | null) => void;
  updateProgress: (sent: number, total: number) => void;
  setCurrentCommand: (command: string | null) => void;
  addLogEntry: (entry: LogEntry) => void;
  clearLog: () => void;
}

interface LogEntry {
  id: string;
  type: 'info' | 'command' | 'response' | 'stream' | 'progress' | 'error';
  content: string;
  timestamp: number;
}

interface SerialPort {
  port: string;
  description: string;
  hwid: string;
}
```

---

## User Workflows

### Workflow 1: Test Connection

**Goal:** Verify Marlin controller is responding

1. User selects port from dropdown
2. User clicks "Connect"
3. Status shows "Connecting..."
4. Log shows "[Info] Connecting to COM3..."
5. Status changes to "Connected to COM3"
6. Log shows "[Info] Connected to COM3"
7. User clicks "Get Position" button
8. Log shows "[Command] M114"
9. Log shows "[Response] X:0.00 Y:0.00 Z:0.00"
10. Log shows "[Response] ok"
11. User confirms connection works

**Duration:** ~10 seconds

---

### Workflow 2: Home and Stream File

**Goal:** Prepare machine and stream G-code file

1. User is connected (from Workflow 1)
2. User clicks "Home" button
3. Log shows "[Command] G28"
4. Machine homes (takes 30-60 seconds)
5. Log shows "[Response] ok"
6. User clicks "Select File"
7. File dialog opens, user selects "test.gcode"
8. Filename displays in File Streaming section
9. User clicks "Start Stream"
10. Log shows "[Info] Streaming test.gcode..."
11. Progress bar starts updating (1/100, 2/100, ...)
12. Current command updates with each G-code line
13. Log shows streaming output (gray, compact)
14. When complete: Log shows "[Info] Streaming complete"
15. Progress shows "100 / 100"

**Duration:** Varies by file size (1-30 minutes typical)

---

### Workflow 3: Emergency Stop During Stream

**Goal:** Halt machine immediately if something goes wrong

1. Streaming is in progress (from Workflow 2)
2. User notices problem (collision, wrong movement, etc.)
3. User clicks "E-Stop" button
4. Command sent immediately: "[Command] M112"
5. Machine halts all motion
6. Log shows "[Error] Emergency stop activated"
7. User can disconnect or diagnose issue

**Duration:** <1 second (critical for safety)

---

### Workflow 4: Pause and Resume Stream

**Goal:** Temporarily halt streaming, then continue

1. Streaming is in progress
2. User clicks "Pause"
3. M0 command sent
4. Status shows "Paused"
5. Pause button changes to "Resume"
6. User can inspect machine, adjust, etc.
7. User clicks "Resume"
8. M108 command sent
9. Status shows "Connected"
10. Streaming continues from where it paused

**Duration:** Pause duration varies by user inspection

---

## Responsive Behavior

### Window Sizes

**Minimum Width:** 900px
- Left panel: 350px (compressed)
- Right panel: 550px (minimum readable)

**Typical Width:** 1200px+
- Left panel: 400px
- Right panel: 800px

**Maximum Width:** Unlimited
- Left panel: 400px (fixed)
- Right panel: Expands to fill

### Panel Resize (v5)

- v4: Fixed split (400px left, rest right)
- v5: Draggable divider between panels
- v5: Persist split preference in settings

---

## Accessibility

### Keyboard Navigation (v4)

- **Tab:** Cycle through interactive elements in logical order
- **Enter:** Activate focused button, submit command input
- **Escape:** Cancel/close operations (future dialogs)
- **Alt+1/2:** Switch between Main and Stream tabs

### Focus Order

1. Port selector
2. Refresh button
3. Baud rate selector
4. Connect button
5. Home button
6. Get Position button
7. E-Stop button
8. Disable Motors button
9. Command input
10. Send button
11. Select File button
12. Start Stream button
13. Pause button
14. Stop button
15. Clear Log button

### Screen Reader Support (v5)

- v4: Basic HTML semantics
- v5: ARIA labels, live regions for status updates

---

## Visual Design

### Color Palette

**Status Indicators:**
- Green (#22c55e): Connected, Success
- Red (#ef4444): Disconnected, Error, E-Stop
- Orange (#f97316): Connecting, Warning
- Yellow (#eab308): Paused
- Gray (#64748b): Neutral, Info

**Log Entry Types:**
- Command: Blue (#60a5fa)
- Response: Green (#4ade80)
- Stream: Light Gray (#94a3b8)
- Error: Red (#f87171)
- Progress: Cyan (#22d3ee)
- Info: Gray (#64748b)

**Interactive Elements:**
- Primary button: Blue background (#3b82f6)
- Destructive button: Red background (#ef4444)
- E-Stop button: Orange/Red (#f97316)
- Disabled: Gray opacity (0.5)

### Typography

**Fonts:**
- UI Text: System font stack (default)
- Monospace: 'Consolas', 'Monaco', 'Courier New', monospace

**Sizes:**
- Section headers: 14px, uppercase, bold
- Button labels: 13px
- Input fields: 14px
- Log entries: 13px (stream: 12px)

### Spacing

**Sections:**
- Between sections: 20px vertical gap
- Section padding: 16px
- Border: 1px solid #e2e8f0

**Controls:**
- Button gaps: 8px
- Input padding: 8px 12px
- Button padding: 8px 16px

---

## Performance Considerations

### Log Rendering

**Challenge:** Large files generate thousands of log entries

**Solution:**
- Virtualized scrolling (react-window)
- Max 5000 entries in memory
- Compact stream entries (smaller font, less detail)

**Metrics:**
- 10,000 command file: ~10,000 log entries
- Target: 60 FPS during streaming
- Entry rendering: <1ms per entry

### Progress Updates

**Challenge:** High-frequency updates during streaming

**Solution:**
- Throttle UI updates to 60 FPS (16ms intervals)
- Batch log entries (add 10 at once vs 10 individual adds)
- Update progress bar on requestAnimationFrame

---

## Error States

### Connection Errors

**Port not found:**
- Toast: "Port {port} not found. Check connection and try again."
- Action: Disconnect, show port selector

**Connection timeout:**
- Toast: "Connection timed out. Verify baud rate is correct."
- Action: Disconnect, allow retry

**Permission denied:**
- Toast: "Cannot access {port}. Close other apps using this port."
- Action: Disconnect, show troubleshooting link

### Streaming Errors

**File not found:**
- Toast: "File not found. Please select a valid G-code file."
- Action: Clear file selection

**Connection lost during stream:**
- Toast: "Connection lost. Streaming stopped at command {N}."
- Action: Disconnect, log error, stop streaming

**Marlin error response:**
- Log: "[Error] {marlin_error_message}"
- Action: Continue streaming OR stop if critical

---

## Future Enhancements (v5+)

### v5 Additions

- **Settings Tab:** Persist port/baud preferences
- **Command History:** Up/down arrows, last 50 commands
- **Response Parsing:** Extract coordinates from M114, display structured
- **Statistics:** ETA, elapsed time, progress percentage
- **Log Enhancements:** Timestamps, filtering, export to file

### v6+ Considerations

- **3-Panel Layout:** Add visualization panel
- **Real-time 3D:** Show toolpath as it streams
- **Custom Buttons:** User-defined G-code macros

---

## Design Rationale

### Why 3 Vertical Sections?

**Problem:** Users need to perform distinct operations in sequence

**Solution:** Separate sections for connection → testing → streaming

**Benefits:**
- Clear workflow progression (top to bottom)
- Each section independent and self-contained
- Visual hierarchy matches mental model

### Why Common Command Buttons?

**Problem:** Typing "G28" and "M114" repeatedly is tedious and error-prone

**Solution:** One-click buttons for most common commands

**Benefits:**
- Faster operation (click vs type + enter)
- Prevents typos (G28 vs G23, M114 vs M144)
- Onboards new users (buttons show what's possible)

### Why Separate Log Panel?

**Problem:** Mixing controls and output causes visual clutter

**Solution:** Dedicated scrollable log panel

**Benefits:**
- Log can grow without affecting controls
- Users can scroll history while controls remain visible
- Clear input/output separation

### Why Not 3 Panels (Controls | Log | Visualization)?

**v4 Decision:** Visualization adds complexity without immediate value

**Rationale:**
- Users need working controller first
- 3D viz is nice-to-have, not essential
- Can add in v5 after gathering user feedback

---

## Success Criteria

### v4 Complete When:

1. ✅ User can connect to Marlin controller
2. ✅ User can send manual G-code commands
3. ✅ User can home machine with one click
4. ✅ User can emergency stop with one click
5. ✅ User can select and stream G-code file
6. ✅ User can see real-time streaming progress
7. ✅ User can pause and resume streaming
8. ✅ All commands/responses visible in log
9. ✅ Works on Windows, macOS, Linux
10. ✅ No critical bugs, smooth 60 FPS performance

---

**Document Status:** Final  
**Implementation Start:** Phase 2 (Tauri Integration)  
**Expected Completion:** 2 weeks from start
