"""Test serial port discovery on Windows."""

import json
import subprocess
import sys
from pathlib import Path


def test_port_discovery():
    """Test that list_ports returns Windows COM ports."""
    # Find the interactive.py script
    repo_root = Path(__file__).parent.parent.parent
    interactive_path = repo_root / "fiberpath_cli" / "interactive.py"

    # Start the interactive subprocess
    process = subprocess.Popen(
        [sys.executable, str(interactive_path)],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
    )

    try:
        # Send list_ports command
        command = json.dumps({"action": "list_ports"}) + "\n"
        process.stdin.write(command)
        process.stdin.flush()

        # Read response
        response_line = process.stdout.readline()
        response = json.loads(response_line)

        print("Port Discovery Test Results:")
        print(f"Status: {response.get('status')}")

        if response["status"] == "ok":
            ports = response.get("ports", [])
            print(f"Found {len(ports)} port(s)")

            for i, port in enumerate(ports, 1):
                print(f"\nPort {i}:")
                print(f"  Device: {port.get('port')}")
                print(f"  Description: {port.get('description')}")
                print(f"  HWID: {port.get('hwid')}")

                # On Windows, ports should be COMx
                if sys.platform == "win32":
                    assert port["port"].startswith(
                        "COM"
                    ), f"Expected COM port, got {port['port']}"

            print("\n✅ Port discovery test PASSED")
        else:
            print(f"Error: {response.get('message')}")
            print(f"Error code: {response.get('error_code')}")
            assert False, "Port discovery failed"

    finally:
        process.terminate()
        process.wait()


if __name__ == "__main__":
    test_port_discovery()
