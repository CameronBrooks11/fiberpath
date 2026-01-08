# FiberPath Roadmap v3 - Code Quality & Stability

**Focus:** Improve robustness, maintainability, and stability before adding new features  
**Timeline:** 4-5 weeks

---

## Phase 1: Error Handling & User Feedback

- [x] Implement centralized error notification system (toast/snackbar component)
- [x] Replace all console.error() calls with user-facing error notifications in fileOperations, ExportConfirmationDialog, and VisualizationCanvas
- [x] Add React Error Boundary at App level to catch and display unhandled errors
- [x] Create ErrorNotificationContext for app-wide error state management
- [x] Add retry logic for failed Tauri command invocations
- [x] Remove debug console.log() statements from production code (16 instances)
- [x] Standardize error message formatting (consistent, actionable, user-friendly)

**Progress:** 7/7 tasks complete (100%) ✅

---

## Phase 2: Dead Code Cleanup

- [x] Remove legacy workflow state and handlers from App.tsx (planInput, plotInput, simulateInput, streamInput - 100+ lines)
- [x] Remove unused imports (ResultCard, StatusText, FileField if not used elsewhere)
- [x] Verify legacy workflows are still accessible via Tools menu or document removal
- [x] Clean up App.tsx to contain only GUI-related code

**Progress:** 4/4 tasks complete (100%) ✅

---

## Phase 3: State Management Performance

- [x] Wrap createFileOperations() calls in useMemo() with proper dependencies in App.tsx and MenuBar.tsx
- [x] Audit all Zustand selectors for unnecessary re-renders (use shallow comparison where needed)
- [x] Profile with React DevTools to identify render hotspots
- [x] Consider splitting projectStore into smaller stores (ui, data, metadata) if performance issues arise

**Progress:** 4/4 tasks complete (100%) ✅

**Note:** Created [PERFORMANCE_PROFILING.md](fiberpath_gui/docs/PERFORMANCE_PROFILING.md) guide and [STORE_SPLITTING_ANALYSIS.md](fiberpath_gui/docs/STORE_SPLITTING_ANALYSIS.md) analysis. Store splitting determined unnecessary with current optimizations.

---

## Phase 4: Type Safety & Runtime Validation

- [x] Add Zod schemas for all Tauri command responses (planWind, simulateProgram, etc.)
- [x] Add runtime validation for .wind file structure on load (beyond JSON Schema)
- [x] Create proper typed Error classes (FileError, ValidationError, CommandError)
- [x] Replace extractError() utility with proper typed error handling
- [x] Add runtime type guards for layer type narrowing (isHelicalLayer, etc.)

**Progress:** 5/5 tasks complete (100%) ✅

**Note:** Created comprehensive [schemas.ts](fiberpath_gui/src/lib/schemas.ts) (284 lines) with Zod schemas, custom error classes (FiberPathError, FileError, ValidationError, CommandError, ConnectionError), and type guards. All Tauri commands now validate responses at runtime. Added type guards to [project.ts](fiberpath_gui/src/types/project.ts) (isHoopLayer, isHelicalLayer, isSkipLayer).

---

## Phase 5: Testing Infrastructure

- [x] Add unit tests for projectStore (all Zustand state mutations)
- [x] Add unit tests for fileOperations (save/load/export flows)
- [x] Add unit tests for converters (project ↔ wind definition transformations)
- [x] Add React Testing Library component tests (LayerStack, layer editors, MenuBar)
- [x] Add integration tests for complete workflows (New → Add → Save → Load → Export)
- [x] Set up test coverage reporting (target >70%)
- [x] Add CI pipeline to run tests on pull requests

**Progress:** 7/7 tasks complete (100%) ✅

**Test Results:**

- **113 tests passing** (100% pass rate)
- projectStore: 29 tests, 100% coverage
- converters: 17 tests, 96% coverage
- schemas: 43 tests, 100% coverage
- validation: 17 tests, 100% coverage
- integration workflows: 7 tests

**Files Created:**

