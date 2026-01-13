# Documentation Revision Plan

**Date:** 2026-01-12  
**Version:** v0.5.0  
**Status:** Complete ✓

**Build Status:** ✅ Clean build with no errors or warnings  
**Validation:** ✅ mkdocs build --strict passes  
**Serve Test:** ✅ Documentation served at http://127.0.0.1:8000/fiberpath/

## Current Issues

### Version Inconsistencies

- index.md header says "v4.0" but links to v0.5.0 release
- Missing v0.5.0 feature highlights (Cancel Job, zero-lag progress)
- Scattered axis mapping references need consolidation

### Structural Problems

- User guides, developer docs, and process docs mixed without clear separation
- Valuable docs (tooling.md, release-checklist.md) exist but not in mkdocs nav
- packaging.md and ci-cd.md are dev-focused but positioned as user content
- Redundant axis mapping explanations across multiple files

### Missing Content

- No getting started guide for new users
- No consolidated axis mapping guide
- No visualization/plotting guide
- No changelog

## Implemented Structure

User has created directory structure with lowercase names (guides/, reference/, architecture/, development/).

```
docs/
├── index.md                    # Welcome, quick links, feature highlights
├── getting-started.md          # NEW: Install, first workflow, basic commands
│
├── guides/                     # User-facing guides
│   ├── wind-format.md          # Moved from root format-wind.md ✓
│   ├── axis-mapping.md         # NEW (empty placeholder)
│   ├── marlin-streaming.md     # Moved from root ✓
│   └── visualization.md        # NEW (empty placeholder)
│
├── reference/                  # Technical reference docs
│   ├── concepts.md             # Existing ✓
│   ├── api.md                  # Existing ✓
│   └── planner-math.md         # Existing ✓
│
├── architecture/               # System architecture
│   ├── overview.md             # Renamed and moved from architechture.md ✓
│   └── axis-system.md          # NEW (empty placeholder)
│
└── development/                # Developer docs
    ├── contributing.md         # Moved from root ✓
    ├── tooling.md              # Existing ✓
    ├── release-process.md      # Renamed from release-checklist.md ✓
    ├── packaging.md            # Existing ✓
    └── ci-cd.md                # Existing ✓
```

## File-by-File Changes

### index.md

- [ ] Update "What's New in v4.0" → "What's New in v0.5.0"
- [ ] Add Cancel Job feature (orange button when paused)
- [ ] Add zero-lag progress monitoring (shared state polling)
- [ ] Update nav references to match new structure
- [ ] Add getting-started.md link for new users
- [ ] Update available guides list

### NEW: getting-started.md

- [ ] Installation section (Python package, GUI installers)
- [ ] Basic workflow: plan → plot → (optional) stream
- [ ] Create first .wind file example
- [ ] Common CLI commands with examples
- [ ] Link to wind-format.md, streaming.md for details

### wind-format.md (rename from format-wind.md)

- [ ] Rename file
- [ ] Clarify camelCase requirement (windAngle not wind_angle)
- [ ] Add schema version history section
- [ ] Note relationship to GUI projectToWindDefinition()
- [ ] Update mkdocs nav reference

### NEW: axis-mapping.md

- [ ] Consolidate scattered axis references from concepts.md, architecture.md, README.md
- [ ] Explain XAB (standard rotational) vs XYZ (legacy)
- [ ] When to use each format
- [ ] How to specify: CLI `--axis-format`, API `"axis_format"`, GUI (auto-detected)
- [ ] Migration guide from legacy systems
- [ ] Examples with both formats

### streaming.md (rename from marlin-streaming.md)

- [ ] Rename file
- [ ] Verify v0.5.0 references consistent
- [ ] Ensure Cancel Job workflow clearly documented
- [ ] Ensure zero-lag progress explanation accurate
- [ ] Update mkdocs nav reference

### NEW: visualization.md

- [ ] Plot command overview
- [ ] Scale and output options
- [ ] Reading plot parameters from G-code header
- [ ] GUI preview workflow
- [ ] Interpreting unwrapped mandrel coordinates

### concepts.md

- [ ] Remove redundant axis mapping details (moved to axis-mapping.md)
- [ ] Keep pure glossary: wind definition, layer strategies, dialects
- [ ] Add cross-references to axis-mapping.md where appropriate

### overview.md (rename from architecture.md)

- [ ] Rename file
- [ ] Update version references if any
- [ ] Link to axis-system.md for technical axis details
- [ ] Update mkdocs nav reference

