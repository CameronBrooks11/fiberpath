"""Path policy helpers for API file access."""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import HTTPException

_ALLOWED_ROOTS_ENV = "FIBERPATH_API_ALLOWED_ROOTS"


def _parse_allowed_roots() -> list[Path]:
    raw = os.getenv(_ALLOWED_ROOTS_ENV)
    if not raw:
        return [Path.cwd().resolve()]

    roots: list[Path] = []
    for token in raw.split(os.pathsep):
        value = token.strip()
        if not value:
            continue
        roots.append(Path(value).expanduser().resolve())

    return roots or [Path.cwd().resolve()]


def _resolve_user_path(user_path: str) -> Path:
    if not user_path.strip():
        raise HTTPException(status_code=400, detail="Path must not be empty")

    candidate = Path(user_path).expanduser()
    if not candidate.is_absolute():
        candidate = Path.cwd() / candidate
    return candidate.resolve(strict=False)


def _is_within_roots(path: Path, roots: list[Path]) -> bool:
    for root in roots:
        try:
            if os.path.commonpath([str(path), str(root)]) == str(root):
                return True
        except ValueError:
            # Different drives on Windows can raise ValueError; treat as non-match.
            continue
    return False


def enforce_input_path_policy(user_path: str) -> Path:
    """Resolve and validate an input path against configured allowed roots."""
    resolved = _resolve_user_path(user_path)
    roots = _parse_allowed_roots()

    if not _is_within_roots(resolved, roots):
        roots_str = ", ".join(str(root) for root in roots)
        raise HTTPException(
            status_code=403,
            detail=(
                f"Path '{user_path}' is outside allowed API roots. "
                f"Configure {_ALLOWED_ROOTS_ENV} to permit additional roots. "
                f"Current roots: {roots_str}"
            ),
        )

    return resolved


def enforce_output_path_policy(path: Path) -> Path:
    """Validate an output path against configured allowed roots."""
    resolved = path.resolve(strict=False)
    roots = _parse_allowed_roots()

    if not _is_within_roots(resolved, roots):
        roots_str = ", ".join(str(root) for root in roots)
        raise HTTPException(
            status_code=403,
            detail=(
                f"Output path '{resolved}' is outside allowed API roots. "
                f"Configure {_ALLOWED_ROOTS_ENV} to permit additional roots. "
                f"Current roots: {roots_str}"
            ),
        )

    return resolved