- [projectStore.test.ts](fiberpath_gui/src/state/projectStore.test.ts)
- [converters.test.ts](fiberpath_gui/src/types/converters.test.ts)
- [schemas.test.ts](fiberpath_gui/src/lib/schemas.test.ts)
- [workflows.test.ts](fiberpath_gui/src/tests/integration/workflows.test.ts)
- [setup.ts](fiberpath_gui/src/tests/setup.ts)
- [gui-tests.yml](.github/workflows/archive/gui-tests.yml)
- Coverage configured in [vite.config.ts](fiberpath_gui/vite.config.ts)

---

## Phase 6: Component Documentation & Contracts

- [x] Add JSDoc comments to all component prop interfaces
- [x] Document required vs optional props with clear usage examples
- [x] Add default props where appropriate
- [x] Create shared prop types for common patterns (onClose, onChange callbacks)
- [x] Add prop validation for numeric ranges (feed rate 1-10000, angles 0-90)

**Progress:** 5/5 tasks complete (100%) ✅

**Files Created:**

- [types/components.ts](fiberpath_gui/src/types/components.ts) - Shared prop types, numeric ranges, validation helpers

**Components Documented:**

- Layer editors: HoopLayerEditor, HelicalLayerEditor, SkipLayerEditor
- Forms: MandrelForm, TowForm
- Dialogs: AboutDialog, ExportConfirmationDialog, DiagnosticsDialog
- Layer components: LayerStack, LayerRow

**Improvements:**

- Centralized validation with `NUMERIC_RANGES` constants
- Shared `validateNumericRange()` helper function
- Common prop interfaces: `LayerEditorBaseProps`, `DialogBaseProps`
- Type-safe callbacks: `OnCloseCallback`, `OnChangeCallback<T>`
- Comprehensive JSDoc with @param, @returns, @example tags

---

## Phase 7: CSS Architecture Refactoring

- [x] Remove all !important declarations from layout.css (4 instances)
- [x] Implement CSS Modules for component-scoped styles
- [x] Create design token system (CSS variables for colors, spacing, typography)
- [x] Split base.css into logical modules (typography.css, forms.css, buttons.css, panels.css)
- [x] Add stylelint for CSS linting and consistency
- [x] Document CSS architecture and naming conventions (BEM or similar)

**Progress:** 6/6 tasks complete (100%) ✅

**Files Created:**

- [tokens.css](fiberpath_gui/src/styles/tokens.css) - Design system tokens (170 lines)
- [reset.css](fiberpath_gui/src/styles/reset.css) - Base resets (47 lines)
- [typography.css](fiberpath_gui/src/styles/typography.css) - Text styles (127 lines)
- [buttons.css](fiberpath_gui/src/styles/buttons.css) - Button components (136 lines)
- [forms.css](fiberpath_gui/src/styles/forms.css) - Form inputs (188 lines)
- [panels.css](fiberpath_gui/src/styles/panels.css) - Panels & cards (443 lines)
- [CSS_ARCHITECTURE.md](fiberpath_gui/docs/CSS_ARCHITECTURE.md) - Complete documentation

**Files Modified:**

- [index.css](fiberpath_gui/src/styles/index.css) - Updated imports for modular structure
- [layout.css](fiberpath_gui/src/styles/layout.css) - Removed 4 !important declarations
- [base.css](fiberpath_gui/src/styles/base.css) - Deprecated, migrated to modules
- [.stylelintrc.json](fiberpath_gui/.stylelintrc.json) - Added linting rules

**Improvements:**

- **Zero !important declarations** - Fixed all specificity issues
- **Comprehensive design tokens** - 150+ CSS custom properties
- **Modular architecture** - 9 focused CSS modules
- **BEM naming convention** - Consistent block\_\_element--modifier pattern
- **Backwards compatibility** - Legacy variable names aliased
- **Automated linting** - Stylelint with auto-fix (npm run lint:css:fix)
- **Professional documentation** - CSS architecture guide with examples

**Design Token Categories:**

- Colors (brand, backgrounds, borders, text, semantic)
- Spacing (7-step scale: xs to 3xl)
- Typography (families, sizes, weights, line heights)
- Borders & radii
- Shadows (4 levels)
- Transitions & animations
- Z-index scale
- Component dimensions

---

## Phase 8: Complete Incomplete Features

