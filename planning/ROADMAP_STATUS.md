# FiberPath Roadmap Status Matrix

Last Updated: 2026-03-22

## Active Planning

- Dependency Hardening & Scanning Automation ([roadmap-v5.4.md](roadmap-v5.4.md))
  - Target Release: v0.5.4
  - Status: Active
  - Completion: 45%
  - Notes: Phase 1 intake refreshed on current baseline; Phase 2 Rust + Python slices complete (fastapi 0.135.1, starlette 1.0.0, typer 0.24.1, websockets 16.0, thiserror 2.0.18, which 8.0.2) with Python tests (96), CLI tests (12), API endpoint smoke (/plan + /simulate), cargo checks/tests/audit, and GUI build smoke all passing
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

| Phase                  | Source                             | Release | Status   | Completion | Notes                                                                               |
| ---------------------- | ---------------------------------- | ------- | -------- | ---------- | ----------------------------------------------------------------------------------- |
| Core Planning Engine   | RELEASE_HISTORY                    | v0.1.0  | Complete | 100%       | Initial planning, simulation, and GUI foundation                                    |
| GUI Rehaul             | RELEASE_HISTORY                    | v0.2.0  | Complete | 100%       | Tauri/React architecture and UI rebuild                                             |
| Code Quality           | RELEASE_HISTORY                    | v0.3.0  | Complete | 100%       | Test/quality and maintainability improvements                                       |
| Streaming & Tabs       | RELEASE_HISTORY                    | v0.4.0  | Complete | 100%       | Tab infrastructure and Marlin streaming maturation                                  |
| Streaming Refinements  | RELEASE_HISTORY                    | v0.5.0  | Complete | 100%       | Pause/cancel behavior and docs overhaul                                             |
| Python CLI Bundling              | [roadmap-v5.1.md](roadmap-v5.1.md) | v0.5.1  | Complete | 100%       | Windows-ready bundled CLI with CI/release integration                               |
| v5.2 Release Hardening           | [roadmap-v5.2.md](roadmap-v5.2.md) | v0.5.2  | Complete | 100%       | Shipped release-hardening changes; remaining cross-platform expansion tracked in v6 |
| v5.3 Dependency Audit & Refresh  | [roadmap-v5.3.md](roadmap-v5.3.md) | v0.5.3  | Complete | 100%       | Low-risk dep refresh across Python/Node/Rust; 3 CVE fixes; Bucket B deferred to v5.4 |

## Reference Documents

- Backlog decision log: [roadmap-backlog.md](roadmap-backlog.md)
- Release history summary: [RELEASE_HISTORY.md](RELEASE_HISTORY.md)
- Outstanding validation items: [OUTSTANDING_VALIDATION.md](OUTSTANDING_VALIDATION.md)

## Definitions

- Complete: Shipped and closed scope
- Active: Current execution roadmap
- Planned: Sequenced roadmap not yet started
- Reference: Input/decision documents, not execution roadmaps
