# Fiber Winding Path Planning Review

Date: 2026-03-22
Scope: Pre-change review of planner correctness, validation behavior, and planning interfaces (CLI/API)

## Summary

The planner and adjacent subsystems are generally healthy (all tests passing), but one behavior is high risk for production correctness: a helical layer can be silently skipped instead of failing validation.

## Findings (Ordered by Severity)

### 1) High: Helical layer can be silently skipped

- Location: `fiberpath/planning/layer_strategies.py`
- Evidence:
  - `num_circuits % pattern_number != 0` check logs a warning
  - function then returns early, skipping layer planning
- Why it matters:
  - Planning can appear successful while omitting intended fiber placement
  - This can produce incomplete or unsafe winding programs without hard failure
- Related code paths:
  - Skip/coprime validation exists, but divisibility is not enforced in validator
  - `fiberpath/planning/validators.py` currently validates `skipIndex < patternNumber` and coprimality

Recommendation:
- Move divisibility rule into validation and raise `LayerValidationError` when violated.
- Keep planner execution path free of silent skip for invalid helical geometry.

### 2) Medium: API path handling permits broad filesystem access patterns

- Location: `fiberpath_api/schemas.py`, `fiberpath_api/routes/plan.py`
- Evidence:
  - API accepts arbitrary string path
  - Output is written beside input using `with_suffix(".gcode")`
- Why it matters:
  - If API is exposed beyond trusted local contexts, path access/overwrite risk increases

Recommendation:
- Constrain planning input to allowed roots and/or require explicit safe output directories.
- Add normalization and rejection of paths outside configured workspace roots.

### 3) Low: CLI catches all exceptions and flattens diagnostics

- Location: `fiberpath_cli/plan.py`
- Evidence:
  - broad `except Exception` with generic error output
- Why it matters:
  - Friendly UX, but reduced observability during debugging and CI triage

Recommendation:
- Catch known planner/config exceptions first.
- Optionally expose traceback under a debug flag.

## Validation Performed

- Read planner core and validation flow:
  - `fiberpath/planning/planner.py`
  - `fiberpath/planning/validators.py`
  - `fiberpath/planning/layer_strategies.py`
  - `fiberpath/planning/machine.py`
- Read integration surfaces:
  - `fiberpath_cli/plan.py`
  - `fiberpath_api/routes/plan.py`
  - `fiberpath_api/schemas.py`
- Ran tests:
  - `pytest tests/planning -q` -> 30 passed
  - `pytest tests/config tests/gcode tests/simulation -q` -> 20 passed
  - `pytest -q` -> 93 passed

## Known Testing Gap

Current tests pass, but there is no guard that prevents silent helical-layer skip from being treated as a successful plan. This is a correctness risk that can hide invalid production inputs.

## Suggested Backlog Items

1. Add strict helical divisibility validation (`LayerValidationError`) and tests.
2. Harden API path policy for non-local deployments.
3. Refine CLI exception handling for better diagnostics.
