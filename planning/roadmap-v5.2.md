# FiberPath Roadmap v5.2 - Release Record

**Target Release:** v0.5.2  
**Status:** Closed (scope migrated)  
**Prerequisites:** v0.5.1 (Windows bundling complete)

**Scope Boundary:** v5.2 now records completed release-hardening work only.  
**Related Roadmaps:** [roadmap-v6.md](roadmap-v6.md) owns all remaining cross-platform validation, documentation, and E2E automation work.  
**Validation Reference:** [OUTSTANDING_VALIDATION.md](OUTSTANDING_VALIDATION.md)

---

## Completed in v5.2

- [x] **[Finding 1 — High]** Enforced helical layer divisibility as a validation error with regression coverage
- [x] **[Finding 2 — Medium]** Restricted API input/output paths to allowed roots with explicit policy enforcement
- [x] Fixed GUI/export contrast regressions by restoring missing design-token aliases and dialog primary button styles
- [x] Completed UI contrast normalization pass for dialogs, stream views, notifications, and status surfaces
- [x] Added CSS variable guard checks so undefined custom properties fail CI

---

## Migration Note

All unfinished v5.2 items were intentionally consolidated into [roadmap-v6.md](roadmap-v6.md), including:

- Linux validation and packaging verification
- macOS validation and Gatekeeper/driver coverage
- Development fallback and contributor setup docs
- Cross-platform package E2E smoke automation

This file remains as a release-history checkpoint for what was completed before consolidation.
