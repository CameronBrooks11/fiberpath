"""Interactive mode for GUI integration via JSON stdin/stdout protocol.

This module provides a JSON-based protocol for controlling MarlinStreamer
from GUI applications. Commands are sent via stdin, responses via stdout.

Protocol:
    Input (stdin): JSON objects, one per line
    Output (stdout): JSON responses, one per line

Actions:
    - connect: Establish connection to Marlin
    - disconnect: Close connection
    - send: Send single G-code command
    - stream: Stream G-code file
    - pause: Pause streaming
    - resume: Resume streaming

Example:
    {"action": "connect", "port": "COM3", "baudRate": 250000}
    {"action": "send", "gcode": "G28"}
    {"action": "stream", "file": "path/to/file.gcode"}
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from fiberpath.execution import MarlinStreamer, StreamError, StreamProgress


def send_response(data: dict[str, Any]) -> None:
    """Send JSON response to stdout and flush."""
    print(json.dumps(data), flush=True)


def send_error(message: str, code: str = "ERROR") -> None:
    """Send error response."""
    send_response({"status": "error", "code": code, "message": message})


def send_progress(progress: StreamProgress) -> None:
    """Send streaming progress event."""
    send_response({
        "status": "progress",
        "commandsSent": progress.commands_sent,
        "commandsTotal": progress.commands_total,
        "command": progress.command,
        "dryRun": progress.dry_run,
    })


def interactive_mode() -> None:
    """Run interactive JSON protocol loop.

    Reads JSON commands from stdin and writes JSON responses to stdout.
    Continues until stdin is closed or 'exit' action is received.
    """
    streamer: MarlinStreamer | None = None

    try:
        for line in sys.stdin:
            try:
                command = json.loads(line)
                action = command.get("action")

                if action == "connect":
                    # Connect to Marlin
                    port = command.get("port")
                    baud_rate = command.get("baudRate", 250_000)
                    timeout = command.get("timeout", 10.0)

                    if not port:
                        send_error("Port is required for connect action", "MISSING_PORT")
                        continue

                    try:
                        if streamer is not None:
                            streamer.close()

                        streamer = MarlinStreamer(
                            port=port,
                            baud_rate=baud_rate,
                            response_timeout_s=timeout,
                        )
                        streamer.connect()
                        send_response({
                            "status": "connected",
                            "port": port,
                            "baudRate": baud_rate,
                        })
                    except StreamError as e:
                        send_error(f"Connection failed: {e}", "CONNECTION_FAILED")

                elif action == "disconnect":
                    # Disconnect from Marlin
                    if streamer is not None:
                        streamer.close()
                        streamer = None
                        send_response({"status": "disconnected"})
                    else:
                        send_response({"status": "disconnected", "message": "Not connected"})

                elif action == "send":
                    # Send single G-code command
                    gcode = command.get("gcode")

                    if not gcode:
                        send_error("G-code is required for send action", "MISSING_GCODE")
                        continue

                    if streamer is None or not streamer.is_connected:
                        send_error("Not connected to Marlin", "NOT_CONNECTED")
                        continue

                    try:
                        responses = streamer.send_command(gcode)
                        send_response({
                            "status": "ok",
                            "command": gcode,
                            "responses": responses,
                        })
                    except StreamError as e:
                        send_error(f"Command failed: {e}", "COMMAND_FAILED")

                elif action == "stream":
                    # Stream G-code file
                    file_path = command.get("file")

                    if not file_path:
                        send_error("File path is required for stream action", "MISSING_FILE")
                        continue

                    if streamer is None or not streamer.is_connected:
                        send_error("Not connected to Marlin", "NOT_CONNECTED")
                        continue

                    try:
                        path = Path(file_path)
                        if not path.exists():
                            send_error(f"File not found: {file_path}", "FILE_NOT_FOUND")
                            continue

                        commands = path.read_text(encoding="utf-8").splitlines()

                        # Send start event
                        non_comment_commands = [
                            c for c in commands
                            if c.strip() and not c.strip().startswith(";")
                        ]
                        send_response({
                            "status": "streaming",
                            "file": file_path,
                            "totalCommands": len(non_comment_commands),
                        })

                        # Stream commands
                        for progress in streamer.iter_stream(commands):
                            send_progress(progress)

                        # Send completion event
                        send_response({
                            "status": "complete",
                            "commandsSent": streamer.commands_sent,
                            "commandsTotal": streamer.commands_total,
                        })

                    except StreamError as e:
                        send_error(f"Streaming failed: {e}", "STREAM_FAILED")

                elif action == "pause":
                    # Pause streaming
                    if streamer is None or not streamer.is_connected:
                        send_error("Not connected to Marlin", "NOT_CONNECTED")
                        continue

                    try:
                        streamer.pause()
                        send_response({"status": "paused"})
                    except StreamError as e:
                        send_error(f"Pause failed: {e}", "PAUSE_FAILED")

                elif action == "resume":
                    # Resume streaming
                    if streamer is None or not streamer.is_connected:
                        send_error("Not connected to Marlin", "NOT_CONNECTED")
                        continue

                    try:
                        streamer.resume()
                        send_response({"status": "resumed"})
                    except StreamError as e:
                        send_error(f"Resume failed: {e}", "RESUME_FAILED")

                elif action == "exit":
                    # Clean exit
                    if streamer is not None:
                        streamer.close()
                    send_response({"status": "exiting"})
                    break

                else:
                    send_error(f"Unknown action: {action}", "UNKNOWN_ACTION")

            except json.JSONDecodeError as e:
                send_error(f"Invalid JSON: {e}", "INVALID_JSON")
            except Exception as e:
                send_error(f"Unexpected error: {e}", "INTERNAL_ERROR")

    finally:
        if streamer is not None:
            streamer.close()


if __name__ == "__main__":
    interactive_mode()
