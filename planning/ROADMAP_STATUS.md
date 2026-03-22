# FiberPath Roadmap Status Matrix

Last Updated: 2026-03-22

## Active Planning

- Dependency Audit & Low-Risk Refresh ([roadmap-v5.3.md](roadmap-v5.3.md))
  - Target Release: v0.5.3
  - Status: Active
  - Completion: 65%
  - Notes: Initial audit complete; Python and Node low-risk updates executed and validated, Tauri packaging green, remaining work is final curation/changelog/release
- Dependency Hardening & Scanning Automation ([roadmap-v5.4.md](roadmap-v5.4.md))
  - Target Release: v0.5.4
  - Status: Planned
  - Completion: 0%
  - Notes: High-risk deferred upgrades and required dependency-scanning close-out (Dependabot + CI policy)
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
| Python CLI Bundling    | [roadmap-v5.1.md](roadmap-v5.1.md) | v0.5.1  | Complete | 100%       | Windows-ready bundled CLI with CI/release integration                               |
| v5.2 Release Hardening | [roadmap-v5.2.md](roadmap-v5.2.md) | v0.5.2  | Complete | 100%       | Shipped release-hardening changes; remaining cross-platform expansion tracked in v6 |

## Reference Documents

- Backlog decision log: [roadmap-backlog.md](roadmap-backlog.md)
- Release history summary: [RELEASE_HISTORY.md](RELEASE_HISTORY.md)
- Outstanding validation items: [OUTSTANDING_VALIDATION.md](OUTSTANDING_VALIDATION.md)

## Definitions

- Complete: Shipped and closed scope
- Active: Current execution roadmap
- Planned: Sequenced roadmap not yet started
- Reference: Input/decision documents, not execution roadmaps
