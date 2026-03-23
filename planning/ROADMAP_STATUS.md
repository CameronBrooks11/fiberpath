# FiberPath Roadmap Status Matrix

Last Updated: 2026-03-22

## Active Planning

- Dependency Hardening & Scanning Automation ([roadmap-v5.4.md](roadmap-v5.4.md))
  - Target Release: v0.5.4
  - Status: Active
  - Completion: 88%
  - Notes: Phase 1 intake complete; all planned Phase 2 migration slices are complete across Rust, Python, and Node (vite 8.0.1, vitest 4.1.0, React 19, zod 4, stylelint 17). Phase 4 implementation landed: `.github/dependabot.yml`, `.github/workflows/dependency-audit.yml`, release SBOM generation/upload, and dependency policy doc with contributor link. Remaining work is Phase 3 release prep plus end-to-end Phase 4 verification (Dependabot PR flow, dependency-audit workflow run, SBOM presence on release artifacts)
- Release Validation & E2E ([roadmap-v6.md](roadmap-v6.md))
  - Target Release: v0.6.0
  - Status: Planned
  - Completion: 0%
  - Notes: Starts after v0.5.4 dependency stabilization and scanning close-out are complete
- Production Polish ([roadmap-v7.md](roadmap-v7.md))
  - Target Release: v0.7.0
  - Status: Planned
  - Completion: 0%
  - Notes: Tooling, architecture cleanup, performance, and validation UX refinements after v6

## Completed Roadmaps (Summary)

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
