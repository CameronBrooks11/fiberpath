"""
Diagnostic script to analyze a PyInstaller executable.

Usage: python scripts/diagnose_exe.py path/to/fiberpath.exe
"""

import sys
import os
from pathlib import Path


def analyze_exe(exe_path: Path) -> None:
    """Analyze the PyInstaller executable."""
    print(f"=== Analyzing: {exe_path} ===\n")
    
    # Check size
    size_bytes = exe_path.stat().st_size
    size_mb = size_bytes / (1024 * 1024)
    print(f"Size: {size_bytes:,} bytes ({size_mb:.2f} MB)")
    
    # Expected size for full bundle
    if size_mb < 20:
        print("⚠ WARNING: File is too small! Expected >40 MB for full bundle.")
        print("   This indicates PyInstaller did NOT bundle dependencies correctly.")
    elif size_mb >= 40:
        print("✓ Size looks good - dependencies likely bundled correctly")
    else:
        print("? Size is in between - may be partial bundling")
    
    print()
    
    # Try to extract and list contents (PyInstaller archives can be inspected)
    print("To inspect contents, you can use:")
    print(f"  pyinstaller-extractor {exe_path}")
    print("  (Install with: pip install pyinstaller-extractor)")
    print()
    
    # Check if it runs
    print("Testing execution...")
    import subprocess
    try:
        result = subprocess.run(
            [str(exe_path), "--version"],
            capture_output=True,
            timeout=5,
            text=True
        )
        if result.returncode == 0:
            print(f"✓ Execution successful")
            print(f"  Output: {result.stdout.strip()}")
        else:
            print(f"✗ Execution failed with code {result.returncode}")
            print(f"  stderr: {result.stderr}")
    except subprocess.TimeoutExpired:
        print("✗ Execution timed out")
    except Exception as e:
        print(f"✗ Execution error: {e}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python scripts/diagnose_exe.py path/to/fiberpath.exe")
        sys.exit(1)
    
    exe_path = Path(sys.argv[1])
    if not exe_path.exists():
        print(f"Error: {exe_path} does not exist")
        sys.exit(1)
    
    analyze_exe(exe_path)
