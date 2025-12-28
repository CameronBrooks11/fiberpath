"""Utilities for streaming G-code to Marlin-based controllers."""

from __future__ import annotations

import time
from collections.abc import Callable, Iterator, Sequence
from dataclasses import dataclass
from typing import Protocol, cast

DEFAULT_BAUD_RATE = 250_000
DEFAULT_RESPONSE_TIMEOUT = 10.0


class StreamError(RuntimeError):
    """Raised when streaming cannot proceed."""


class SerialTransport(Protocol):
    """Minimal interface expected by :class:`MarlinStreamer`."""

    def write_line(self, data: str) -> None:
        """Write a G-code line to the transport."""

    def readline(self, timeout: float | None = None) -> str | None:
        """Return a single response line or ``None`` on timeout."""

    def close(self) -> None:
        """Close the transport."""


class PySerialTransport:
    """Serial transport backed by :mod:`pyserial`."""

    def __init__(self, port: str, baud_rate: int, timeout: float) -> None:
        try:
            import serial  # type: ignore
        except ImportError as exc:  # pragma: no cover - dependency error surfaced to caller
            raise StreamError(
                "pyserial is required for live streaming; install fiberpath with the CLI extras"
            ) from exc

        self._serial = serial.serial_for_url(
            port,
            baudrate=baud_rate,
            timeout=timeout,
            write_timeout=timeout,
        )

    def write_line(self, data: str) -> None:
        payload = (data + "\n").encode("utf-8")
        self._serial.write(payload)
        self._serial.flush()

    def readline(self, timeout: float | None = None) -> str | None:
        previous_timeout: float | None = None
        if timeout is not None:
            previous_timeout = self._serial.timeout
            self._serial.timeout = timeout
        raw = cast(bytes, self._serial.readline())
        if timeout is not None and previous_timeout is not None:
            self._serial.timeout = previous_timeout
        if not raw:
            return None
        return raw.decode("utf-8", errors="ignore").strip()

    def close(self) -> None:
        self._serial.close()


@dataclass(frozen=True)
class StreamProgress:
    """Per-command streaming progress."""

    commands_sent: int
    commands_total: int
    command: str
    dry_run: bool


class MarlinStreamer:
    """Queue and stream G-code to a Marlin controller."""

    def __init__(
        self,
        *,
        port: str | None = None,
        baud_rate: int = DEFAULT_BAUD_RATE,
        response_timeout_s: float = DEFAULT_RESPONSE_TIMEOUT,
        log: Callable[[str], None] | None = None,
        transport: SerialTransport | None = None,
    ) -> None:
        self._port = port
        self._baud_rate = baud_rate
        self._response_timeout = response_timeout_s
        self._log = log
        self._transport = transport
        self._connected = transport is not None

        self._program: list[str] = []
        self._cursor = 0
        self._commands_sent = 0
        self._total_commands = 0
        self._paused = False

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    def load_program(self, commands: Sequence[str]) -> None:
        """Load and sanitize a G-code program for streaming."""

        sanitized: list[str] = []
        total = 0
        for raw in commands:
            line = raw.strip()
            if not line:
                continue
            sanitized.append(line)
            if not line.startswith(";"):
                total += 1
        if not sanitized:
            raise StreamError("G-code program contained no commands")
        self._program = sanitized
        self._cursor = 0
        self._commands_sent = 0
        self._total_commands = total

    def iter_stream(self, *, dry_run: bool = False) -> Iterator[StreamProgress]:
        """Yield progress as commands are streamed."""

        if not self._program:
            raise StreamError("No program loaded")

        while self._cursor < len(self._program):
            line = self._program[self._cursor]
            self._cursor += 1

            if not line:
                continue
            if line.startswith(";"):
                if self._log is not None:
                    self._log(line[1:].strip())
                continue

            if not dry_run:
                self._ensure_connection()
                self._send_command(line)
                time.sleep(0.001)  # brief pause to avoid overwhelming Marlin

            self._commands_sent += 1
            yield StreamProgress(
                commands_sent=self._commands_sent,
                commands_total=self._total_commands,
                command=line,
                dry_run=dry_run,
            )

    def pause(self) -> None:
        """Send ``M0`` to request a pause."""

        if self._paused:
            raise StreamError("Stream is already paused")
        self._ensure_connection()
        self._send_command("M0")
        self._paused = True

    def resume(self) -> None:
        """Send ``M108`` to resume after :meth:`pause`."""

        if not self._paused:
            raise StreamError("Stream is not paused")
        self._ensure_connection()
        self._send_command("M108")
        self._paused = False

    def reset_progress(self) -> None:
        """Restart streaming from the first command."""

        self._cursor = 0
        self._commands_sent = 0
        self._paused = False

    def close(self) -> None:
        """Close the underlying transport."""

        if self._transport is not None:
            self._transport.close()
        self._connected = False

    def __enter__(self) -> MarlinStreamer:
        return self

    def __exit__(self, *_exc: object) -> None:  # pragma: no cover - trivial
        self.close()

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------
    @property
    def commands_total(self) -> int:
        return self._total_commands

    @property
    def commands_sent(self) -> int:
        return self._commands_sent

    @property
    def commands_remaining(self) -> int:
        return max(self._total_commands - self._commands_sent, 0)

    @property
    def paused(self) -> bool:
        return self._paused

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _ensure_connection(self) -> None:
        if self._connected:
            return
        if self._transport is None:
            if self._port is None:
                raise StreamError("Serial port is required for live streaming")
            self._transport = PySerialTransport(self._port, self._baud_rate, self._response_timeout)
        time.sleep(3.0)  # wait for Marlin to initialize
        self._connected = True

    def _send_command(self, command: str) -> None:
        assert self._transport is not None  # for type checkers
        self._transport.write_line(command)
        self._await_ok()

    def _await_ok(self) -> None:
        assert self._transport is not None
        deadline = time.monotonic() + self._response_timeout
        while True:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise StreamError("Timed out waiting for Marlin response")
            line = self._transport.readline(remaining)
            if line is None:
                continue
            line = line.strip()
            if not line:
                continue
            if line == "ok":
                return
            if line.startswith("echo:busy"):
                deadline = time.monotonic() + self._response_timeout
                continue
            if line.startswith("Error"):
                raise StreamError(f"Marlin reported: {line}")
            if self._log is not None:
                self._log(f"[marlin] {line}")
