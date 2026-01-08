"""CLI command for streaming G-code to a Marlin controller."""

from __future__ import annotations

from pathlib import Path

import typer
from fiberpath.execution import MarlinStreamer, StreamError, StreamProgress

from .output import echo_json

GCODE_ARGUMENT = typer.Argument(..., exists=True, readable=True)
PROGRESS_INTERVAL = 25


def stream_command(
    gcode_file: Path = GCODE_ARGUMENT,
    port: str | None = typer.Option(
        None,
        "--port",
        "-p",
        help="Serial port or pyserial URL (required unless --dry-run).",
    ),
    baud_rate: int = typer.Option(250_000, "--baud-rate", "-b", help="Marlin baud rate."),
    response_timeout: float = typer.Option(
        10.0,
        "--timeout",
        "-t",
        help="Response timeout in seconds for slow moves.",
    ),
    dry_run: bool = typer.Option(
        False,
        "--dry-run",
        help="Skip serial I/O and just report what would be streamed.",
    ),
    verbose: bool = typer.Option(False, "--verbose", help="Print every streamed command."),
    json_output: bool = typer.Option(
        False,
        "--json",
        help="Emit final summary as JSON (progress lines suppressed).",
    ),
) -> None:
    """Stream the provided G-code file to a Marlin device."""

    if not dry_run and port is None:
        raise typer.BadParameter("--port is required for live streaming", param_hint="--port")

    commands = gcode_file.read_text(encoding="utf-8").splitlines()
    log_callback = None if json_output else (typer.echo if verbose else None)
    streamer = MarlinStreamer(
        port=port, baud_rate=baud_rate, response_timeout_s=response_timeout, log=log_callback
    )
    streamer.load_program(commands)

    progress_verbose = verbose or dry_run

    try:
        while streamer.commands_sent < streamer.commands_total:
            try:
                for update in streamer.iter_stream(dry_run=dry_run):
                    if not json_output and _should_print_progress(update, verbose=progress_verbose):
                        typer.echo(_format_progress(update))
                break
            except KeyboardInterrupt:  # pragma: no cover - user-driven flow
                if dry_run:
                    raise
                typer.echo("\nPause requested (Ctrl+C). Sending M0 ...")
                _pause_and_prompt(streamer)
                continue
    except StreamError as exc:
        typer.echo(f"Streaming failed: {exc}", err=True)
        raise typer.Exit(code=1) from exc
    finally:
        streamer.close()

    summary = {
        "status": "dry-run" if dry_run else "live",
        "commands": streamer.commands_sent,
        "total": streamer.commands_total,
        "baudRate": baud_rate,
        "dryRun": dry_run,
    }

    if json_output:
        echo_json(summary)
        return

    status = "Dry-run" if dry_run else "Streamed"
    typer.echo(
        f"{status} {streamer.commands_sent}/{streamer.commands_total} commands at {baud_rate} baud."
    )


def _should_print_progress(progress: StreamProgress, *, verbose: bool) -> bool:
    if verbose:
        return True
    if progress.commands_sent in {1, progress.commands_total}:
        return True
    if progress.commands_total <= PROGRESS_INTERVAL:
        return False
    return progress.commands_sent % PROGRESS_INTERVAL == 0


def _format_progress(progress: StreamProgress) -> str:
    phase = "dry-run" if progress.dry_run else "live"
    return f"[{progress.commands_sent}/{progress.commands_total}] ({phase}) {progress.command}"


def _pause_and_prompt(streamer: MarlinStreamer) -> None:
    try:
        streamer.pause()
    except StreamError as exc:
        raise typer.Exit(code=1) from exc

    if not typer.confirm("Resume streaming?", default=True):
        typer.echo("Stopping stream without resuming.")
        raise typer.Exit(code=0)

    typer.echo("Resuming (sending M108)...")
    try:
        streamer.resume()
    except StreamError as exc:
        raise typer.Exit(code=1) from exc
