# Marlin G-code Streaming Guide

## Overview

FiberPath streams G-code to Marlin-compatible hardware through a bundled local API sidecar that owns the serial port. The Stream tab provides a complete interface for connecting to hardware, sending manual commands, and streaming G-code files with real-time progress monitoring.

## Features

- **Serial Port Discovery** – Automatically detect available COM ports and USB serial devices
- **Connection Management** – Connect/disconnect with configurable baud rates
- **Manual Control** – Send custom G-code commands or use quick-access buttons for common operations
- **File Streaming** – Stream G-code files with zero-lag progress tracking
- **Pause/Resume/Cancel** – Sophisticated streaming control with distinct pause and cancel operations
- **Live Logging** – View command/response history with timestamps and status indicators
- **State Management** – Clean state handling after stop/cancel/reconnect operations
- **Keyboard Shortcuts** – Efficient control with `Alt+1/2` for tabs, `Ctrl+Enter` to send commands, `?` for help

---

## Getting Started

### Prerequisites

- Marlin-compatible hardware (3D printer, CNC, filament winder, etc.)
- USB serial connection
- FiberPath Desktop GUI v0.9.0 or later

### Connection Setup

1. **Open Stream Tab**
   - Click the **Stream** tab or press `Alt+2`

2. **Refresh Serial Ports**
   - Click the **Refresh Ports** button to scan for connected devices
   - Available ports will appear in the dropdown (e.g., `COM3`, `/dev/ttyUSB0`, `/dev/cu.usbserial-*`)

3. **Select Port and Baud Rate**
   - Choose your device from the port dropdown
   - Select the appropriate baud rate (common values: 115200, 250000, 500000)
   - **Note:** Check your Marlin firmware configuration for the correct baud rate

4. **Connect**
   - Click the **Connect** button
   - Status indicator will turn green when connected
   - Connection logs will appear in the right panel

5. **Disconnect**
   - Click the **Disconnect** button when finished
   - Always disconnect before unplugging hardware

---

## Manual Control

Once connected, use the Manual Control section to test communication and execute individual commands.

### Common Command Buttons

| Button             | G-code | Description                                          |
| ------------------ | ------ | ---------------------------------------------------- |
| **Home**           | `G28`  | Home all axes (or use `G28 X Y Z` for specific axes) |
| **Get Position**   | `M114` | Query current position of all axes                   |
| **Emergency Stop** | `M112` | Immediately halt all operations (use with caution)   |
| **Disable Motors** | `M84`  | Turn off stepper motors (allows manual positioning)  |

### Custom Commands

- Enter any valid G-code command in the text input
- Press `Enter` or `Ctrl+Enter` to send
- Commands are logged with their responses in the right panel
- Examples:
  - `G1 X10 Y10 F1000` – Move to X=10, Y=10 at 1000 mm/min
  - `G92 X0 Y0 Z0` – Set current position as origin
  - `M105` – Get temperature readings (for 3D printers)

**Tips:**

- Test connectivity with `M114` (Get Position) before streaming files
- Use `G28` to home axes before starting a winding pattern
- Keep manual commands short and simple for reliability

---

## File Streaming

Stream complete G-code files to hardware with zero-lag progress monitoring and refined control workflow.

### Streaming Workflow

1. **Select G-code File**
   - Click **Select G-code File** button
   - Choose a `.gcode`, `.nc`, or `.ngc` file from your filesystem
   - Selected filename displays with a clear button (X) to deselect

2. **Start Streaming**
   - Click **Start Stream** (enabled when connected and file selected)
   - Progress bar shows commands sent vs. total
   - Current command displays in real-time with zero lag
   - Log panel shows each command/response

3. **Monitor Progress**
   - Progress updates display as `N / Total commands`
   - Command display updates instantly (no queue lag)
   - Log entries show timestamps and status indicators

