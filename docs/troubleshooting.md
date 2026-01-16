# Troubleshooting Guide

Common issues and solutions for FiberPath installation and usage.

## Installation Issues

### Desktop GUI Won't Install (macOS)

**Symptom:** "FiberPath.app can't be opened because it is from an unidentified developer"

**Cause:** macOS Gatekeeper blocks unsigned applications.

**Solution:**

1. Right-click the `.dmg` or `.app` file
2. Select "Open" from context menu
3. Click "Open Anyway" in the dialog
4. Go to System Settings → Privacy & Security if needed
5. Click "Open Anyway" next to the security warning

**Future:** Code signing will be added in v0.6.0 to eliminate this step.

### Desktop GUI Won't Install (Windows)

**Symptom:** Windows Defender or antivirus flags installer as suspicious

**Cause:** PyInstaller-frozen executables sometimes trigger false positives due to packing behavior.

**Solution:**

1. Verify download is from official [GitHub Releases](https://github.com/CameronBrooks11/fiberpath/releases)
2. Check file hash matches release notes (if provided)
3. Add exception in Windows Defender:
   - Windows Security → Virus & threat protection → Manage settings
   - Add exclusion for download folder or installed app
4. Alternatively, install via `.msi` (may be trusted more than `.exe`)

**Note:** This is a known limitation of unsigned executables. Code signing planned for v0.6.0.

### Linux .deb Installation Fails

**Symptom:** `dpkg: dependency problems prevent configuration`

**Cause:** Missing system dependencies for GTK/WebKit.

**Solution:**

```sh
# Ubuntu/Debian
sudo apt update
sudo apt install -f  # Fix broken dependencies
sudo apt install libwebkit2gtk-4.1-0 libappindicator3-1

# Then retry
sudo dpkg -i fiberpath_0.5.1_amd64.deb
```

### AppImage Won't Run (Linux)

**Symptom:** "Permission denied" or "cannot execute binary file"

**Cause:** Execute permissions not set.

**Solution:**

```sh
chmod +x fiberpath_0.5.1_amd64.AppImage
./fiberpath_0.5.1_amd64.AppImage
```

**FUSE Requirement:** Some older Linux systems require FUSE for AppImage:

```sh
# Ubuntu/Debian
sudo apt install fuse libfuse2

# Fedora
sudo dnf install fuse fuse-libs
```

### Python CLI Installation (pip install fiberpath)

**Symptom:** `ImportError: No module named 'fiberpath'`

**Cause:** Package not installed or wrong Python environment active.

**Solution:**

```sh
# Verify pip is using correct Python
python --version
pip --version

# Install/reinstall
pip install --upgrade fiberpath

# Or with uv (recommended)
uv pip install fiberpath

# For development
pip install -e .[dev,cli,api]
```

## Runtime Issues

### CLI Not Found (Desktop GUI)

**Symptom:** "FiberPath CLI not found" error when trying to plan/simulate

**Cause:** This should NOT happen in v0.5.1+ (CLI is bundled). If it does:

**Solution:**

1. **Verify installation:** Reinstall from fresh download
2. **Check integrity:** On Windows, look for `resources\_up_\bundled-cli\fiberpath.exe`
3. **Antivirus interference:** Some security software quarantines executables—check antivirus logs
4. **Report bug:** [File an issue](https://github.com/CameronBrooks11/fiberpath/issues) with:
   - Platform (Windows/macOS/Linux)
   - Installer type (.msi/.exe/.dmg/.deb/.AppImage)
   - Installation directory
   - Error message screenshot

### Serial Port Not Detected

**Symptom:** No ports appear in Stream tab dropdown

**Windows:**

- Verify device shows in Device Manager under "Ports (COM & LPT)"
- Install USB serial driver if needed:
  - CH340/CH341: [Download driver](http://www.wch-ic.com/downloads/CH341SER_ZIP.html)
  - FTDI: [Download driver](https://ftdichip.com/drivers/)
  - CP210x: Usually automatic on Windows 10+

**macOS:**

- Check `/dev/tty.usbserial-*` or `/dev/cu.usbserial-*` exist:
  ```sh
  ls /dev/tty.usb*
  ```
- Install driver if needed (CH340, FTDI, etc.)
- Grant permissions: System Settings → Privacy & Security → USB

**Linux:**

- Check `/dev/ttyUSB*` or `/dev/ttyACM*` exist:
  ```sh
  ls /dev/ttyUSB* /dev/ttyACM*
  ```
- **Add user to `dialout` group (REQUIRED):**
  ```sh
  sudo usermod -a -G dialout $USER
  # Log out and back in for changes to take effect
  ```
- Verify permissions:
  ```sh
  groups  # Should show 'dialout' in list
  ```

### Connection Timeout (Marlin Streaming)

**Symptom:** "Failed to connect" or timeout when clicking Connect

**Solutions:**

1. **Verify hardware:** Check device is powered and USB cable connected
2. **Try different port:** Some Marlin boards expose multiple serial interfaces
3. **Check baud rate:** Most Marlin firmware uses 115200 or 250000
4. **Reset device:** Unplug/replug USB or press reset button
5. **Close other apps:** Ensure no other software (Arduino IDE, Pronterface, OctoPrint) is using the port

### Validation Errors in .wind File

**Symptom:** "Validation failed" with cryptic error messages

**Solutions:**

1. **Check JSON syntax:** Use a JSON validator (jsonlint.com)
2. **Verify schema version:** Must include `"schemaVersion": "1.0"`
3. **Use camelCase:** Properties must use `windAngle` not `wind_angle`
4. **Required fields:** Ensure all mandatory fields present (mandrelParameters, towParameters, layers)
5. **See schema docs:** [Wind Format Guide](guides/wind-format.md) for complete specification

### G-code Generation Fails

**Symptom:** Plan command fails with error

**Common causes:**

- **Invalid pattern number:** Must divide evenly into mandrel circumference
- **Wind angle out of range:** Helical angles typically 15-75 degrees
- **Mandrel dimensions:** Check diameter > 0, windLength > 0
- **Layer conflicts:** Verify skip indices don't exceed pattern number

**Debug:**

```sh
# Use CLI for detailed error output
fiberpath plan input.wind -o test.gcode --verbose
```

## Performance Issues

### Slow Planning/Simulation

**Expected:** Large, complex patterns take time (10,000+ lines of G-code)

**If extremely slow (>30 seconds for simple patterns):**

1. **Check system resources:** Task Manager (Windows), Activity Monitor (macOS), `htop` (Linux)
2. **Antivirus scanning:** Some security software scans every file operation—add FiberPath to exclusions
3. **SSD vs HDD:** Temp file operations are slower on spinning disks

### GUI Sluggish or Unresponsive

1. **Restart application:** Memory leaks fixed in v0.5.0 but restart if issues persist
2. **Reduce preview scale:** Lower scale values (0.3-0.5) generate smaller images faster
3. **Close unnecessary tabs:** Minimize active visualizations
4. **Check system RAM:** GUI requires minimum 4 GB available

## Platform-Specific Quirks

### Windows

- **Console window flash:** Fixed in v0.5.1, but some users report brief flash on startup—this is harmless
- **Path length limits:** Windows has 260 character path limit—install to shorter directory if issues occur
- **Windows Defender SmartScreen:** May block first run—click "More info" → "Run anyway"

### macOS

- **Keyboard shortcuts:** Use `Cmd` not `Ctrl` (Cmd+S, Cmd+O, etc.)
- **Retina displays:** UI may appear small on high-DPI screens—adjust system scaling if needed
- **Touch Bar:** Not currently supported on MacBook Pro (planned for future)

### Linux

- **Wayland vs X11:** Tested on both, some themes may render differently
- **Desktop environments:** Tested on GNOME, KDE, XFCE—others should work but report issues
- **AppImage FUSE:** Older systems need FUSE installed, newer systems work without it

## Getting Help

**Still stuck?**

1. **Check documentation:** [Getting Started](getting-started.md), [Guides](guides/wind-format.md)
2. **Search issues:** [GitHub Issues](https://github.com/CameronBrooks11/fiberpath/issues)
3. **File a bug report:** Include:
   - Platform and version (Windows 11, macOS 14, Ubuntu 22.04, etc.)
   - FiberPath version (Help → About in GUI, or `fiberpath --version`)
   - Steps to reproduce
   - Error messages (screenshots helpful)
   - `.wind` file if planning issues (attach or paste)

**For development issues:** See [Contributing Guide](development/contributing.md)
