# Architecture Decision - Connection-Centric MarlinStreamer

**Date:** 2026-01-08  
**Status:** ✅ DECISION MADE - Python Refactor

---

## Executive Summary

**FINDING:** The current Python `MarlinStreamer` is **file-centric** (load program → stream → disconnect), but the GUI requires a **connection-centric workflow** (connect → send commands → stream file → send more commands → disconnect).

**DECISION:** Refactor Python `MarlinStreamer` to support connection-centric workflow. This keeps the core program in Python (accessible to more developers) while enabling the GUI use case.

---

## Problem Analysis

### Current Python MarlinStreamer Limitations

**Architecture:**

```python
class MarlinStreamer:
    def __init__(self, port, baud_rate, timeout): ...
    def load_program(self, commands: Sequence[str]): ...  # Must load ALL commands upfront
    def iter_stream(self, dry_run=False) -> Iterator[StreamProgress]: ...  # Streams entire program
    def pause(self) / resume(self) / close(self): ...
    def _send_command(self, command: str) -> None: ...  # PRIVATE - not exposed
```

**Critical Issues:**

1. **No public API for single command sending**

   - `_send_command()` is private
   - Only way to send commands is via `load_program()` + `iter_stream()`
   - Can't send G28, M114, etc. without loading a full program

2. **No "connect and wait" mode**

   - Connection is lazy (happens on first `iter_stream()` call)
   - No way to connect without immediately streaming
   - Can't check connection status without attempting to send

3. **Program-centric lifecycle**

   - Must `load_program()` before streaming
   - Can't switch between single commands and file streaming
   - Would need to load single-command "programs" for each G28/M114 - extremely awkward

4. **No connection reuse**
   - Designed for: connect → stream file → disconnect
   - Not designed for: connect → command → command → stream → command → disconnect
   - Would need major refactoring to support

### Desired GUI Workflow

**User Experience:**

```
1. User selects COM3 from dropdown
2. User clicks "Connect" button
3. Status shows "Connected to COM3"
4. User clicks "Home X" button → sends G28 X → sees "ok" response
5. User clicks "Get Position" button → sends M114 → sees "X:0.00 Y:100.00..."
6. User selects gcode file and clicks "Start Stream"
7. Progress bar shows real-time streaming
8. User clicks "Pause" → streaming pauses
9. User clicks "Resume" → streaming continues
10. Stream completes
11. User sends more test commands
12. User clicks "Disconnect"
```

**This workflow is IMPOSSIBLE with current Python implementation without major changes.**

---

## Python Refactor Plan

### Required Changes (Minimal)

**1. Make `send_command()` public** (~5 lines)

- Rename `_send_command()` to `send_command()`
- Allow calling without `load_program()`
- Return list of response lines for GUI display

**2. Add explicit `connect()` method** (~15 lines)

- Make connection explicit (not lazy)
- Wait for Marlin startup banner
- Return connection status
- Allow connecting without streaming

**3. Add `is_connected()` property** (~3 lines)

- Query connection state
- GUI can check before sending commands

**4. Make `load_program()` optional** (~5 lines)

- `iter_stream()` can work without pre-loaded program
- Backwards compatible (CLI unchanged)

**Total refactor:** ~30 lines in `marlin.py`

### New API

```python
class MarlinStreamer:
    def connect(self) -> bool:
        """Establish connection, wait for startup banner."""

    def send_command(self, command: str) -> list[str]:
        """Send single command, return response lines."""

    def load_program(self, commands: Sequence[str]) -> None:
        """Load program for streaming (optional, backwards compat)."""

    def iter_stream(self, *, dry_run: bool = False) -> Iterator[StreamProgress]:
        """Stream program (works with or without load_program)."""

    @property
    def is_connected(self) -> bool:
        """Check if connected to Marlin."""
```

### GUI Integration Approach

**Option A: JSON Protocol via stdin/stdout** (Recommended)

```python
# New: fiberpath_cli/interactive.py
import json
import sys

streamer = MarlinStreamer(...)

for line in sys.stdin:
    cmd = json.loads(line)

    if cmd["action"] == "connect":
        result = streamer.connect()
        print(json.dumps({"status": "connected", "success": result}))

    elif cmd["action"] == "send":
        responses = streamer.send_command(cmd["gcode"])
        print(json.dumps({"status": "ok", "responses": responses}))

    elif cmd["action"] == "stream":
        commands = load_gcode_file(cmd["file"])
        for progress in streamer.iter_stream():
            print(json.dumps({"status": "progress", "data": asdict(progress)}))
```

