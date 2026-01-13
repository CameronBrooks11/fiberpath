# FiberPath Roadmap v6 - Production Polish & Developer Infrastructure

**Focus:** Essential production-readiness improvements and developer workflow  
**Prerequisites:** v5 (Streaming State & Documentation Overhaul) must be complete  
**Timeline:** 2-3 weeks  
**Priority:** High - foundational improvements for long-term maintainability

**Philosophy:** Focus on practical improvements that directly benefit development velocity and production quality. Defer speculative features to backlog.

---

## Phase 1: Release Management CHANGEOLOG.md

**Goal:** Establish proper release tracking and versioning practices

- [ ] Create CHANGELOG.md retroactively from roadmaps v1-v5
  - v1: Core planning & G-code generation
  - v2: CLI commands, simulation, API
  - v3: GUI with Tauri/React, code quality improvements
  - v4: Tabbed interface, basic Marlin streaming
  - v5: Streaming refinements (zero-lag, cancel job), documentation overhaul
- [ ] Document changelog maintenance process (Keep a Changelog format)
- [ ] Use semantic versioning convention: `## [X.X.X] - YYYY-MM-DD`
- [ ] Add "Unreleased" section at top for ongoing work

**Progress:** 0/4 tasks complete

**Rationale:** CHANGELOG.md is essential for users and maintainers to understand version history. Currently missing despite 5 major versions.

---

## Phase 2: Developer Tooling Setup

**Goal:** Establish code quality automation and consistent formatting

- [ ] Add ESLint configuration with React and TypeScript rules
  - Recommended rules: react-hooks, @typescript-eslint
  - Configure in `.eslintrc.json`
  - Add `npm run lint` script
- [ ] Add Prettier for automatic code formatting
  - Configure in `.prettierrc.json`
  - Add `npm run format` script
  - Set up VSCode settings for format-on-save
- [ ] Set up pre-commit hooks with husky and lint-staged
  - Run ESLint and Prettier on staged files
  - Prevent commits with linting errors
- [ ] Create `.vscode/settings.json` with recommended extensions
  - ESLint, Prettier, TypeScript, Rust Analyzer
  - Configure editor settings (format on save, etc.)
- [ ] Add debugging configurations in `.vscode/launch.json`
  - Debug GUI (Tauri dev)
  - Debug Rust backend
  - Debug tests

**Progress:** 0/5 tasks complete

**Rationale:** Currently no linting or formatting enforcement. This is foundational for team development and code quality. All modern projects need this.

---

## Phase 3: Code Organization Cleanup

**Goal:** Resolve architectural inconsistencies and improve code navigation

- [ ] Extract MenuBar menu definitions to configuration file
  - Current: 310-line component with inline menu structure
  - Create `lib/menuConfig.ts` with typed menu definitions
  - Reduces MenuBar.tsx complexity significantly
- [ ] Consolidate store location inconsistency
  - Move `state/projectStore.ts` to `stores/projectStore.ts`
  - Keeps all Zustand stores in one location (streamStore, toastStore already there)
- [ ] Fix StreamTab component duplication
  - Remove `components/StreamTab/StreamTab.tsx` (duplicate)
  - Keep only `components/tabs/StreamTab.tsx`
  - Move StreamTab components to `components/stream/` subdirectory
- [ ] Add barrel exports to component subdirectories
  - Create `index.ts` in canvas/, dialogs/, editors/, forms/, layers/, panels/
  - Enables cleaner imports: `import { MandrelForm } from '@/components/forms'`

**Progress:** 0/4 tasks complete

**Rationale:** These are known architectural issues identified in v5 review. Small changes with high impact on code maintainability.

---

## Phase 4: Performance Implementation

**Goal:** Implement documented performance optimizations

- [ ] Add React.memo to pure components
  - LayerRow (re-renders for every layer update)
  - Form input components (MandrelForm, TowForm, etc.)
  - StatusBar, StatusText (only update on actual state changes)
- [ ] Implement lazy loading for dialogs
  - Use React.lazy() for AboutDialog, DiagnosticsDialog, ExportConfirmationDialog
  - Reduces initial bundle size
  - Dialogs only loaded when opened
- [ ] Optimize preview image handling
  - Implement image caching (cache last 3 previews)
  - Cancel pending preview requests on new request
  - Prevents memory buildup during rapid plan iterations
- [ ] Profile and optimize bundle size
  - Run `vite-bundle-visualizer` to identify large dependencies
  - Implement tree-shaking for unused imports
  - Target: <2MB initial bundle (currently unknown, needs measurement)
- [ ] Add performance budget to CI
  - Fail build if bundle exceeds size threshold
  - Tracks performance regressions automatically

**Progress:** 0/5 tasks complete

**Rationale:** Performance documentation exists (performance.md with detailed strategies). Time to implement. All tasks have clear ROI.

**Note:** Virtualization of LayerStack deferred - not needed unless users report issues with 50+ layers.

---

## Phase 5: Documentation Completeness

**Goal:** Fill remaining documentation gaps

- [ ] Add JSDoc comments to all exported functions
  - Focus on: commands.ts, validation.ts, converters.ts, marlin-api.ts
  - Document parameters, return types, thrown errors
  - Examples for complex functions
- [ ] Document keyboard shortcut system
  - Create `docs/gui/guides/keyboard-shortcuts.md`
  - List all shortcuts (Ctrl+S, Ctrl+O, Alt+1/2, etc.)
  - Document shortcut registration pattern for future additions
- [ ] Document development tasks guide
  - Create `docs/development/common-tasks.md`
  - How to add a new layer type
  - How to add a menu item
  - How to add a Tauri command
  - Common troubleshooting steps

