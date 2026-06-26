"""Run the FiberPath API as a local sidecar.

Binds ``127.0.0.1`` to an OS-assigned (ephemeral) port, prints a single-line
JSON handshake — ``{"event": "listening", "host": ..., "port": N}`` — to stdout
so a supervising parent process (the Tauri shell) can discover the base URL,
then serves the app on that already-bound socket.

Run as ``python -m fiberpath_api`` (or the frozen ``fiberpath-api`` binary).
"""

from __future__ import annotations

import json
import socket
import sys

import uvicorn

from fiberpath_api.main import app

_HOST = "127.0.0.1"


def _bind_ephemeral_socket() -> socket.socket:
    """Bind 127.0.0.1 to an OS-assigned port and return the listening socket."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.bind((_HOST, 0))
    return sock


def main() -> None:
    sock = _bind_ephemeral_socket()
    port = sock.getsockname()[1]
    # Handshake: the supervisor reads exactly this first stdout line to learn
    # the URL. uvicorn's own logs go to stderr, so stdout stays clean.
    sys.stdout.write(json.dumps({"event": "listening", "host": _HOST, "port": port}) + "\n")
    sys.stdout.flush()
    # Pin uvicorn to its pure-Python stack (asyncio + h11, no websockets or
    # lifespan). The sidecar serves a trickle of local requests, so uvloop /
    # httptools / websockets add nothing — and dropping their dynamic auto-imports
    # makes the PyInstaller freeze deterministic.
    config = uvicorn.Config(
        app,
        loop="asyncio",
        http="h11",
        ws="none",
        lifespan="off",
        log_config=None,
        access_log=False,
    )
    uvicorn.Server(config).run(sockets=[sock])


if __name__ == "__main__":
    main()