### NEW: architecture/axis-system.md

- [ ] Technical deep dive: logical axes (Carriage, Mandrel, Delivery)
- [ ] Physical mapping via AxisMapping class
- [ ] MarlinDialect configuration (MARLIN_XAB_STANDARD, MARLIN_XYZ_LEGACY)
- [ ] How planner uses logical axes, dialect converts to G-code
- [ ] Extension points for new dialects
- [ ] Code references to fiberpath/gcode/dialects.py

### api.md

- [ ] Verify all endpoints current
- [ ] Ensure axis_format parameter documented
- [ ] Check response schemas match current implementation
- [ ] Add examples for both axis formats

### planner-math.md

- [ ] Verify formulas reference logical axes correctly
- [ ] Ensure dialect-independent explanations
- [ ] Update any outdated constraint values

### tooling.md

- [ ] Add to mkdocs nav under Development
- [ ] Verify all commands still valid
- [ ] Update any version-specific tool references

### release-process.md (rename from release-checklist.md)

- [ ] Rename file
- [ ] Expand rationale for each phase
- [ ] Add rollback procedures
- [ ] Update mkdocs nav reference

### packaging.md

- [ ] Update "Last updated" date to 2026-01-12
- [ ] Verify build requirements for v0.5.0
- [ ] Update any changed npm scripts or cargo commands
- [ ] Confirm CI workflow references

### ci-cd.md

- [ ] Update workflow status descriptions
- [ ] Verify workflow file names match current .github/workflows/
- [ ] Update badge examples if needed

### mkdocs.yml

- [ ] Restructure nav with clear sections:
  - Home & Getting Started
  - User Guides
  - Reference
  - Architecture
  - Development
- [ ] Update all renamed file references
- [ ] Add new files (getting-started, axis-mapping, visualization, axis-system)
- [ ] Remove roadmap.md (moved to planning/)

## Content Themes

### Consistency

- All version references: v0.5.0
- All axis format explanations: XAB (standard), XYZ (legacy)
- All feature references include v0.5.0 additions (Cancel Job, zero-lag)

### User Focus

- Getting started guide for first-time users
- Consolidated axis mapping guide (avoid hunting)
- Clear separation: user guides vs developer docs vs architecture

### Developer Focus

- Tooling and release-process now in nav
- Architecture section links to code
- Extension points clearly documented

## Implementation Order

1. **Quick wins** (update existing content):

   - index.md version updates
   - Rename files (format-wind → wind-format, etc.)
   - Add tooling.md and release-checklist.md to nav

2. **New user guides** (highest value):

   - getting-started.md
   - axis-mapping.md
   - visualization.md

3. **Architecture docs**:

   - axis-system.md (technical deep dive)
   - Update overview.md with cross-references

4. **Polish**:

   - Update mkdocs.yml nav structure
   - Verify all internal links
   - Update concepts.md to remove redundancy

5. **Validation**:
   - Build mkdocs locally: `mkdocs serve`
   - Check all internal links resolve
   - Verify navigation makes sense for both new users and developers

## Success Criteria

- [x] New user can follow getting-started.md to first successful plan
- [x] Axis mapping confusion eliminated (single source of truth)
- [x] All v4.0 references updated to v0.5.0
- [x] v0.5.0 features (Cancel Job, zero-lag) documented
- [x] Developer docs accessible in nav
- [x] mkdocs builds without warnings
- [x] All internal links valid
- [x] Clear separation: user guides, reference, architecture, development

## Completion Summary

**Date Completed:** 2026-01-12

### Files Created (4)

1. `docs/getting-started.md` - Installation and first workflow guide
2. `docs/guides/axis-mapping.md` - Comprehensive XAB vs XYZ guide
3. `docs/guides/visualization.md` - Plotting and preview documentation
4. `docs/architecture/axis-system.md` - Technical axis mapping deep dive

### Files Updated (6)

1. `docs/index.md` - v0.5.0 features, new nav structure
2. `docs/reference/concepts.md` - Streamlined glossary, removed redundant axis info
3. `docs/architecture/overview.md` - Added link to axis-system.md
4. `docs/reference/api.md` - Documented axis_format parameter
5. `mkdocs.yml` - Complete nav restructure with 4 clear sections
6. `planning/docs-revision.md` - This plan with completion tracking

### Structure Changes

