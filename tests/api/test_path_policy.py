"""Tests for path-policy hardening (enforce_input_path_policy).

Rejected cases
--------------
- NUL bytes in path
- POSIX absolute path  (/etc/passwd)
- Windows drive-absolute path  (C:\\Windows\\System32\\file.txt)
- Windows UNC path  (\\\\server\\share\\file)
- ``..`` traversal (relative and absolute-with-traversal)
- Empty string / whitespace-only string

Accepted cases
--------------
- Bare filename relative to a configured root
- Nested relative path under a configured root
- Absolute path whose resolved location is inside a configured root
- Multiple configured roots: path in second root accepted
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

    def test_posix_absolute_outside_root_rejected(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """POSIX absolute path outside any configured root → 403."""
        _set_root(tmp_path, monkeypatch)
        with pytest.raises(HTTPException) as exc_info:
            enforce_input_path_policy("/etc/passwd")
        assert exc_info.value.status_code == 403
        assert "outside allowed API roots" in exc_info.value.detail

    def test_windows_drive_absolute_outside_root_rejected(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """Windows drive-absolute path (e.g. C:\\Windows\\...) outside root → 403."""
        _set_root(tmp_path, monkeypatch)
        # Use a drive letter that is definitely outside tmp_path.
        system_path = "C:\\Windows\\System32\\drivers\\etc\\hosts"
        with pytest.raises(HTTPException) as exc_info:
            enforce_input_path_policy(system_path)
        # Either 400 (if the OS rejects the path during resolution) or 403 (outside root)
        assert exc_info.value.status_code in (400, 403)

    def test_unc_path_outside_root_rejected(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """UNC path (\\\\server\\share\\...) outside root → 403."""
        _set_root(tmp_path, monkeypatch)
        with pytest.raises(HTTPException) as exc_info:
            enforce_input_path_policy("\\\\server\\share\\file.txt")
        assert exc_info.value.status_code in (400, 403)

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

    def test_relative_path_outside_root_rejected(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """A relative path that resolves outside all configured roots → 403.

        We configure *tmp_path/subdir* as the only root; supplying just
        ``"another_dir/file.txt"`` will resolve to
        *tmp_path/subdir/another_dir/file.txt* which is inside the root, so
        instead we set the root to a *subdirectory* and supply a path that
        would land in a sibling directory.
        """
        restricted_root = tmp_path / "allowed"
        restricted_root.mkdir()
        monkeypatch.setenv("FIBERPATH_API_ALLOWED_ROOTS", str(restricted_root))

        with pytest.raises(HTTPException) as exc_info:
            # Absolute path to a file outside the restricted root
            enforce_input_path_policy(str(tmp_path / "not_allowed" / "file.txt"))
        assert exc_info.value.status_code == 403


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

    def test_absolute_path_inside_root_accepted(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """An absolute path that is inside the configured root is accepted."""
        _set_root(tmp_path, monkeypatch)
        target = tmp_path / "data.wind"
        target.write_text("content", encoding="utf-8")

        resolved = enforce_input_path_policy(str(target))

        assert resolved == target.resolve()

    def test_absolute_path_in_subdirectory_of_root_accepted(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """An absolute path deep inside the root is accepted."""
        _set_root(tmp_path, monkeypatch)
        subdir = tmp_path / "a" / "b" / "c"
        subdir.mkdir(parents=True)
        target = subdir / "file.wind"
        target.write_text("x", encoding="utf-8")

        resolved = enforce_input_path_policy(str(target))

        assert resolved == target.resolve()

    def test_path_in_second_of_multiple_roots_accepted(
        self, tmp_path: Path, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """When multiple roots are configured, a path in the second root is accepted."""
        root_a = tmp_path / "root_a"
        root_b = tmp_path / "root_b"
        root_a.mkdir()
        root_b.mkdir()
        target = root_b / "work.wind"
        target.write_text("multi-root", encoding="utf-8")

        monkeypatch.setenv(
            "FIBERPATH_API_ALLOWED_ROOTS",
            os.pathsep.join([str(root_a), str(root_b)]),
        )

        resolved = enforce_input_path_policy(str(target))

        assert resolved == target.resolve()

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
