#!/usr/bin/env python3
"""CI smoke test for the frozen API sidecar.

Spawns ``dist/fiberpath-api[.exe]``, reads the JSON port handshake from its
stdout, polls ``GET /health`` until ready, then POSTs an example wind
definition to ``/plan``. Exits non-zero on any failure, so the freeze job fails
loudly if the binary is broken on a given OS. Stdlib only (no extra deps).
"""

from __future__ import annotations

import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
_NAME = "fiberpath-api.exe" if sys.platform.startswith("win") else "fiberpath-api"
BINARY = ROOT / "dist" / _NAME
EXAMPLE = ROOT / "examples" / "simple_cylinder" / "input.wind"


def _read_port(proc: subprocess.Popen[str], timeout: float = 30.0) -> int:
    assert proc.stdout is not None
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        line = proc.stdout.readline()
        if not line:
            if proc.poll() is not None:
                raise RuntimeError("sidecar exited before the handshake")
            continue
        try:
            message = json.loads(line.strip())
        except json.JSONDecodeError:
            continue
        if message.get("event") == "listening":
            return int(message["port"])
    raise RuntimeError("timed out waiting for the port handshake")


def _wait_healthy(base_url: str, timeout: float = 30.0) -> None:
    deadline = time.monotonic() + timeout
    last_error = ""
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(f"{base_url}/health", timeout=2) as resp:
                if resp.status == 200:
                    return
        except (urllib.error.URLError, ConnectionError, OSError) as exc:
            last_error = str(exc)
        time.sleep(0.2)
    raise RuntimeError(f"sidecar never became healthy: {last_error}")


def main() -> None:
    if not BINARY.exists():
        raise SystemExit(f"binary not found: {BINARY}")

    proc = subprocess.Popen(  # noqa: S603
        [str(BINARY)],
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
    )
    try:
        base_url = f"http://127.0.0.1:{_read_port(proc)}"
        print(f"sidecar listening on {base_url}")

        _wait_healthy(base_url)
        print("GET /health -> ok")

        request = urllib.request.Request(
            f"{base_url}/plan",
            data=EXAMPLE.read_bytes(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=10) as resp:
            payload = json.loads(resp.read())
        assert payload.get("commandCount", 0) > 0, payload
        print(f"POST /plan -> {payload['commandCount']} commands, ok")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()

    print("OK: sidecar smoke test passed")


if __name__ == "__main__":
    main()