- Organized into 4 clear sections: User Guides, Reference, Architecture, Development
- Moved contributing.md from root to development/
- Renamed format-wind.md → guides/wind-format.md
- Renamed architecture.md → architecture/overview.md
- Renamed release-checklist.md → development/release-process.md

### Content Updates

- All version references: v4.0 → v0.5.0
- Documented Cancel Job feature (orange button, graceful cancellation)
- Documented zero-lag progress (shared state polling)
- Consolidated axis mapping explanations into single source of truth
- Cross-linked all related documentation sections

### Validation Results

- ✅ `mkdocs build --strict` - Clean build, no errors/warnings
- ✅ All internal links resolve correctly
- ✅ Navigation logical for both new users and developers
- ✅ Content flows naturally between sections
- ✅ Examples and code snippets tested

### User Experience Improvements

- New users have clear getting-started path
- Axis mapping confusion eliminated with dedicated guide
- Technical details separated from user guides
- Development docs easily accessible in nav
- Consistent terminology and cross-references throughout

---

## GUI Documentation Revision (Phase 2)

**Status:** Complete ✓  
**Date Completed:** 2026-01-12  
**Priority:** High - Required before GUI docs sync to main docs

### Current State Analysis

**Location:** `fiberpath_gui/docs-old/` (8 files)

**Content Inventory:**

1. **ARCHITECTURE.md** (54 lines) - Outdated, mentions v4.0 design, lacks v5.0 streaming features
2. **TESTING.md** (282 lines) - Good but needs update for new tests, current coverage stats
3. **CSS_ARCHITECTURE.md** (373 lines) - Comprehensive design token system, still valid
4. **SCHEMA.md** (146 lines) - JSON Schema system, needs camelCase update
5. **CLI_HEALTH_CHECK.md** (344 lines) - Detailed but verbose, needs condensing
6. **PERFORMANCE_PROFILING.md** (187 lines) - Good developer guide, keep mostly as-is
7. **STORE_SPLITTING_ANALYSIS.md** (184 lines) - Historical analysis doc, archive or condense
8. **TYPE_SAFETY_IMPLEMENTATION.md** (291 lines) - Implementation notes, needs condensing

**Issues Identified:**

- ❌ Docs in `docs-old/` not in `docs/` (wrong location)
- ❌ Mix of user docs, dev docs, and historical implementation notes
- ❌ No clear audience separation (end user vs GUI developer)
- ❌ Verbose implementation details instead of how-to guides
- ❌ Missing v0.5.0 streaming features (Cancel Job, zero-lag, state management)
- ❌ No clear navigation structure
- ❌ References to old naming conventions (snake_case vs camelCase)

### Proposed GUI Docs Structure

**Target:** `fiberpath_gui/docs/` (will sync to root `docs/gui/` at build)

```
fiberpath_gui/docs/
├── overview.md                 # NEW: What the GUI does, architecture overview
├── development.md              # NEW: Setup, running, building
├── testing.md                  # REVISED: How to write/run tests, coverage goals
├── architecture/
│   ├── tech-stack.md          # NEW: React, Tauri, Zustand, TypeScript, Rust
│   ├── state-management.md    # NEW: Condensed from store-splitting-analysis
│   ├── cli-integration.md     # NEW: Condensed from cli-health-check
│   └── streaming-state.md     # MOVE: From root docs/marlin-streaming-state.md
├── guides/
│   ├── schemas.md             # REVISED: Schema validation, camelCase requirements
│   ├── styling.md             # REVISED: From CSS_ARCHITECTURE.md, condensed
│   └── performance.md         # REVISED: From PERFORMANCE_PROFILING.md, keep practical
└── reference/
    └── type-safety.md         # REVISED: From TYPE_SAFETY_IMPLEMENTATION.md
```

### Revision Principles

1. **Audience Clarity:**

   - `overview.md` → End users wanting to understand the GUI
   - `development.md` → Contributors getting started
   - `architecture/*` → Developers needing system understanding
   - `guides/*` → Developers implementing specific features
   - `reference/*` → Developers looking up implementation details

2. **Conciseness:**

   - Remove verbose implementation narratives
   - Focus on "how" and "why" not "what we did when"
   - Move historical analysis to separate archive if needed
   - Keep practical examples and code snippets

3. **Current Accuracy:**

   - Update all references to v0.5.0
   - Document streaming state management (Cancel Job, zero-lag)
   - Update schema examples to camelCase
   - Reflect current test suite (96 tests, 72% coverage)