4. **Pause/Cancel/Stop Controls**

   The streaming interface provides sophisticated control options:

   **While Streaming:**
   - **Pause Button (Yellow)** – Asks the sidecar to pause the job; the host stops before sending the next line (no board-side buffer command)
   - **Stop Button (Red)** – Emergency M112, disconnects hardware (use with caution)

   **While Paused:**
   - **Resume Button (Green)** – Clears the host-side pause flag and continues streaming from the next line
   - **Cancel Job Button (Orange)** – Graceful exit, stays connected, ready for new file

### Control Button Behavior

| State         | Pause/Resume   | Cancel/Stop         | Description                      |
| ------------- | -------------- | ------------------- | -------------------------------- |
| **Streaming** | Pause (Yellow) | Stop (Red)          | Normal streaming state           |
| **Paused**    | Resume (Green) | Cancel Job (Orange) | Job paused, can resume or cancel |
| **Connected** | Start Stream   | -                   | Ready to stream                  |

**Key Differences:**

- **Cancel Job**: Clean exit while paused, connection maintained, no hardware command
- **Emergency Stop**: Sends M112 to Marlin, requires disconnect/reconnect

### Progress Monitoring

The Stream tab provides zero-lag progress indicators:

- **Progress Bar** – Visual representation of completion percentage
- **Command Counter** – Displays `N / Total` commands sent (updates instantly)
- **Current Command** – Shows the last command sent to hardware (no queue lag)
- **Log Panel** – Complete command/response history with timestamps

**How it stays current**: the sidecar records streaming progress into a monotonic event log as each line is acknowledged, and the GUI polls the job resource (`GET /machine/jobs/{id}?since=…`) for new entries. There is no event queue to drain, so the counter reflects the line the host is actually on.

### Stream Log Features

- **Auto-scroll** – Toggle button (blue when active) to follow new entries
- **Clear Log** – Button to reset the log (enabled when entries exist)
- **Entry Types** – Color-coded entries for commands (blue), responses (gray), errors (red), and events (green)
- **Timestamps** – All entries include precise timestamps for debugging

---

## Keyboard Shortcuts

Press `?` or click the help button in the Stream tab header to view all keyboard shortcuts:

| Shortcut     | Action                                              |
| ------------ | --------------------------------------------------- |
| `Alt+1`      | Switch to Main tab                                  |
| `Alt+2`      | Switch to Stream tab                                |
| `Ctrl+Enter` | Send manual command (when focused in command input) |
| `Escape`     | Clear command input                                 |
| `?`          | Show/hide keyboard shortcuts modal                  |

---

## Common Issues and Solutions

### Port Not Detected

**Symptoms:** No ports appear in the dropdown after refreshing

**Solutions:**

- Ensure hardware is powered on and connected via USB
- Check cable connections (some USB cables are charge-only, not data)
- Windows: Check Device Manager for COM port assignment
- Linux: Ensure user has permissions (`sudo usermod -a -G dialout $USER`, then log out/in)
- macOS: Look for `/dev/cu.usbserial-*` or `/dev/cu.usbmodem-*`

### Connection Failed

**Symptoms:** Connect button doesn't change status, or error appears in log

**Solutions:**

- Verify correct baud rate (check Marlin firmware configuration)
- Close other programs that might be using the serial port (e.g., Arduino IDE, Pronterface)
- Try disconnecting and reconnecting USB cable
- Restart the application

### No Response to Commands

**Symptoms:** Commands sent but no response appears in log

**Solutions:**

- Verify Marlin is running correctly (check LED indicators on hardware)
- Try sending `M115` to query firmware info
- Check baud rate matches firmware configuration
- Ensure hardware is not in error state (emergency stop, thermal protection, etc.)

### Streaming Stops or Hangs

**Symptoms:** Progress bar stops updating, commands not advancing

**Solutions:**

- Check hardware for mechanical issues (jam, limit switch trigger, etc.)
- Review log for error responses from Marlin
- Use Pause button, then check hardware status manually
- Disconnect and reconnect if unresponsive
- Verify G-code file is valid (no unsupported commands)

### Buffer Overrun Warnings

**Symptoms:** Warnings about command buffer in log

**Solutions:**

