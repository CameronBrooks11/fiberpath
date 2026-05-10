"""Tests for path-policy hardening (enforce_input_path_policy).

Rejected cases
--------------
- NUL bytes in path
- POSIX absolute path  (/etc/passwd) → 400
- Windows drive-absolute path  (C:\\Windows\\System32\\file.txt) → 400
- Windows UNC path  (\\\\server\\share\\file) → 400
- ``..`` traversal (relative) → 400
- Empty string / whitespace-only string → 400

Accepted cases
--------------
- Bare filename relative to a configured root
- Nested relative path under a configured root
- Multiple configured roots: relative path resolved against second root
- Single-dot segments normalised away
"""

from __future__ import annotations

import os
from pathlib import Path

import pytest
from fastapi import HTTPException
from fiberpath_api.path_policy import enforce_input_path_policy

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _set_root(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """Point FIBERPATH_API_ALLOWED_ROOTS at *tmp_path* for the current test."""
    monkeypatch.setenv("FIBERPATH_API_ALLOWED_ROOTS", str(tmp_path))


# ---------------------------------------------------------------------------
# Rejected cases – 400 Bad Request
# ---------------------------------------------------------------------------


class TestRejectedPaths:
    def test_empty_string_rejected(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        _set_root(tmp_path, monkeypatch)
        with pytest.raises(HTTPException) as exc_info:
            enforce_input_path_policy("")
        assert exc_info.value.status_code == 400
        assert "empty" in exc_info.value.detail.lower()

    def test_whitespace_only_rejected(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        _set_root(tmp_path, monkeypatch)
        with pytest.raises(HTTPException) as exc_info:
            enforce_input_path_policy("   ")
        assert exc_info.value.status_code == 400
        assert "empty" in exc_info.value.detail.lower()

    def test_nul_byte_rejected(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        _set_root(tmp_path, monkeypatch)
        with pytest.raises(HTTPException) as exc_info:
            enforce_input_path_policy("file\x00name.wind")
        assert exc_info.value.status_code == 400
        assert "invalid" in exc_info.value.detail.lower()

    def test_nul_byte_at_start_rejected(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        _set_root(tmp_path, monkeypatch)
        with pytest.raises(HTTPException) as exc_info:
            enforce_input_path_policy("\x00/etc/passwd")
        assert exc_info.value.status_code == 400

    def test_posix_absolute_rejected(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        """POSIX absolute path is rejected with 400 on all platforms."""
        _set_root(tmp_path, monkeypatch)
        with pytest.raises(HTTPException) as exc_info:
            enforce_input_path_policy("/etc/passwd")
        assert exc_info.value.status_code == 400
        assert "absolute" in exc_info.value.detail.lower()

    def test_windows_drive_absolute_rejected(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Windows drive-absolute path is rejected with 400 on all platforms."""
        _set_root(tmp_path, monkeypatch)
        system_path = "C:\\Windows\\System32\\drivers\\etc\\hosts"
        with pytest.raises(HTTPException) as exc_info:
            enforce_input_path_policy(system_path)
        assert exc_info.value.status_code == 400
        assert "absolute" in exc_info.value.detail.lower()

    def test_windows_drive_forward_slash_rejected(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Windows drive path with forward slashes is rejected with 400."""
        _set_root(tmp_path, monkeypatch)
        with pytest.raises(HTTPException) as exc_info:
            enforce_input_path_policy("C:/Users/secret/file.txt")
        assert exc_info.value.status_code == 400
        assert "absolute" in exc_info.value.detail.lower()

    def test_unc_backslash_rejected(self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
        """UNC path with backslashes is rejected with 400 on all platforms."""
        _set_root(tmp_path, monkeypatch)
        with pytest.raises(HTTPException) as exc_info:
            enforce_input_path_policy("\\\\server\\share\\file.txt")
        assert exc_info.value.status_code == 400
        assert "absolute" in exc_info.value.detail.lower()

    def test_unc_forward_slash_rejected(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """UNC-style path with forward slashes is rejected with 400."""
        _set_root(tmp_path, monkeypatch)
        with pytest.raises(HTTPException) as exc_info:
            enforce_input_path_policy("//server/share/file.txt")
        assert exc_info.value.status_code == 400
        assert "absolute" in exc_info.value.detail.lower()

    def test_dotdot_relative_traversal_rejected(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Relative ``..`` segment is rejected before filesystem access."""
        _set_root(tmp_path, monkeypatch)
        with pytest.raises(HTTPException) as exc_info:
            enforce_input_path_policy("../sibling/secret.wind")
        assert exc_info.value.status_code == 400
        assert "traversal" in exc_info.value.detail.lower()

    def test_dotdot_in_middle_of_path_rejected(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """``..`` anywhere inside a relative path is rejected."""
        _set_root(tmp_path, monkeypatch)
        with pytest.raises(HTTPException) as exc_info:
            enforce_input_path_policy("subdir/../../escape.wind")
        assert exc_info.value.status_code == 400
        assert "traversal" in exc_info.value.detail.lower()

    def test_dotdot_unix_separator_rejected(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        _set_root(tmp_path, monkeypatch)
        with pytest.raises(HTTPException) as exc_info:
            enforce_input_path_policy("foo/../../../etc/passwd")
        assert exc_info.value.status_code == 400
        assert "traversal" in exc_info.value.detail.lower()

    def test_dotdot_backslash_separator_rejected(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """``..`` with backslash separators must also be caught."""
        _set_root(tmp_path, monkeypatch)
        with pytest.raises(HTTPException) as exc_info:
            enforce_input_path_policy("foo\\..\\..\\secret")
        assert exc_info.value.status_code == 400
        assert "traversal" in exc_info.value.detail.lower()

    def test_absolute_path_always_rejected(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Absolute paths are rejected regardless of whether they sit inside a root."""
        _set_root(tmp_path, monkeypatch)
        # Construct an absolute path that IS inside the configured root.
        inside = tmp_path / "file.wind"
        with pytest.raises(HTTPException) as exc_info:
            enforce_input_path_policy(str(inside))
        # Must be 400, not 200 and not 403.
        assert exc_info.value.status_code == 400
        assert "absolute" in exc_info.value.detail.lower()


# ---------------------------------------------------------------------------
# Accepted cases – valid paths inside configured roots
# ---------------------------------------------------------------------------


class TestAcceptedPaths:
    def test_bare_filename_resolves_under_root(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """A bare filename resolves to <root>/<filename>."""
        _set_root(tmp_path, monkeypatch)
        target = tmp_path / "input.wind"
        target.write_text("layer 1", encoding="utf-8")

        resolved = enforce_input_path_policy("input.wind")

        assert resolved == target.resolve()

    def test_nested_relative_path_resolves_under_root(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """A nested relative path resolves correctly under the root."""
        _set_root(tmp_path, monkeypatch)
        nested = tmp_path / "jobs" / "run1"
        nested.mkdir(parents=True)
        target = nested / "program.gcode"
        target.write_text("; gcode", encoding="utf-8")

        resolved = enforce_input_path_policy("jobs/run1/program.gcode")

        assert resolved == target.resolve()

    def test_path_in_second_of_multiple_roots_accepted(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Multiple configured roots are each individually accepted."""
        root_a = tmp_path / "root_a"
        root_b = tmp_path / "root_b"
        root_a.mkdir()
        root_b.mkdir()
        # Files with distinct names in each root.
        target_a = root_a / "file_a.wind"
        target_b = root_b / "file_b.wind"
        target_a.write_text("in-root-a", encoding="utf-8")
        target_b.write_text("in-root-b", encoding="utf-8")

        monkeypatch.setenv(
            "FIBERPATH_API_ALLOWED_ROOTS",
            os.pathsep.join([str(root_a), str(root_b)]),
        )

        # file_a.wind resolves against root_a (first configured root).
        resolved_a = enforce_input_path_policy("file_a.wind")
        assert resolved_a == target_a.resolve()

        # file_b.wind resolves against root_b when root_a is scoped out.
        monkeypatch.setenv("FIBERPATH_API_ALLOWED_ROOTS", str(root_b))
        resolved_b = enforce_input_path_policy("file_b.wind")
        assert resolved_b == target_b.resolve()

    def test_single_dot_in_relative_path_normalised(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Single-dot segments (.) are harmless and should not be rejected."""
        _set_root(tmp_path, monkeypatch)
        target = tmp_path / "input.wind"
        target.write_text("data", encoding="utf-8")

        # "." followed by the filename – still resolves to tmp_path/input.wind
        resolved = enforce_input_path_policy("./input.wind")

        assert resolved == target.resolve()