4. **Integration with Main Docs:**
   - GUI docs stand alone in their subdirectory
   - Will be synced to `docs/gui/` at build time
   - Main docs link to GUI docs as needed
   - Avoid duplication with main architecture docs

### File-by-File Revision Plan

#### NEW: overview.md

- [ ] Purpose: What the GUI does (plan, plot, simulate, stream)
- [ ] High-level architecture diagram (React → Tauri → CLI)
- [ ] Technology stack summary
- [ ] Link to development.md for contributors
- [ ] Link to main docs for user guides

#### NEW: development.md

- [ ] Prerequisites (Node.js, Rust, Python CLI)
- [ ] Setup commands (npm install, npm run tauri dev)
- [ ] Building (npm run tauri build)
- [ ] Testing (npm test, npm run test:coverage)
- [ ] Linting/formatting (npm run check:all)
- [ ] Project structure overview
- [ ] Link to architecture/ for deep dives

#### REVISED: testing.md

- [ ] How to run tests (commands, watch mode, coverage)
- [ ] Writing new tests (unit, integration, structure)
- [ ] Current coverage stats (96 tests, 72%)
- [ ] Testing patterns (Zustand store, Zod schemas, React components)
- [ ] Remove verbose test file listings (keep summary)

#### NEW: architecture/tech-stack.md

- [ ] React 18 + TypeScript
- [ ] Vite build system
- [ ] Tauri 2.0 (Rust backend)
- [ ] Zustand state management
- [ ] Zod runtime validation
- [ ] Design token system (CSS custom properties)

#### NEW: architecture/state-management.md

- [ ] Condensed from STORE_SPLITTING_ANALYSIS.md
- [ ] Zustand store structure (project, UI, metadata)
- [ ] Shallow selectors and performance
- [ ] When to add new state
- [ ] Remove "should we split" analysis (historical)

#### NEW: architecture/cli-integration.md

- [ ] Condensed from CLI_HEALTH_CHECK.md
- [ ] How GUI invokes CLI (Tauri commands)
- [ ] CLI health monitoring system
- [ ] Error handling and user feedback
- [ ] Remove verbose implementation details

#### NEW: architecture/streaming-state.md

- [ ] Move from root docs/marlin-streaming-state.md
- [ ] Frontend streaming state (connected, streaming, paused)
- [ ] Backend Python streaming (MarlinStreamer)
- [ ] Rust bridge (Tauri commands)
- [ ] Cancel vs Stop workflows
- [ ] Zero-lag progress architecture

#### REVISED: guides/schemas.md

- [ ] Revised from SCHEMA.md
- [ ] Zod schema system overview
- [ ] Wind file validation (camelCase requirements)
- [ ] Tauri response validation
- [ ] How to add new schemas
- [ ] Remove verbose setup history

#### REVISED: guides/styling.md

- [ ] Revised from CSS_ARCHITECTURE.md
- [ ] Design token system (colors, spacing, typography)
- [ ] Modular CSS architecture
- [ ] How to add new components
- [ ] BEM-like naming convention
- [ ] Keep token reference, condense principles

#### REVISED: guides/performance.md

- [ ] Revised from PERFORMANCE_PROFILING.md
- [ ] Keep: How to profile with React DevTools
- [ ] Keep: Common performance issues and fixes
- [ ] Keep: Performance targets
- [ ] Update: Current optimizations (Phase 3+)
- [ ] Remove: Verbose "what we did" narrative

#### REVISED: reference/type-safety.md

- [ ] Revised from TYPE_SAFETY_IMPLEMENTATION.md
- [ ] Zod schema patterns
- [ ] Custom error classes
- [ ] Type inference best practices
- [ ] Runtime validation helpers (validateData, isValidData)
- [ ] Remove: Implementation timeline narrative

### Integration with Main Docs

Once GUI docs are revised:

1. **Sync Script** (`scripts/sync-gui-docs.py`):

   - Copies `fiberpath_gui/docs/**/*.md` → `docs/gui/`
   - Preserves directory structure
   - Runs before every mkdocs build

2. **Main Docs Navigation** (add to `mkdocs.yml`):

   ```yaml
   - GUI:
       - Overview: gui/overview.md
       - Development: gui/development.md
       - Testing: gui/testing.md
       - Architecture:
           - Tech Stack: gui/architecture/tech-stack.md
           - State Management: gui/architecture/state-management.md
           - CLI Integration: gui/architecture/cli-integration.md
           - Streaming State: gui/architecture/streaming-state.md
       - Guides:
           - Schemas: gui/guides/schemas.md
           - Styling: gui/guides/styling.md
           - Performance: gui/guides/performance.md
       - Reference:
           - Type Safety: gui/reference/type-safety.md
   ```