- Marlin handles command buffering automatically
- Brief warnings are normal during streaming
- Persistent warnings may indicate communication issues (check cable, baud rate)

### Interrupted Job / Backend Restart

**Symptoms:** A toast reports that "the streaming backend restarted; the job was
interrupted and the controller reset," and the app drops to disconnected during
a stream.

**What happened:** Machine control runs in a local API sidecar that owns the
serial port. If that sidecar process crashes mid-stream, the operating system
releases the port — which toggles DTR and **resets the Marlin controller** — and
the in-progress job is lost. The app detects this, marks the job `orphaned`, and
disconnects rather than silently re-opening the port (a blind re-open could reset
a controller that is still moving).

**Recovery:**

1. Make sure the machine is mechanically safe to re-home (the controller has
   already reset, so it is idle).
2. Click **Connect** again. Reconnecting performs a clean DTR reset and brings
   the controller back to a known state.
3. Re-stream the file from the beginning. FiberPath does not resume a partially
   streamed job — the controller's position after a reset is not trustworthy.

The backend reports the lost job as `orphaned` (not "not found") so any client
re-attaching to the old job id learns it was interrupted instead of getting a
confusing error.

---

## Technical Details

### Communication Protocol

Since v0.9.0 the desktop GUI no longer spawns a bespoke Python subprocess. Instead, a **bundled local API sidecar** (FastAPI) owns the serial port and exposes machine control under `/machine/*`; the GUI is a typed HTTP client. The serial protocol itself — handshake, line-numbered/checksummed framing, and `ok`/`error` parsing — lives in the standalone [`marlin-host`](https://github.com/fiberpath/marlin-host) library, which the sidecar imports.

1. **Connection** (`POST /machine/connection`) – Opens the serial port at the requested baud rate and idle timeout, waits for Marlin's startup banner, and negotiates capabilities; returns the connection banner.
2. **Manual command** (`POST /machine/commands`) – Sends one G-code line and returns the host responses. Rejected with `409` while a job is actively streaming, so two senders never drive the transport at once.
3. **Streaming job** (`POST /machine/jobs`) – Streams a program line-by-line on a background worker thread; each acknowledged line is recorded into a monotonic event log.
4. **Progress** (`GET /machine/jobs/{id}?since=N`) – The GUI polls for status plus event-log entries with `seq > N` (the protocol is send-line → `ok`, so there is nothing to push).
5. **Pause / resume / cancel** (`POST /machine/jobs/{id}/{action}`) – Set host-side flags on the `MarlinHost`; the worker stops before the next line, with no board-side buffer command.

### Streaming Architecture

```text
Desktop GUI (Svelte)        Local API sidecar (FastAPI)        marlin-host + serial
     │                              │                                  │
     ├─ POST /machine/connection ──>├─ MarlinHost(SerialTransport) ───>│ open + handshake
     │<─ connection banner ────────<│                                  │
     │                              │                                  │
     ├─ POST /machine/commands ────>├─ host.send() (lock held) ───────>│ one line, await ok
     │<─ responses ────────────────<│                                  │
     │                              │                                  │
     ├─ POST /machine/jobs ────────>├─ spawn worker thread ───────────>│ stream line-by-line
     │                              │   record events into a log        │  (await ok each line)
     │   ── GET /jobs/{id}?since=N ─>│                                  │
     │<─ status + new events ──────<│   (GUI polls)                     │
     │                              │                                  │
     ├─ POST /jobs/{id}/pause ─────>├─ host.pause() flag ─────────────>│ stop before next line
     ├─ POST /jobs/{id}/cancel ────>├─ host.stop(); stay connected ───>│ end worker (no M112)
     ├─ POST /machine/estop ───────>├─ host.emergency_stop() ─────────>│ M112 out-of-band
```

A single `MachineService` singleton holds all serial state. An `RLock` serialises state mutations and guards the event log; the worker thread takes it only to record progress. Pause/resume/cancel and the emergency stop are deliberately lock-free on the request side so they remain responsive while the worker streams. Because the sidecar — not the GUI — owns the connection, a streaming job survives a GUI reload: the GUI reattaches by polling the same job id.

### Timeout Configuration

- **Connection / idle timeout:** supplied per connection request (`ConnectRequest.timeout`) and applied to the serial transport's reads.
- **Handshake:** `marlin-host` waits for the controller's startup banner before reporting the port connected.
- **Cancel join:** disconnect/cancel unblocks a paused stream and waits up to 10 seconds for the worker thread to finish.
- **Recovery snapshot:** while streaming, the active-job state is persisted to a temp-dir snapshot at most once per second for crash/restart recovery.

### Safety Features

- **Emergency Stop:** `POST /machine/estop` writes `M112` out-of-band via `MarlinHost.emergency_stop` (issue #196), bypassing the service lock so it works even mid-stream; requires a reconnect afterward.
- **Pause/Resume:** host-side flags stop the worker before the next line and resume from it — no board-side `M0`/`M108` buffer juggling.
- **Cancel Job:** graceful stop from streaming or paused state with no `M112`; the connection stays open and is ready for the next file.
- **Single transport owner:** manual commands are rejected (`409`) while a job actively streams, so only one writer ever drives the serial port.
- **Error detection:** `marlin-host` raises on `error:`/halt responses and the worker records the job as `error`.
- **Orphaned-job recovery:** on startup the sidecar reconciles the on-disk snapshot; a job whose worker died (e.g. a sidecar restart) is surfaced as `orphaned` rather than lost, so the GUI can recover instead of silently hanging.

---

## Best Practices

1. **Always Home Before Winding** – Use `G28` to establish axis origins (Note: Requires hardware endstops)
2. **Test Connection First** – Send `M114` to verify communication before streaming
3. **Monitor Progress** – Watch the log for errors or unexpected responses
4. **Use Pause for Inspection** – Safely pause to check fiber placement or hardware
5. **Cancel vs Emergency Stop** – Use Cancel Job for planned exits, Emergency Stop only for true emergencies
6. **Clear File Selection** – Use the X button to deselect files between jobs
7. **Disconnect Before Unplugging** – Always use Disconnect button before removing USB

---

## Hardware Testing Checklist

Before production winding, verify all functionality:

- [ ] Port discovery detects hardware
- [ ] Connection succeeds at correct baud rate
- [ ] Manual commands execute correctly (`G28`, `M114`)
- [ ] Emergency stop immediately halts motion
- [ ] File streaming completes successfully
- [ ] Pause/resume works mid-stream
- [ ] Progress monitoring displays accurate counts
- [ ] Disconnect releases serial port properly

---

## Related Documentation

- [FiberPath Architecture](../architecture/overview.md) – Overall system design
- [API Documentation](../reference/api.md) – REST endpoints for planning and simulation

---

## Version History

**v0.9.0** (2026) – Sidecar machine-control architecture

- Retired the stdio Python subprocess; the desktop GUI now drives a bundled local API sidecar over HTTP
- Serial protocol (handshake, line-numbered/checksummed framing, `ok`/`error` parsing) moved to the standalone [`marlin-host`](https://github.com/fiberpath/marlin-host) library
- Streaming runs as a background job on the sidecar; the GUI polls a job resource for progress and reattaches after a reload
- Host-side pause/resume replaced board-side `M0`/`M108`; emergency stop writes `M112` out-of-band
- Orphaned-job recovery after a sidecar restart (#200)

**v0.5.0** (2026-01-11) – Streaming State & Control Refinements

- Zero-lag progress monitoring (replaced event queue with state polling)
- Cancel Job feature (graceful exit while paused, stays connected)
- Enhanced state management (clear file/progress on reconnect)
- Fixed pause state reset bug (properly clears flags after cancel)
- Manual file clear button added (X button next to filename)
- Improved button workflow (Cancel vs Stop distinction)

**v4.0.0** (2026-01-09) – Initial Marlin Streaming

- Serial port discovery and connection management
- Manual control with common command buttons
- File streaming with pause/resume support
- Live logging and progress monitoring
- Keyboard shortcuts and help modal
