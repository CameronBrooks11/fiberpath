# Stream Tab Hardware Testing Checklist

**Quick testing guide for Marlin hardware integration**  
**Prerequisites:** Marlin machine connected via USB, FiberPath GUI running

---

## Setup (5 minutes)

1. **Connect Hardware:**

   - Plug Marlin machine into USB port
   - Power on machine
   - Note port name (COM3, /dev/ttyUSB0, etc.)

2. **Prepare Test Files:**

   ```gcode
   ; test_small.gcode (save to desktop)
   G28 ; Home
   G90 ; Absolute
   G1 X10 Y10 Z5 F3000
   G1 X20 Y20
   G1 X10 Y10
   M400 ; Wait
   M18 ; Disable motors
   ```

3. **Launch GUI:**
   - Run `npm run tauri dev` in fiberpath_gui
   - Navigate to Stream tab (Alt+2)

---

## Critical Tests (15 minutes)

### 1. Connection (3 min)

- [ ] **Refresh Ports** → See your port listed?
- [ ] **Select port** → Choose your COM/tty port
- [ ] **Connect** → Green indicator, success toast?
- [ ] **Check log** → Connection message visible?

**Expected:** Green "Connected" status, toast notification, log entry

### 2. Manual Commands (5 min)

- [ ] **M114** (Get Position) → Response in log?
- [ ] **G28** (Home) → Machine homes, "Homing complete" toast?
- [ ] **M114** again → New position shown?
- [ ] **Type `M114`** in input → Press Enter → Works?
- [ ] **M112** (E-Stop) → Machine stops, warning toast?

**Expected:** Blue command entries, green response entries, appropriate toasts

### 3. File Streaming (7 min)

- [ ] **Select File** → Pick test_small.gcode → Filename toast?
- [ ] **Start Stream** → Progress bar updates?
- [ ] **Watch log** → Commands appear every 10th line?
- [ ] **Machine executes** → Actually moves?
- [ ] **Completion** → Success toast with count?

**Expected:** Smooth progress updates, machine executes all commands, completion toast

---

## Additional Tests (15 minutes)

### 4. Error Handling (5 min)

- [ ] **Invalid command** → Type `BADCMD` → Error in log/toast?
- [ ] **Disconnect mid-stream** → Unplug USB → Error toast?
- [ ] **Try command while disconnected** → Section disabled?

### 5. Pause/Resume (5 min)

- [ ] **Stream test_small.gcode**
- [ ] **Click Pause** → Machine stops, warning toast?
- [ ] **Click Resume** → Machine continues, success toast?
- [ ] **Completes** → Success?

### 6. Tab Navigation (5 min)

- [ ] **Connect** → Switch to Main tab → Switch back → Still connected?
- [ ] **Start stream** → Switch to Main tab → Switch back → Still streaming?
- [ ] **Check progress** → Updates correctly?

---

## Quick Issue Checklist

If something doesn't work, check:

**No ports listed:**

- Is machine powered on?
- Is USB cable connected?
- Try different USB port
- Click Refresh Ports

**Connection fails:**

- Is another program using the port? (Arduino IDE, Pronterface, etc.)
- Try different baud rate (115200 vs 250000)
- Check machine firmware responds to serial commands

**Commands don't execute:**

- Is machine actually connected? (Green indicator?)
- Check log for responses
- Try simpler command (M114)

**Streaming fails:**

- Is file valid G-code?
- Try smaller test file first
- Check log for specific error

---

## Toast Verification

All operations should show visual feedback:

| Action             | Toast Type | Color  | Message Example                       |
| ------------------ | ---------- | ------ | ------------------------------------- |
| Connect            | Success    | Green  | "Connected to COM3 at 115200"         |
| Connection Error   | Error      | Red    | "Failed to connect: Port not found"   |
| No Ports           | Warning    | Orange | "No serial ports found"               |
| File Select        | Info       | Blue   | "Selected: test_small.gcode"          |
| Streaming Start    | Info       | Blue   | "Streaming started"                   |
| Stream 25%/50%/75% | Info       | Blue   | "Streaming 50% complete"              |
| Stream Complete    | Success    | Green  | "Streaming complete: 7 commands sent" |
| Stream Error       | Error      | Red    | "Streaming error: Connection lost"    |
| Pause              | Warning    | Orange | "Streaming paused"                    |
| Resume             | Success    | Green  | "Streaming resumed"                   |
| Home (G28)         | Success    | Green  | "Homing complete"                     |
| E-Stop (M112)      | Warning    | Orange | "Emergency stop activated!"           |
| Disconnect         | Info       | Blue   | "Disconnected from device"            |

---

## Success Criteria

✅ **All tests pass** → Phase 4 complete, ready for Phase 5  
⚠️ **1-2 minor issues** → Document and fix, then proceed  
❌ **Critical failures** → Fix before proceeding

---

## Report Template

```markdown
## Test Results - [Date]

**Hardware:** [Machine model, firmware version]
**Port:** [COM3, /dev/ttyUSB0, etc.]
**OS:** [Windows/macOS/Linux]

### Critical Tests

- [ ] Connection: PASS / FAIL - Notes:
- [ ] Manual Commands: PASS / FAIL - Notes:
- [ ] File Streaming: PASS / FAIL - Notes:

### Additional Tests

- [ ] Error Handling: PASS / FAIL - Notes:
- [ ] Pause/Resume: PASS / FAIL - Notes:
- [ ] Tab Navigation: PASS / FAIL - Notes:

### Issues Found

1. [Issue description]
2. [Issue description]

### Overall: PASS / FAIL
```

---

**Time Required:** ~30 minutes for all tests  
**Status:** Ready to test with hardware  
**Next:** Fix any issues found, then proceed to Phase 5
