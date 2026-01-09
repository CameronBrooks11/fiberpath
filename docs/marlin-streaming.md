# Marlin G-code Streaming Guide

## Overview

FiberPath v4.0 introduces direct Marlin G-code streaming capabilities through the desktop GUI. The Stream tab provides a complete interface for connecting to Marlin-compatible hardware, sending manual commands, and streaming G-code files with real-time progress monitoring.

## Features

- **Serial Port Discovery** – Automatically detect available COM ports and USB serial devices
- **Connection Management** – Connect/disconnect with configurable baud rates
- **Manual Control** – Send custom G-code commands or use quick-access buttons for common operations
- **File Streaming** – Stream G-code files with real-time progress tracking
- **Pause/Resume** – Safely pause and resume streaming operations mid-execution
- **Live Logging** – View command/response history with timestamps and status indicators
- **Keyboard Shortcuts** – Efficient control with `Alt+1/2` for tabs, `Ctrl+Enter` to send commands, `?` for help

---

## Getting Started

### Prerequisites

- Marlin-compatible hardware (3D printer, CNC, filament winder, etc.)
- USB serial connection
- FiberPath Desktop GUI v4.0 or later

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

Stream complete G-code files to hardware with real-time progress monitoring.

### Streaming Workflow

1. **Select G-code File**

   - Click **Select G-code File** button
   - Choose a `.gcode` file from your filesystem
   - Selected filename will display below the button

2. **Start Streaming**

   - Click **Start Stream** (enabled when connected and file selected)
   - Progress bar shows commands sent vs. total
   - Current command displays in real-time
   - Log panel shows each command/response

3. **Monitor Progress**

   - Progress updates display as `N / Total commands`
   - Milestone notifications at 25%, 50%, 75%, 100%
   - Log entries show timestamps and status indicators

4. **Pause/Resume**

   - Click **Pause** during streaming to safely halt execution
   - Click **Resume** to continue from the paused position
   - Status indicator turns yellow when paused

5. **Stop Streaming**
   - Click **Stop** to terminate streaming early
   - A confirmation prevents accidental stops

### Progress Monitoring

The Stream tab provides multiple progress indicators:

- **Progress Bar** – Visual representation of completion percentage
- **Command Counter** – Displays `N / Total` commands sent
- **Current Command** – Shows the last command sent to hardware
- **Log Panel** – Complete command/response history with timestamps

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

1. **Connection** – Opens serial port at specified baud rate with 5-second timeout
2. **Command Sending** – Sends G-code line-by-line, waits for `ok` response
3. **Response Reading** – Reads serial responses, filters for `ok`, `error`, or status messages
4. **Error Handling** – Detects `error:` responses and halts streaming

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
     ├─ marlin_stream_file() ───>├─ send commands + emit ───>├─ stream G-code
     │                           │   progress events          │  line-by-line
     │<─ stream-progress ────────<│                            │
     │<─ stream-complete ─────────<│                            │
```

### Timeout Configuration

- **Connection Timeout:** 10 seconds (configurable in Python subprocess)
- **Command Timeout:** 5 seconds per command
- **Read Timeout:** 1 second for serial reads
- **Startup Buffer:** 3 seconds to consume Marlin startup messages

### Safety Features

- **Emergency Stop:** `M112` immediately halts all motion
- **Pause/Resume:** Uses `M25` and `M24` for safe stream control
- **Error Detection:** Monitors for `error:` responses and stops streaming
- **Connection State:** Prevents commands when disconnected

---

## Best Practices

1. **Always Home Before Winding** – Use `G28` to establish axis origins
2. **Test Connection First** – Send `M114` to verify communication before streaming
3. **Monitor Progress** – Watch the log for errors or unexpected responses
4. **Use Pause for Inspection** – Safely pause to check fiber placement or hardware
5. **Emergency Stop is Final** – Use `M112` only in true emergencies (requires hardware reset)
6. **Disconnect Before Unplugging** – Always use Disconnect button before removing USB

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

- [FiberPath Architecture](architecture.md) – Overall system design
- [API Documentation](api.md) – REST endpoints for planning and simulation
- [GUI Architecture](../fiberpath_gui/docs/ARCHITECTURE.md) – Tauri + React design
- [Roadmap v4](../planning/roadmap-v4.md) – Marlin streaming implementation details

---

## Version History

- **v4.0.0** (2026-01-09) – Initial release of Marlin streaming features
  - Serial port discovery and connection management
  - Manual control with common command buttons
  - File streaming with pause/resume support
  - Live logging and progress monitoring
  - Keyboard shortcuts and help modal
