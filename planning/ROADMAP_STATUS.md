# FiberPath Roadmap Status Matrix

Last Updated: 2026-04-06

## Active Planning

- Release Validation & E2E ([roadmap-v6.md](roadmap-v6.md))
  - Target Release: v0.6.0
  - Status: Active
  - Completion: 7%
  - Notes: Runtime-validation slice in progress; workflow now extracts package payloads (MSI, .deb, .app) and prefers bundled CLI execution from installed-style runtime layouts
- Production Polish ([roadmap-v7.md](roadmap-v7.md))
  - Target Release: v0.7.0
  - Status: Planned
  - Completion: 0%
  - Notes: Tooling, architecture cleanup, performance, and validation UX refinements after v6

## Completed Roadmaps (Summary)

- Dependency Hardening & Scanning Automation (source: [roadmap-v5.4.md](roadmap-v5.4.md), release: v0.5.4, completion: 100%)
  - Notes: Executed Bucket B high-risk upgrades (React 19, Vite 8, Vitest 4, Zod 4, thiserror 2, etc.). Implemented Dependabot, dependency-audit workflow, SBOM generation, and dependency policy. All exit criteria met, release tagged and published.
- Core Planning Engine (source: RELEASE_HISTORY, release: v0.1.0, completion: 100%)
  - Notes: Initial planning, simulation, and GUI foundation
- GUI Rehaul (source: RELEASE_HISTORY, release: v0.2.0, completion: 100%)
  - Notes: Tauri/React architecture and UI rebuild
- Code Quality (source: RELEASE_HISTORY, release: v0.3.0, completion: 100%)
  - Notes: Test/quality and maintainability improvements
- Streaming & Tabs (source: RELEASE_HISTORY, release: v0.4.0, completion: 100%)
  - Notes: Tab infrastructure and Marlin streaming maturation
- Streaming Refinements (source: RELEASE_HISTORY, release: v0.5.0, completion: 100%)
  - Notes: Pause/cancel behavior and docs overhaul
- Python CLI Bundling (source: [roadmap-v5.1.md](roadmap-v5.1.md), release: v0.5.1, completion: 100%)
  - Notes: Windows-ready bundled CLI with CI/release integration
- v5.2 Release Hardening (source: [roadmap-v5.2.md](roadmap-v5.2.md), release: v0.5.2, completion: 100%)
  - Notes: Shipped release-hardening changes; remaining cross-platform expansion tracked in v6
- v5.3 Dependency Audit & Refresh (source: [roadmap-v5.3.md](roadmap-v5.3.md), release: v0.5.3, completion: 100%)
  - Notes: Low-risk dependency refresh across Python/Node/Rust; 3 CVE fixes; Bucket B deferred to v5.4

## Reference Documents

- Backlog decision log: [roadmap-backlog.md](roadmap-backlog.md)
- Release history summary: [RELEASE_HISTORY.md](RELEASE_HISTORY.md)
- Outstanding validation items: [OUTSTANDING_VALIDATION.md](OUTSTANDING_VALIDATION.md)

## Definitions

- Complete: Shipped and closed scope
- Active: Current execution roadmap
- Planned: Sequenced roadmap not yet started
- Reference: Input/decision documents, not execution roadmaps
