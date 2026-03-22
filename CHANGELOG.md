# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog, and this project follows semantic versioning.

## [Unreleased]

### Planned

- v0.6.0 release validation, cross-platform verification, and E2E automation.

## [0.5.3] - 2026-03-22

### Added

- Formal dependency audit matrix and risk-bucket staging workflow across Python, Node/Tauri, and Cargo ecosystems.
- Explicit deferral track for high-risk dependency migrations into v0.5.4.

### Changed

- Updated low-risk Python dependencies and toolchain packages to current compatible releases.
- Updated low-risk GUI/npm dependencies while preserving framework-major boundaries.
- Synchronized release metadata and documentation references for the v0.5.3 release line.

### Fixed

- Restored stable local development environment bootstrap guidance by clarifying extras-based `uv sync` usage for test/dev workflows.
- Resolved Tauri npm/crate parity drift from prior lockfile changes and revalidated packaging behavior.

## [0.5.2] - 2026-03-22

### Added

- Strict helical layer divisibility validation to prevent silent layer omission when computed circuits are incompatible with `patternNumber`.
- API route path policy enforcement for planning, validation, and simulation file operations.
- CSS variable guard script integrated into GUI CI to fail unresolved token references.
- Expanded regression coverage for strict helical validation behavior across planning, simulation, and visualization tests.

### Changed

- Clarified winding terminology in docs and in-app tooltips for helical and skip parameters (`windAngle`, `patternNumber`, `skipIndex`, lock/lead settings).
- Consolidated remaining cross-platform validation and E2E execution work into the v0.6.0 roadmap plan.

### Fixed

- GUI contrast regressions in dialogs and status surfaces caused by missing token aliases and legacy button style drift.
- Legacy visualization test expectations that assumed invalid helical fixtures would still plan successfully.

## [0.5.1] - 2026-03-22

### Added

- Bundled Python CLI in desktop distribution for Windows release path.
- Release workflow hardening for tagged packaging and publishing.

### Changed

- Windows packaging and upgrade-path validation for bundled CLI behavior.

## [0.5.0] - 2026-03-22

### Changed

- Marlin streaming pause/cancel behavior refinements.
- Documentation overhaul and workflow cleanup.