**Tauri Backend** (~150 lines):

- Spawn Python subprocess with `fiberpath interactive`
- Send JSON commands via stdin
- Parse JSON responses from stdout
- Emit events to frontend

**Total implementation:** ~200 lines (30 Python + 20 CLI + 150 Tauri)

## Comparison vs Rust Native

| Aspect           | Python Refactor                         | Rust Native                 |
| ---------------- | --------------------------------------- | --------------------------- |
| Lines of code    | ~200 total                              | ~300 total                  |
| Core language    | Python (accessible)                     | Rust (less accessible)      |
| Code duplication | None (reuses MarlinStreamer)            | Yes (reimplements protocol) |
| CLI impact       | None (backwards compatible)             | None                        |
| Development time | 2-3 days                                | 3-4 days                    |
| Maintenance      | Single codebase                         | Two implementations         |
| Performance      | Excellent (subprocess overhead minimal) | Excellent (native)          |

## Decision Rationale

**Why Python Refactor:**

1. ✅ **Accessibility**: Core stays Python, more developers can contribute
2. ✅ **No duplication**: GUI reuses exact same MarlinStreamer as CLI
3. ✅ **Simpler**: ~200 lines vs ~300 lines
4. ✅ **Backwards compatible**: CLI unchanged, no breaking changes
5. ✅ **Faster**: 2-3 days vs 3-4 days for Rust
6. ✅ **Single source of truth**: One Marlin implementation

**Trade-offs:**

- Subprocess overhead (minimal, ~1-2ms per command)
- JSON parsing (negligible for streaming use case)

**Conclusion:** Python refactor is the right choice. Keeps core accessible, avoids duplication, faster to implement.

## Old Options Considered

### Option A: Refactor Python for GUI Use Case

**Changes Required:**

1. Add public `send_command(cmd: str) -> str` method
2. Add public `connect()` method (without requiring program)
3. Add `is_connected()` property
4. Make connection lifecycle independent of program
5. Add stdin/stdout JSON protocol for long-lived subprocess
6. Handle connection persistence between operations

**Estimated Effort:** 3-5 days
**Pros:**

- Reuse existing code
- Python CLI stays unchanged
- No Marlin protocol reimplementation

**Cons:**

- Subprocess overhead (spawn, IPC, JSON parsing)
- Complex lifecycle management (when does subprocess die?)
- Harder error handling across process boundary
- Still have duplicate logic (CLI and GUI both need MarlinStreamer changes)
- Would need to refactor Python CLI anyway to support "server mode"

### Option B: Implement Marlin Protocol in Rust (RECOMMENDED)

**Marlin Serial Protocol (Simple):**

```
1. Connect to serial port
2. Wait for startup banner (consume lines until quiet for 0.5s)
3. Send: "G28 X\n"
4. Read lines until "ok" (ignore "echo:busy", log other responses)
5. Send next command
```

**Implementation Size:** ~300 lines of Rust
**Estimated Effort:** 2-3 days

**Pros:**

- ✅ Full control over connection lifecycle
- ✅ No subprocess overhead - native performance
- ✅ Better error handling (Result<T, Error> all the way)
- ✅ Type-safe communication (no JSON parsing)
- ✅ Can reuse `serialport` crate (already need it for port enumeration)
- ✅ Python CLI remains untouched - no breaking changes
- ✅ Cleaner architecture - GUI and CLI are independent
- ✅ Easier to add features (command history, better timeout handling, reconnection logic)

**Cons:**

