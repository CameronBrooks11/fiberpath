# `.wind` conformance corpus

A machine-checkable corpus that pins the **accept/reject contract** of the
[`.wind` format](../docs/guides/wind-format.md), independent of the byte-level
example goldens in [`examples/`](../examples).

- **`valid/`** — documents that a conforming implementation **MUST parse and plan**.
  Covers hoop, helical, skip, multi-layer, and cone (`schemaVersion 1.1`) inputs.
- **`invalid/`** — documents that **MUST be rejected**, each paired in
  [`invalid/manifest.json`](invalid/manifest.json) with a `match` substring that the
  raised error message must contain. The pairing ensures a case fails for the
  **stated reason** (e.g. non-coprime coverage, an unreachable cone angle), not
  incidentally. Schema/parse failures raise `WindFileError`; semantic failures raise
  `LayerValidationError`.

The corpus is enforced by `tests/conformance/test_conformance.py`. To add a case,
drop a `.wind` in the right directory (and, for `invalid/`, add a `manifest.json`
entry — a test asserts every invalid file is listed).

This is distinct from `examples/`, which is the user-facing showcase (and the source
of the byte-level golden regression tests).
