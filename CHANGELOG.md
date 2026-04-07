# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog, and this project follows semantic versioning.

<!-- markdownlint-disable MD024 -->

## [Unreleased]

### Added

- Documented critical helical coverage defect: `lockDegrees` compatibility with `patternNumber` is not fully validated and can allow partial mandrel coverage without a planner error for incompatible combinations (for example `lockDegrees=270`, `patternNumber=3`).
- Documented required compatibility rule for helical coverage safety: `(2 × lockDegrees) % (360 / patternNumber) == 0`.
- Documented planned validator hardening to reject `lockDegrees`/`patternNumber` combinations that produce overlapping or aliased in-pattern positions.
- Documented planned behavior fix where `skipIndex` is currently schema-validated but not yet applied to helical in-pattern visit order.
- Documented planned schema normalization for `skipInitialNearLock` from nullable boolean to `bool` with default `false`.
- Documented required docs correction scope for `lockDegrees`, `patternNumber`, and coverage-vs-ply-count semantics, including clarification that feed-rate clamping in planner math is planned, not currently implemented.
- Documented required example updates for compatibility: `examples/rocketry/AvBay(470mm).wind` layer 1 and `examples/rocketry/MainChute(585mm).wind` layer 1 should use `lockDegrees=540` instead of `270`.

## [0.6.1] - 2026-04-07

### Added

- Automated `useTheme` hook regression tests covering system preference fallback, persisted manual overrides, and reset-to-system behavior.

### Changed

- Completed GUI styling simplification rollout with token-first cleanup, reduced style entropy, and updated styling guidance to match implementation reality.
- Updated release-facing docs to reflect v0.6.1 as the current release and refreshed versioned troubleshooting examples.

### Fixed

- Removed dead GUI dependencies (`@radix-ui/react-dropdown-menu`, `@radix-ui/react-menubar`, `clsx`) from package metadata.
- Resolved stylelint compliance issues in `StreamTab.css` (`currentcolor` keyword casing and media range notation syntax).
- Synchronized release version metadata across Python, npm, Cargo, and Tauri config to eliminate cross-stack version drift.

## [0.6.0] - 2026-04-06

### Added

- Comprehensive GUI E2E smoke test workflow (`gui-e2e-smoke.yml`) with cross-platform matrix validation (Windows/macOS/Ubuntu).
- Package artifact presence validation for all OS distributions (`.msi`/`.exe`, `.deb`/`.AppImage`, `.dmg`/`.app`).
- Bundled CLI resolution and smoke execution on packaged outputs; validates `validate`, `plan`, and `plot` CLI commands from frozen binaries.
- Hash-based bundled CLI discovery for Windows MSI streams with automatic materialization to executable format.
- Reference CLI artifact download and management for E2E validation comparisons.

### Changed

- E2E smoke workflow now enforces packaged CLI validation on all platforms with hard-fail on bundled CLI discovery (no silent fallback).
- Windows bundled CLI discovery supports structural path matching and hash-based fallback for opaque MSI stream extraction scenarios.
- Improved artifact inspection and debugging output in E2E workflows for faster triage of packaging regressions.

### Fixed

- Resolved Ubuntu E2E broken-pipe error in artifact listing under `set -euo pipefail` (replaced `find | head -20 || true` with `find | awk 'NR <= 20'`).
- Restored macOS bundled CLI executable bit preservation after artifact download by adding `chmod +x` in CLI source selection.
- Fixed Windows E2E hang by replacing indefinite `msiexec /a` admin-install with reliable 7-zip extraction (with msiexec fallback).
- CLI smoke tests now use `--help` capability check instead of unsupported `--version` flag.
- Windows MSI stream CLI files now properly materialized to `.resolved-bundled-cli/fiberpath.exe` for PowerShell execution.

## [0.5.4] - 2026-03-23

### Added

- Dependabot automation for pip, npm, cargo, and GitHub Actions with managed PR limits and ignore controls for deferred version lanes.
- New dependency security workflow (`dependency-audit`) that gates Python, Node, and Rust audits and uploads machine-readable reports.
- Release SBOM generation/upload for Python, Node, and Rust artifacts as part of the GitHub release pipeline.
- Published dependency policy covering cadence, ownership, CVE SLAs, and exception handling.

### Changed

- Completed deferred high-risk dependency migrations from v0.5.3, including React 19, Vite 8, Vitest 4, Zod 4, stylelint 17, thiserror 2, and which 8.
- Aligned GUI runtime/tooling constraints to Node 24 and npm 11 with CI parity in shared setup actions.

### Fixed

- Resolved Python audit vulnerabilities by upgrading `fonttools` and `urllib3` to patched versions.
- Removed optional GUI test UI dependency path that introduced unresolved upstream audit exposure.

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

## Prior (To Organize)

- v0.1.0
  - Core planning engine, geometry, simulation baseline, and initial CLI/API hardening.
- v0.2.0
  - GUI rehaul and Tauri/React workflow maturation.
- v0.3.0
  - Quality/stability pass, testing expansion, error handling, and CI/CD organization.
- v0.4.0
  - Tabbed interface and Marlin streaming integration maturity.