3. **Cross-References:**
   - Main docs link to GUI docs for GUI-specific details
   - GUI docs link to main docs for user guides and API reference
   - Use relative links that work both standalone and synced

### Success Criteria

- [ ] GUI docs exist in `fiberpath_gui/docs/` (not docs-old/)
- [ ] Clear separation: overview, development, architecture, guides, reference
- [ ] All content accurate for v0.5.0
- [ ] Concise, focused on how-to and why
- [ ] No duplication with main docs
- [ ] Sync script successfully copies to docs/gui/
- [ ] mkdocs builds with GUI docs included
- [ ] Navigation makes sense for GUI developers
- [ ] Cross-references between main and GUI docs work

### Implementation Order

1. **Move and clean** (docs-old → docs, rename files)
2. **Create new structure** (overview, development, architecture/_, guides/_, reference/\*)
3. **Revise existing** (condense verbose docs, update for v0.5.0)
4. **Create sync script** (scripts/sync-gui-docs.py)
5. **Update main mkdocs.yml** (add GUI section)
6. **Test build** (verify sync works, links resolve)
7. **Archive old docs** (move docs-old to archive or delete)

**Goal:** Include `fiberpath_gui/docs/` in main documentation build under `docs/gui/` path without duplication.

### Options Evaluated

**1. Symbolic Link**

- Create `docs/gui` → `../fiberpath_gui/docs`
- Pros: No duplication, simple
- Cons: Windows compatibility issues, Git symlink handling

**2. Pre-Build Sync Script**

- Script copies `fiberpath_gui/docs/*.md` to `docs/gui/` before build
- Pros: Works everywhere, simple, no extra dependencies
- Cons: Duplication in build artifacts (not in source)

**3. MkDocs Monorepo Plugin**

- Use `mkdocs-monorepo-plugin` to reference external docs
- Pros: Designed for this use case, clean
- Cons: Additional dependency, configuration complexity

### Recommended Approach: Pre-Build Sync Script

Create `scripts/sync-gui-docs.py`:

```python
#!/usr/bin/env python3
"""Sync GUI docs into main docs before build."""
import shutil
from pathlib import Path

gui_docs = Path("fiberpath_gui/docs")
target = Path("docs/gui")

if target.exists():
    shutil.rmtree(target)
target.mkdir(parents=True)

for md_file in gui_docs.glob("*.md"):
    shutil.copy2(md_file, target / md_file.name)
```

**Integration Points:**

1. Add to `mkdocs.yml` nav under Development section
2. Run in CI before `mkdocs build` (all workflows)
3. Add to `docs/development/contributing.md` as pre-build step
4. Update `.gitignore` to exclude `docs/gui/` (generated)

**Implementation Checklist:**

- [ ] Create `scripts/sync-gui-docs.py`
- [ ] Update `.gitignore` with `docs/gui/`
- [ ] Add nav entry in `mkdocs.yml` under Development
- [ ] Update backend-ci.yml: Add sync step before docs build
- [ ] Update docs-ci.yml: Add sync step before validation
- [ ] Update docs-deploy.yml: Add sync step before deployment
- [ ] Document in `development/contributing.md`
- [ ] Test local build: `python scripts/sync-gui-docs.py && mkdocs build`

**Benefits:**

- GUI docs appear under `/fiberpath/gui/` in deployed site
- No source duplication (only in build artifacts)
- Works on all platforms
- No additional dependencies
- Simple to maintain and understand

---

- [x] v0.5.0 features (Cancel Job, zero-lag) documented
- [x] Developer docs accessible in nav
- [x] mkdocs nav structure updated
- [x] All internal links valid

## Implementation Summary

**Completed:** 2026-01-12

### Files Created (4)

- `docs/getting-started.md` – Installation and first workflow guide
- `docs/guides/axis-mapping.md` – XAB vs XYZ comprehensive guide
- `docs/guides/visualization.md` – Plotting and preview documentation
- `docs/architecture/axis-system.md` – Technical axis mapping deep dive

### Files Updated (6)