**Progress:** 0/3 tasks complete

**Rationale:** Documentation is 90% complete. These are the final gaps before considering it comprehensive.

---

## Phase 6: Enhanced Validation UX

**Goal:** Improve user-facing validation feedback (leverage existing backend)

- [ ] Audit current "Tools > Validate" implementation
  - Test with various .wind files (valid, invalid, edge cases)
  - Document current behavior and limitations
  - Determine if useful or needs redesign
- [ ] Show validation errors inline in forms
  - Display errors below input fields (not just console)
  - Use error state styling (red border, error text)
  - Clear errors on input change
- [ ] Implement field-level validation with debouncing
  - Validate mandrel dimensions as user types (300ms debounce)
  - Validate pattern numbers immediately
  - Prevent invalid inputs before submission
- [ ] Add cross-field validation
  - Pattern number compatibility with mandrel circumference
  - Feed rate range validation based on axis format
  - Display validation warnings (not blocking, informational)

**Progress:** 0/4 tasks complete

**Rationale:** JSON Schema validation backend is solid (37 tests, schemas.md docs). UX needs improvement - errors currently only in console.

**Note:** Comprehensive edge case validation deferred to backlog - current schema validation is sufficient.

---

## Phase 7: Cross-Platform Smoke Testing

**Goal:** Verify production-ready across all platforms

- [ ] Create cross-platform testing checklist
  - Document testing procedure for Windows/macOS/Linux
  - Include: installation, file operations, planning, plotting, streaming, keyboard shortcuts
- [ ] Execute smoke tests on Windows
  - Test COM port discovery
  - Test .wind file associations
  - Test keyboard shortcuts (Ctrl+S, Ctrl+O, etc.)
- [ ] Execute smoke tests on macOS
  - Test tty.usbserial port discovery
  - Test .dmg installation
  - Test Cmd+S, Cmd+O shortcuts
- [ ] Execute smoke tests on Linux
  - Test /dev/ttyUSB port discovery
  - Test .deb and .AppImage installation
  - Test Ctrl+S, Ctrl+O shortcuts
- [ ] Document platform-specific issues (if any)
- [ ] Fix critical platform-specific bugs

**Progress:** 0/6 tasks complete

**Rationale:** Currently only tested on Windows (development platform). Need to verify macOS/Linux before claiming production-ready.

---

## Deferred to Backlog

The following items from v6-old have been moved to roadmap-backlog.md:

- **Storybook:** High maintenance overhead, not critical for current team size
- **Dark mode:** Cosmetic feature, no user demand, significant implementation effort
- **Panel resize handles:** Attempted before, didn't work well, low priority
- **Keyboard shortcut customization:** Niche feature, current shortcuts sufficient
- **Workspace layout presets:** Premature optimization, no user demand
- **Undo/redo system:** Complex implementation, unclear benefit, no user demand
- **Layer presets:** Advanced feature, unclear use case, no user demand
- **Advanced layer strategies:** v7 content, requires user demand first
- **Custom G-code configuration:** v7 content, users can edit .gcode manually
- **Accessibility compliance:** Important but can wait until v7, 9 tasks, no blocking issues

---

## Overall Progress

**Status:** 0/31 tasks complete (0%)

**Estimated Effort:**

- Phase 1 (Changelog): 4-6 hours
- Phase 2 (Tooling): 6-8 hours
- Phase 3 (Code Org): 4-6 hours
- Phase 4 (Performance): 8-10 hours
- Phase 5 (Docs): 4-6 hours
- Phase 6 (Validation): 6-8 hours
- Phase 7 (Testing): 4-6 hours

**Total:** 36-50 hours (2-3 weeks at 15-20 hours/week)

---

## Success Criteria

- ✅ CHANGELOG.md exists and documents all versions
- ✅ ESLint and Prettier running in CI, no warnings
- ✅ Code organization consistent (stores in stores/, no duplicates)
- ✅ React DevTools shows <10ms render times for common actions
- ✅ Bundle size <2MB, tracked in CI
- ✅ JSDoc coverage >80% for exported functions
- ✅ Validation errors visible in UI, not just console
- ✅ All platforms tested, critical bugs fixed

---

**Next:** After v6, proceed to v7 (Advanced Features) only if there's user demand for specific features. Otherwise, focus on bug fixes and minor improvements.

---

## Phase 4: Accessibility (a11y) Compliance

- [ ] Add ARIA labels to all buttons, inputs, and interactive elements
- [ ] Add ARIA live regions for status updates and notifications
- [ ] Test full keyboard navigation for all workflows (tab order, enter/escape)
- [ ] Implement focus management for dialogs (trap focus, restore on close)
- [ ] Add visible focus indicators for keyboard navigation
- [ ] Test with screen reader (NVDA or JAWS)
- [ ] Ensure color contrast meets WCAG AA standards
- [ ] Add alt text for visualization preview images
- [ ] Support high contrast mode (Windows/macOS)

---

## Phase 5: Advanced Layer Strategies

- [ ] Design UI for variable angle profiles
- [ ] Implement custom winding pattern editor
- [ ] Add visual pattern preview
- [ ] Add pattern validation
- [ ] Add pattern library/templates
- [ ] Document advanced winding strategies
- [ ] Add examples for common patterns

---

## Phase 6: Custom G-code Configuration

- [ ] Add UI for custom G-code headers (machine-specific setup)
- [ ] Add UI for custom G-code footers (cooldown, home, etc.)
- [ ] Add G-code template system with variables
- [ ] Add preview of generated header/footer
- [ ] Add validation for custom G-code
- [ ] Save header/footer templates
- [ ] Add machine profiles (different machines, different headers)
