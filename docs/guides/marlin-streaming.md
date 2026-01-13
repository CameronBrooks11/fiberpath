# Marlin G-code Streaming Guide

## Overview

FiberPath v0.5.0 introduces enhanced Marlin G-code streaming with refined state management and control workflows. The Stream tab provides a complete interface for connecting to Marlin-compatible hardware, sending manual commands, and streaming G-code files with real-time progress monitoring.

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
- FiberPath Desktop GUI v0.5.0 or later

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

   - **Pause Button (Yellow)** – Sends M0 to Marlin, blocks Python streaming loop
   - **Stop Button (Red)** – Emergency M112, disconnects hardware (use with caution)

   **While Paused:**

   - **Resume Button (Green)** – Sends M108 to Marlin, continues streaming
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

**v0.5.0 Enhancement**: Progress monitoring uses direct state polling instead of event queues, eliminating the lag where hundreds of commands would appear during pause. Progress now reflects reality instantly.

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

---

## Technical Details

### Communication Protocol

FiberPath uses a Python subprocess (`fiberpath_cli/interactive.py`) to communicate with Marlin over serial:

1. **Connection** – Opens serial port at specified baud rate with 10-second timeout
2. **Command Sending** – Sends G-code line-by-line, waits for `ok` response
3. **Response Reading** – Reads serial responses, filters for `ok`, `error`, or status messages
4. **Error Handling** – Detects `error:` responses and halts streaming
5. **Pause Control** – Sends M0 to Marlin, blocks Python streaming loop until resumed

### Streaming Architecture

```text
Frontend (React)          Tauri Rust Backend          Python Subprocess
     │                           │                            │
     ├─ marlin_connect() ────────>├─ spawn interactive.py ───>│
     │                           │                            │
     ├─ marlin_send_command() ──>├─ write JSON to stdin ────>├─ send G-code
     │                           │                            │  to serial
     │                           │<─ read JSON from stdout ──<│
     │<─ return response ────────<│                            │
     │                           │                            │
     ├─ marlin_stream_file() ───>├─ send commands + poll ───>├─ stream G-code
     │                           │   progress state           │  line-by-line
     │<─ stream-progress ────────<│   (every 0.1s)            │  (blocking when paused)
     │<─ stream-complete ─────────<│                            │
     │                           │                            │
     ├─ marlin_cancel() ─────────>├─ graceful shutdown ─────>├─ stop worker thread
     │                           │   (stay connected)         │  (no M112)
```

**v0.5.0 Architecture Change**: Progress now uses shared state polling (0.1s intervals) instead of event queues. The main loop reads `streamer.commands_sent` directly from the MarlinStreamer instance, providing zero-lag progress updates. When paused, the streaming worker blocks in `iter_stream()` until resumed.

### Timeout Configuration

- **Connection Timeout:** 10 seconds (configurable in Python subprocess)
- **Command Timeout:** 5 seconds per command
- **Read Timeout:** 1 second for serial reads
- **Startup Buffer:** 3 seconds to consume Marlin startup messages

### Safety Features

- **Emergency Stop:** `M112` immediately halts all motion and disconnects (use only in emergencies)
- **Pause/Resume:** Python blocks streaming loop when paused; M0/M108 control Marlin buffer
- **Cancel Job:** Graceful exit from paused state without sending M112, connection maintained
- **Error Detection:** Monitors for `error:` responses and stops streaming
- **Connection State:** Prevents commands when disconnected
- **State Cleanup:** Automatically clears file/progress on reconnect after emergency stop

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

See `planning/hardware-testing-checklist.md` for comprehensive pre-deployment testing.

---

## Related Documentation

- [FiberPath Architecture](../architecture/overview.md) – Overall system design
- [API Documentation](../reference/api.md) – REST endpoints for planning and simulation

---

## Version History

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
