# FiberPath Release History Summary

Last Updated: 2026-03-22

Purpose: Preserve key historical context needed for planning and changelog work without relying on archived roadmap files.

## Released Milestones

- v0.1.0
  - Core planning engine, geometry, simulation baseline, and initial CLI/API hardening.
- v0.2.0
  - GUI rehaul and Tauri/React workflow maturation.
- v0.3.0
  - Quality/stability pass, testing expansion, error handling, and CI/CD organization.
- v0.4.0
  - Tabbed interface and Marlin streaming integration maturity.
- v0.5.0
  - Streaming control refinements, state cleanup, and documentation overhaul.
- v0.5.1
  - Python CLI bundling for desktop distribution, release workflow hardening, Windows validation complete.
- v0.5.2
  - Release hardening pass: strict helical divisibility enforcement, API path policy enforcement, and GUI contrast/token stabilization with CI guardrails.
- v0.5.3
  - Dependency audit and low-risk refresh across Python, Node/Tauri, and Rust ecosystems. Applied 16 Python patch/minor updates, 8 npm updates, and Tauri minor parity alignment. Addressed 3 CVEs (filelock CVE-2026-22701, pillow CVE-2026-25990, virtualenv CVE-2026-22702). High-risk/major-version upgrades (starlette 1.0, fastapi, typer, vite 8, vitest 4, react 19, zod 4, thiserror 2, which 8) deferred to v0.5.4.

## Deferred Into v0.6.0

- Linux/macOS freeze and validation coverage completion.
- Cross-platform installer/runtime verification and CI E2E automation.

## Current Active Targets

- v0.5.4: Deferred high-risk dependency upgrades (starlette 1.0, fastapi, typer, vite 8, vitest 4, react 19, zod 4, thiserror 2, which 8) plus dependency-scanning automation close-out (Dependabot, CI policy, SBOM).
- v0.6.0: Release validation, cross-platform verification, and E2E automation.
- v0.7.0: Production polish and developer infrastructure.

## Notes for CHANGELOG

When authoring CHANGELOG.md, use this file as the seed outline and expand each release with dated, user-facing highlights.
