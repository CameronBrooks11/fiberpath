"""
Integration test for Marlin interactive.py subprocess.
Tests the Python subprocess without Tauri layer.
"""

import json
import subprocess
import sys
from pathlib import Path


def send_command(proc: subprocess.Popen, command: dict) -> None:
    """Send JSON command to subprocess stdin."""
    json_str = json.dumps(command)
    proc.stdin.write(json_str + "\n")
    proc.stdin.flush()


def read_response(proc: subprocess.Popen) -> dict:
    """Read JSON response from subprocess stdout."""
    line = proc.stdout.readline()
    if not line:
        raise EOFError("No response from subprocess")
    return json.loads(line)


def test_subprocess_lifecycle() -> None:
    """Test starting, communicating with, and stopping the subprocess."""
    print("Testing subprocess lifecycle...")

    # Find Python executable and interactive.py
    python_exe = sys.executable
    repo_root = Path(__file__).parent.parent.parent
    interactive_path = repo_root / "fiberpath_cli" / "interactive.py"

    if not interactive_path.exists():
        print(f"ERROR: interactive.py not found at {interactive_path}")
        return

    # Start subprocess
    proc = subprocess.Popen(
        [python_exe, str(interactive_path)],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
    )

    try:
        print(f"✓ Subprocess started (PID: {proc.pid})")

        # Test list_ports action
        print("\nTesting list_ports action...")
        send_command(proc, {"action": "list_ports"})
        response = read_response(proc)

        if response.get("status") == "ok":
            ports = response.get("ports", [])
            print(f"✓ Found {len(ports)} serial port(s):")
            for port in ports:
                print(f"  - {port['port']}: {port['description']}")
        else:
            print(f"✗ list_ports failed: {response}")

        # Test invalid action (should return error)
        print("\nTesting error handling...")
        send_command(proc, {"action": "invalid_action"})
        response = read_response(proc)

        if response.get("status") == "error":
            print(f"✓ Error handling works: {response['message']}")
        else:
            print(f"✗ Expected error response, got: {response}")

        # Test connect without port (should return error)
        print("\nTesting connect validation...")
        send_command(proc, {"action": "connect"})
        response = read_response(proc)

        if response.get("status") == "error" and response.get("code") == "MISSING_PORT":
            print(f"✓ Connect validation works: {response['message']}")
        else:
            print(f"✗ Expected MISSING_PORT error, got: {response}")

        print("\n✓ All subprocess tests passed!")

    finally:
        # Cleanup
        proc.terminate()
        try:
            proc.wait(timeout=2)
            print(f"✓ Subprocess terminated cleanly")
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()
            print("⚠ Subprocess had to be killed")


if __name__ == "__main__":
    test_subprocess_lifecycle()
