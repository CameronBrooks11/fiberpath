"""Conformance corpus gate for the `.wind` open format (#141).

Every file under `conformance/valid/` MUST parse and plan; every file under
`conformance/invalid/` MUST be rejected, for the reason recorded in
`conformance/invalid/manifest.json`. This pins the format's accept/reject contract
independently of the byte-level example goldens.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from fiberpath.config import load_wind_definition
from fiberpath.config.validator import WindFileError
from fiberpath.planning import plan_wind
from fiberpath.planning.exceptions import PlanningError

REPO_ROOT = Path(__file__).resolve().parents[2]
CORPUS = REPO_ROOT / "conformance"
VALID = sorted((CORPUS / "valid").glob("*.wind"))
MANIFEST = json.loads((CORPUS / "invalid" / "manifest.json").read_text(encoding="utf-8"))
INVALID_CASES = MANIFEST["cases"]

# Guard against a vacuous pass: an empty/renamed corpus yields 0 parametrized
# cases, which pytest turns into a skip (exit 0) rather than a failure.
assert VALID, "no valid corpus files found under conformance/valid/"
assert INVALID_CASES, "no invalid corpus cases in conformance/invalid/manifest.json"


@pytest.mark.parametrize("wind", VALID, ids=[p.name for p in VALID])
def test_valid_corpus_parses_and_plans(wind: Path) -> None:
    """A conforming document loads and plans to a non-empty program."""
    result = plan_wind(load_wind_definition(wind))
    assert result.commands, f"{wind.name} planned to an empty program"


@pytest.mark.parametrize("case", INVALID_CASES, ids=[c["file"] for c in INVALID_CASES])
def test_invalid_corpus_is_rejected(case: dict[str, str]) -> None:
    """A non-conforming document is rejected for its recorded reason."""
    wind = CORPUS / "invalid" / case["file"]
    with pytest.raises((WindFileError, PlanningError)) as exc_info:
        plan_wind(load_wind_definition(wind))
    assert case["match"] in str(exc_info.value), (
        f"{case['file']} was rejected, but not for the expected reason "
        f"{case['match']!r}: {exc_info.value}"
    )


def test_every_invalid_file_has_a_manifest_entry() -> None:
    """No invalid case slips through unchecked (a file with no `match` would
    otherwise pass vacuously if it happened to raise for any reason)."""
    on_disk = {p.name for p in (CORPUS / "invalid").glob("*.wind")}
    in_manifest = {c["file"] for c in INVALID_CASES}
    assert on_disk == in_manifest, f"manifest/file mismatch: {on_disk ^ in_manifest}"