- ❌ Need to reimplement Marlin protocol (but it's simple)
- ❌ Slight code duplication with Python (but minimal - ~300 lines)

**Code Estimate:**

```rust
// src-tauri/src/marlin.rs (~300 lines)

pub struct MarlinConnection {
    port: Box<dyn serialport::SerialPort>,
    timeout: Duration,
}

impl MarlinConnection {
    pub fn connect(port: &str, baud_rate: u32, timeout: Duration) -> Result<Self> { ... }

    pub fn send_command(&mut self, cmd: &str) -> Result<String> {
        // Write command + newline
        // Read until "ok" or error
        // Handle "echo:busy"
        // Return response
    }

    pub fn stream_file<F>(&mut self, path: PathBuf, progress_fn: F) -> Result<()>
    where F: Fn(usize, usize, &str) {
        // Read file line by line
        // Send each command
        // Call progress_fn after each
    }

    fn wait_for_ok(&mut self) -> Result<Vec<String>> { ... }
    fn wait_for_startup(&mut self) -> Result<()> { ... }
}
```

### Option C: Hybrid (NOT RECOMMENDED)

- Use Python for file streaming
- Use Rust for single commands
- **Problem:** Two implementations of same protocol, inconsistent behavior, maintenance nightmare

---

## Critical Decision Matrix

| Criterion                | Python Refactor        | Rust Native            | Hybrid     |
| ------------------------ | ---------------------- | ---------------------- | ---------- |
| **Development Time**     | 3-5 days               | 2-3 days               | 4-6 days   |
| **Code Complexity**      | High (subprocess, IPC) | Medium (protocol impl) | Very High  |
| **Performance**          | Poor (subprocess)      | Excellent              | Poor       |
| **Maintainability**      | Poor                   | Excellent              | Terrible   |
| **Error Handling**       | Complex                | Clean                  | Complex    |
| **Connection Lifecycle** | Hard                   | Easy                   | Hard       |
| **Python CLI Impact**    | Breaking changes       | None                   | None       |
| **Type Safety**          | JSON parsing           | Full type safety       | Mixed      |
| **UX Quality**           | Acceptable             | Excellent              | Acceptable |

**RECOMMENDATION:** **Option B - Rust Native Implementation**

---

## Revised Architecture

### Rust Marlin Module

**File:** `src-tauri/src/marlin.rs`

```rust
use serde::{Deserialize, Serialize};
use serialport::SerialPort;
use std::io::{BufRead, BufReader, Write};
use std::time::{Duration, Instant};

#[derive(Debug, thiserror::Error)]
pub enum MarlinError {
    #[error("Serial port error: {0}")]
    Serial(#[from] serialport::Error),

    #[error("Timeout waiting for response")]
    Timeout,

    #[error("Marlin reported error: {0}")]
    MarlinError(String),

    #[error("Not connected")]
    NotConnected,
}

pub type Result<T> = std::result::Result<T, MarlinError>;

#[derive(Debug, Clone, Serialize)]
pub struct StreamProgress {
    pub sent: usize,
    pub total: usize,
    pub command: String,
}

pub struct MarlinConnection {
    port: Box<dyn SerialPort>,
    reader: BufReader<Box<dyn SerialPort>>,
    timeout: Duration,
}

impl MarlinConnection {
    pub fn connect(port_name: &str, baud_rate: u32, timeout_secs: f64) -> Result<Self> {
        let timeout = Duration::from_secs_f64(timeout_secs);

        let port = serialport::new(port_name, baud_rate)
            .timeout(timeout)
            .open()?;

        let reader = BufReader::new(port.try_clone()?);

        let mut conn = Self { port, reader, timeout };
        conn.wait_for_startup()?;

        Ok(conn)
    }

    pub fn send_command(&mut self, command: &str) -> Result<Vec<String>> {
        writeln!(self.port, "{}", command)?;
        self.port.flush()?;

        let responses = self.wait_for_ok()?;
        Ok(responses)
    }

    pub fn stream_gcode_file<F>(&mut self, path: &Path, mut progress_fn: F) -> Result<()>
    where
        F: FnMut(StreamProgress),
    {
        let content = std::fs::read_to_string(path)?;
        let lines: Vec<&str> = content.lines()
            .map(|l| l.trim())
            .filter(|l| !l.is_empty() && !l.starts_with(';'))
            .collect();

        let total = lines.len();

        for (i, line) in lines.iter().enumerate() {
            self.send_command(line)?;

            progress_fn(StreamProgress {
                sent: i + 1,
                total,
                command: line.to_string(),
            });
        }

        Ok(())
    }

    fn wait_for_ok(&mut self) -> Result<Vec<String>> {
        let deadline = Instant::now() + self.timeout;
        let mut responses = Vec::new();

        loop {
            if Instant::now() > deadline {
                return Err(MarlinError::Timeout);
            }

            let mut line = String::new();
            self.reader.read_line(&mut line)?;

            let line = line.trim();
            if line.is_empty() {
                continue;
            }

            if line == "ok" {
                return Ok(responses);
            }

            if line.starts_with("echo:busy") {
                // Reset deadline for busy operations
                let deadline = Instant::now() + self.timeout;
                continue;
            }

            if line.starts_with("Error") {
                return Err(MarlinError::MarlinError(line.to_string()));
            }

            responses.push(line.to_string());
        }
    }

    fn wait_for_startup(&mut self) -> Result<()> {
        let start = Instant::now();
        let startup_timeout = Duration::from_secs(5);
        let quiet_period = Duration::from_millis(500);
        let mut last_line_time = start;

        while start.elapsed() < startup_timeout {
            let mut line = String::new();
            match self.reader.read_line(&mut line) {
                Ok(0) => break,  // EOF
                Ok(_) => {
                    if !line.trim().is_empty() {
                        last_line_time = Instant::now();
                    }
                }
                Err(_) => break,
            }

            if last_line_time.elapsed() >= quiet_period {
                return Ok(());
            }
        }

        Ok(())
    }
}
```

### Tauri Commands

```rust
// src-tauri/src/main.rs

use std::sync::Mutex;
use tauri::State;

struct MarlinState {
    connection: Mutex<Option<MarlinConnection>>,
}

#[tauri::command]
fn marlin_connect(
    state: State<MarlinState>,
    port: String,
    baud_rate: u32,
    timeout: f64,
) -> Result<String, String> {
    let conn = MarlinConnection::connect(&port, baud_rate, timeout)
        .map_err(|e| e.to_string())?;

    *state.connection.lock().unwrap() = Some(conn);

    Ok(format!("Connected to {} at {} baud", port, baud_rate))
}

#[tauri::command]
fn marlin_disconnect(state: State<MarlinState>) -> Result<(), String> {
    *state.connection.lock().unwrap() = None;
    Ok(())
}

#[tauri::command]
fn marlin_send_command(
    state: State<MarlinState>,
    command: String,
) -> Result<Vec<String>, String> {
    let mut conn_guard = state.connection.lock().unwrap();
    let conn = conn_guard.as_mut().ok_or("Not connected")?;

    conn.send_command(&command).map_err(|e| e.to_string())
}

#[tauri::command]
async fn marlin_stream_file(
    app: tauri::AppHandle,
    state: State<'_, MarlinState>,
    file_path: String,
) -> Result<(), String> {
    let mut conn_guard = state.connection.lock().unwrap();
    let conn = conn_guard.as_mut().ok_or("Not connected")?;

    conn.stream_gcode_file(Path::new(&file_path), |progress| {
        let _ = app.emit_all("stream-progress", progress);
    })
    .map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .manage(MarlinState {
            connection: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            list_serial_ports,
            marlin_connect,
            marlin_disconnect,
            marlin_send_command,
            marlin_stream_file,
            // ... existing commands
        ])
        .run(tauri::generate_context!())
        .expect("error while running FiberPath GUI");
}
```

---

## Impact Analysis

### Python CLI

**No changes required.** The CLI continues to work exactly as before. Users can still:

- `fiberpath stream file.gcode --port COM3`
- `fiberpath stream file.gcode --dry-run`
- All existing flags and behavior preserved

### GUI

**Clean separation.** The GUI gets a dedicated, purpose-built Marlin implementation that:

- Supports the connection-centric workflow naturally
- Has no subprocess overhead
- Provides type-safe error handling
- Makes the UX smooth and responsive

### Testing

Both implementations can be tested independently:

- Python CLI: existing test suite continues to work
- Rust Marlin: new unit tests + integration tests with mock serial port

---

## Conclusion

**DECISION: Implement Marlin communication in Rust for the GUI.**

**Justification:**

1. ✅ Faster development (2-3 days vs 3-5 days for Python refactor)
2. ✅ Better architecture (clean, type-safe, performant)
3. ✅ Superior UX (no subprocess lag, smoother connection management)
4. ✅ No breaking changes to Python CLI
5. ✅ Easier to maintain long-term
6. ✅ Marlin protocol is simple (~300 lines of Rust)

**Next Steps:**

1. Update TABS_PLANNING.md with Rust implementation approach
2. Update roadmap-v4.md Phase 5 to implement Rust Marlin module
3. Remove Python subprocess approach from planning
4. Add Marlin module implementation as Phase 5 prerequisite

---

**Approved:** ✅  
**Status:** Ready to proceed with Rust implementation
