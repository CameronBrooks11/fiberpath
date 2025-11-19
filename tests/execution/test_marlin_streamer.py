from __future__ import annotations

from collections import deque

import pytest
from fiberpath.execution import MarlinStreamer, StreamError


class DummyTransport:
    def __init__(self) -> None:
        self.written: list[str] = []
        self._responses: deque[str] = deque()

    def queue_front(self, *lines: str) -> None:
        for line in reversed(lines):
            self._responses.appendleft(line)

    def write_line(self, data: str) -> None:
        self.written.append(data)
        self._responses.append("ok")

    def readline(self, timeout: float | None = None) -> str | None:  # noqa: ARG002
        if not self._responses:
            return None
        return self._responses.popleft()

    def close(self) -> None:  # pragma: no cover - nothing to close
        return None


def test_iter_stream_sends_commands_and_skips_comments() -> None:
    transport = DummyTransport()
    streamer = MarlinStreamer(transport=transport)
    streamer.load_program(["; header", "G0 X1", "", "G1 Y2 F1000"])

    progress = list(streamer.iter_stream())

    assert [p.command for p in progress] == ["G0 X1", "G1 Y2 F1000"]
    assert transport.written == ["G0 X1", "G1 Y2 F1000"]
    assert streamer.commands_total == 2
    assert streamer.commands_sent == 2


def test_pause_and_resume_issue_m_codes() -> None:
    transport = DummyTransport()
    streamer = MarlinStreamer(transport=transport)
    streamer.load_program(["G0 X1"])

    list(streamer.iter_stream())

    streamer.pause()
    streamer.resume()

    assert transport.written[-2:] == ["M0", "M108"]


def test_stream_raises_on_marlin_error() -> None:
    transport = DummyTransport()
    streamer = MarlinStreamer(transport=transport)
    streamer.load_program(["G1 X5"])
    transport.queue_front("Error: printer halted")

    with pytest.raises(StreamError):
        next(streamer.iter_stream())