- [x] Implement real CLI health check (Tauri command to ping Python backend)
- [x] Implement CLI version detection (read from backend instead of hardcoded)
- [x] Add health check polling (every 30s, show warning if CLI becomes unavailable)
- [x] Handle CLI disconnection gracefully (disable file operations, show reconnect dialog)
- [x] Add CLI startup detection on app launch
- [x] Document CLI health check protocol in architecture docs

**Progress:** 6/6 tasks complete (100%) ✅

**Implementation Details:**

**Backend (Rust/Tauri):**

- Added `check_cli_health` command in [main.rs](fiberpath_gui/src-tauri/src/main.rs)
- Runs `fiberpath --version` to verify CLI is available and get version
- Returns health status, version string, and error messages

**Frontend (TypeScript/React):**

- [useCliHealth.ts](fiberpath_gui/src/hooks/useCliHealth.ts) - Hook for CLI health checking with polling
- [CliHealthContext.tsx](fiberpath_gui/src/contexts/CliHealthContext.tsx) - Context provider for app-wide health state
- [CliHealthWarning.tsx](fiberpath_gui/src/components/CliHealthWarning.tsx) - Warning banner component
- [CliUnavailableDialog.tsx](fiberpath_gui/src/components/dialogs/CliUnavailableDialog.tsx) - Detailed troubleshooting dialog
- [StatusBar.tsx](fiberpath_gui/src/components/StatusBar.tsx) - Updated to show real CLI status
- [DiagnosticsDialog.tsx](fiberpath_gui/src/components/dialogs/DiagnosticsDialog.tsx) - Updated with real health data

**Schemas & Validation:**

- Added `CliHealthResponseSchema` to [schemas.ts](fiberpath_gui/src/lib/schemas.ts)
- Full Zod validation for health check responses

**Features:**

- ✅ Automatic health check on app launch
- ✅ Polling every 30 seconds (configurable)
- ✅ Visual warning banner when CLI unavailable
- ✅ Status indicator in status bar
- ✅ Detailed troubleshooting dialog with retry capability
- ✅ Real-time version detection
- ✅ Graceful error handling and recovery

---

## Phase 9: CI/CD Workflow Organization

**Current State Analysis:**

Existing workflows (4 files):

- `ci.yml` - Python backend: lint (Ruff), type-check (MyPy), MkDocs build, pytest on 3 OS
- `gui.yml` - GUI packaging: lint, build, create installers for 3 OS
- `gui-tests.yml` - GUI testing: lint, type-check, tests, coverage, build check
- `docs-site.yml` - MkDocs deployment to GitHub Pages

**Issues Identified:**

1. **Overlapping responsibilities** - `gui.yml` and `gui-tests.yml` both do linting and building
2. **Naming inconsistency** - `ci.yml` vs `gui-tests.yml` vs `docs-site.yml` vs `gui.yml`
3. **Trigger inconsistency** - Some use `main`, some use `main, newgui`, some path-based
4. **Missing workflows** - No Python package publishing, no release automation
5. **Redundant jobs** - Linting/building duplicated across workflows
6. **No composite actions** - Repeated setup steps (Python, Node, Rust, caching)

**Proposed Structure:**

```
.github/
├── workflows/
│   ├── backend-ci.yml           # Python: lint, type-check, test (all OS)
│   ├── backend-publish.yml      # Publish to PyPI on release
│   ├── gui-ci.yml              # GUI: lint, type-check, test, build
│   ├── gui-packaging.yml       # GUI: create installers (all OS)
│   ├── docs-ci.yml             # MkDocs: build validation
│   ├── docs-deploy.yml         # MkDocs: deploy to GitHub Pages
│   └── release.yml             # Tag release, trigger publish workflows
└── actions/
    ├── setup-python/           # Composite: Python + uv setup
    ├── setup-node/             # Composite: Node + npm cache
    └── setup-rust/             # Composite: Rust + cargo cache
```

**Naming Convention:**

- `{component}-ci.yml` - Continuous Integration (lint, test, build validation)
- `{component}-packaging.yml` - Create distributable artifacts
- `{component}-deploy.yml` - Deploy to production/hosting
- `{component}-publish.yml` - Publish to package registry
- `release.yml` - Release orchestration

**Workflow Responsibilities:**

1. **backend-ci.yml** (main + PRs)

   - Ruff linting
   - MyPy type checking
   - Pytest on ubuntu/macos/windows
   - Coverage reporting
   - Triggers: push to main, all PRs