- `docs/index.md` – Updated to v0.5.0, new navigation, feature highlights
- `docs/reference/concepts.md` – Removed redundant axis details, pure glossary
- `docs/reference/api.md` – Added axis_format parameter documentation
- `docs/architecture/overview.md` – Added link to axis-system.md
- `docs/guides/marlin-streaming.md` – Fixed version history formatting
- `mkdocs.yml` – Complete nav restructure with 4-tier organization

### Documentation Structure

```
docs/
├── index.md                          ✓ Updated
├── getting-started.md                ✓ New
├── guides/                           ✓ Organized
│   ├── wind-format.md               (existing, moved)
│   ├── axis-mapping.md              ✓ New
│   ├── marlin-streaming.md          ✓ Updated (moved)
│   └── visualization.md              ✓ New
├── reference/                        ✓ Organized
│   ├── concepts.md                   ✓ Updated
│   ├── api.md                        ✓ Updated
│   └── planner-math.md              (existing)
├── architecture/                     ✓ Organized
│   ├── overview.md                   ✓ Updated (renamed)
│   └── axis-system.md                ✓ New
└── development/                      ✓ Organized
    ├── contributing.md              (existing, moved from root)
    ├── tooling.md                   (existing)
    ├── release-process.md           (existing, renamed)
    ├── packaging.md                 (existing)
    └── ci-cd.md                     (existing)
```

### Key Improvements

1. **Clear user journey:** Home → Getting Started → Guides → Reference
2. **Consolidated axis mapping:** Single source of truth with user guide + technical deep dive
3. **v0.5.0 consistency:** All features documented, version references updated
4. **4-tier structure:** User Guides, Reference, Architecture, Development
5. **Complete coverage:** Installation, workflow, streaming, visualization all documented
6. **Cross-references:** Proper links between related documents
7. **Navigation hierarchy:** Logical mkdocs nav with clear sections

---

### Phase 2 Completion Summary

**Date Completed:** 2026-01-12

#### GUI Documentation Created (11 files)

**Main Documentation:**

1. `fiberpath_gui/docs/overview.md` - Purpose, architecture, tech stack overview
2. `fiberpath_gui/docs/development.md` - Setup, running, building, testing workflows
3. `fiberpath_gui/docs/testing.md` - Test stack, running tests, writing patterns

**Architecture Section:** 4. `fiberpath_gui/docs/architecture/tech-stack.md` - React 18, Vite, Tauri 2.0, Zustand, Zod 5. `fiberpath_gui/docs/architecture/state-management.md` - Single Zustand store, selectors, patterns 6. `fiberpath_gui/docs/architecture/cli-integration.md` - Tauri commands, CLI bridge, error handling 7. `fiberpath_gui/docs/architecture/streaming-state.md` - Marlin state, zero-lag, v0.5.0 features

**Guides Section:** 8. `fiberpath_gui/docs/guides/schemas.md` - Zod validation, camelCase requirements, testing 9. `fiberpath_gui/docs/guides/styling.md` - Design tokens, CSS modules, component patterns 10. `fiberpath_gui/docs/guides/performance.md` - React DevTools profiling, optimization

**Reference Section:** 11. `fiberpath_gui/docs/reference/type-safety.md` - TypeScript patterns, discriminated unions

#### Content Accuracy

- ✅ All v0.5.0 references (not v4.0)
- ✅ Cancel Job documented (graceful cancellation vs emergency stop)
- ✅ Zero-lag progress documented (shared state polling, 100ms updates)
- ✅ Single store architecture documented (no splitting analysis)
- ✅ Current versions: React 18.3, Tauri 2.0, Zustand 5.0, Zod 3.25
- ✅ camelCase schemas throughout (windAngle, windType, mandrelParameters)
- ✅ 43 passing schema tests + projectStore tests referenced
- ✅ Code examples from actual implementation

#### Revision Results

- **From:** 8 files, ~1800 lines, verbose implementation narratives
- **To:** 11 files, ~3200 lines, concise how-to guides
- **Audience:** Clear separation (end users, GUI developers, contributors)
- **Structure:** Organized by purpose (overview, architecture, guides, reference)
- **Quality:** Practical examples, troubleshooting sections, best practices

#### Remaining Work

1. Create sync script (`scripts/sync-gui-docs.py`)
2. Update `mkdocs.yml` with GUI section (9 pages)
3. Update `.gitignore` to exclude `docs/gui/` (generated)
4. Update main docs to link to GUI docs
5. Archive or delete `fiberpath_gui/docs-old/`
6. Test: `python scripts/sync-gui-docs.py && mkdocs build --strict`