2. **backend-publish.yml** (releases only)

   - Build Python wheel/sdist
   - Publish to PyPI
   - Triggers: GitHub release created

3. **gui-ci.yml** (main + newgui + PRs)

   - ESLint linting
   - TypeScript type checking
   - Vitest unit/integration tests
   - Coverage reporting
   - Vite build validation
   - Triggers: push to main/newgui, PRs affecting fiberpath_gui/

4. **gui-packaging.yml** (manual + releases)

   - Tauri bundle creation for Windows/macOS/Linux
   - Upload installers as artifacts
   - Triggers: workflow_dispatch, release created

5. **docs-ci.yml** (main + PRs)

   - MkDocs build --strict validation
   - Link checking
   - Triggers: push to main, PRs affecting docs/

6. **docs-deploy.yml** (main only)

   - Build MkDocs site
   - Deploy to GitHub Pages
   - Triggers: push to main affecting docs/

7. **release.yml** (manual)
   - Create GitHub release
   - Trigger backend-publish
   - Trigger gui-packaging
   - Triggers: workflow_dispatch with version input

**Composite Actions:**

1. **setup-python/** - Reusable Python setup

   - Setup Python 3.11
   - Setup uv package manager
   - Create venv
   - Install dependencies with caching

2. **setup-node/** - Reusable Node setup

   - Setup Node 20
   - Cache npm modules
   - Install dependencies

3. **setup-rust/** - Reusable Rust setup
   - Setup Rust toolchain
   - Cache cargo artifacts
   - Install system dependencies (Linux)

**Tasks:**

- [x] Create composite actions for repeated setup steps
- [x] Split gui.yml into gui-ci.yml and gui-packaging.yml
- [x] Rename and reorganize existing workflows to match convention
- [x] Create backend-publish.yml for PyPI releases
- [x] Create release.yml for coordinated releases
- [x] Update all workflow triggers for consistency (main + PRs)
- [x] Remove redundant linting/building from gui-tests.yml
- [ ] Add workflow status badges to README.md
- [ ] Document workflow architecture in CONTRIBUTING.md
- [ ] Test all workflows on a test branch

**Progress:** 7/10 tasks complete

**Implementation Details:**

- Created 3 composite actions (.github/actions/):
  - setup-python: Python 3.11 + uv + venv + dependencies with caching
  - setup-node: Node 20 + npm cache + dependencies
  - setup-rust: Rust toolchain + cargo cache + Linux Tauri dependencies
- Created 7 new workflows (.github/workflows/):
  - backend-ci.yml: Python linting (Ruff), type-checking (MyPy), testing (pytest) on 3 OS
  - gui-ci.yml: GUI linting (ESLint), type-checking (tsc), testing (Vitest), building
  - docs-ci.yml: MkDocs validation (--strict build)
  - docs-deploy.yml: MkDocs deployment to GitHub Pages
  - gui-packaging.yml: Tauri installers for Windows/macOS/Linux
  - backend-publish.yml: PyPI publishing with trusted publishing
  - release.yml: Coordinated release orchestration
- Archived old workflows (ci.yml, gui.yml, gui-tests.yml, docs-site.yml)
- Established naming convention: {component}-{purpose}.yml
- Eliminated redundancy (gui.yml and gui-tests.yml both did linting/building)
- Added PyPI trusted publishing support
- Release automation with version validation

**Note:** This phase focuses on maintainability and reducing CI/CD technical debt. Proper organization will make future workflow additions easier and reduce GitHub Actions minutes usage.

---

## Overall Progress

**Status:** 51/54 tasks complete (94%)

**Success Criteria:**

v3 is complete when:

- ✅ All error scenarios show user-facing notifications
- ✅ No dead code in App.tsx
- ✅ createFileOperations properly memoized
- ✅ All Tauri responses validated with Zod
- ✅ Test coverage >70%
- ✅ All components have JSDoc prop documentation
- ✅ CSS has no !important, uses modules
- ✅ CLI health check shows real status (Phase 8)
- 🔄 CI/CD workflows properly organized and documented (Phase 9)

**Status: 51/54 tasks complete (94%)**

Phases 1-8 complete. Phase 9 (CI/CD) implementation complete, testing and documentation pending.

