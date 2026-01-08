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

**Note:** Created [PERFORMANCE_PROFILING.md](fiberpath_gui/PERFORMANCE_PROFILING.md) guide and [STORE_SPLITTING_ANALYSIS.md](fiberpath_gui/STORE_SPLITTING_ANALYSIS.md) analysis. Store splitting determined unnecessary with current optimizations.

---

## Phase 4: Type Safety & Runtime Validation

- [ ] Add Zod schemas for all Tauri command responses (planWind, simulateProgram, etc.)
- [ ] Add runtime validation for .wind file structure on load (beyond JSON Schema)
- [ ] Create proper typed Error classes (FileError, ValidationError, CommandError)
- [ ] Replace extractError() utility with proper typed error handling
- [ ] Add runtime type guards for layer type narrowing (isHelicalLayer, etc.)

**Progress:** 0/5 tasks complete

---

## Phase 5: Testing Infrastructure

- [ ] Add unit tests for projectStore (all Zustand state mutations)
- [ ] Add unit tests for fileOperations (save/load/export flows)
- [ ] Add unit tests for converters (project ↔ wind definition transformations)
- [ ] Add React Testing Library component tests (LayerStack, layer editors, MenuBar)
- [ ] Add integration tests for complete workflows (New → Add → Save → Load → Export)
- [ ] Set up test coverage reporting (target >70%)
- [ ] Add CI pipeline to run tests on pull requests

**Progress:** 0/7 tasks complete

**Note:** Currently only validation.test.ts exists (37 tests)

---

## Phase 6: Component Documentation & Contracts

- [ ] Add JSDoc comments to all component prop interfaces
- [ ] Document required vs optional props with clear usage examples
- [ ] Add default props where appropriate
- [ ] Create shared prop types for common patterns (onClose, onChange callbacks)
- [ ] Add prop validation for numeric ranges (feed rate 1-10000, angles 0-90)

**Progress:** 0/5 tasks complete

---

## Phase 7: CSS Architecture Refactoring

- [ ] Remove all !important declarations from layout.css (4 instances)
- [ ] Implement CSS Modules for component-scoped styles
- [ ] Create design token system (CSS variables for colors, spacing, typography)
- [ ] Split base.css into logical modules (typography.css, forms.css, buttons.css, panels.css)
- [ ] Add stylelint for CSS linting and consistency
- [ ] Document CSS architecture and naming conventions (BEM or similar)

**Progress:** 0/6 tasks complete

**Note:** Current CSS total: 2000+ lines across 3 files (base.css, layout.css, layers.css)

---

## Phase 8: Complete Incomplete Features

- [ ] Implement real CLI health check (Tauri command to ping Python backend)
- [ ] Implement CLI version detection (read from backend instead of hardcoded)
- [ ] Add health check polling (every 30s, show warning if CLI becomes unavailable)
- [ ] Handle CLI disconnection gracefully (disable file operations, show reconnect dialog)
- [ ] Add CLI startup detection on app launch
- [ ] Document CLI health check protocol in architecture docs

**Progress:** 0/6 tasks complete

**Note:** CLI health currently shows hardcoded "OK" status

---

## Phase 9: Accessibility (a11y) Compliance

- [ ] Add ARIA labels to all buttons, inputs, and interactive elements
- [ ] Add ARIA live regions for status updates and notifications
- [ ] Test full keyboard navigation for all workflows (tab order, enter/escape handling)
- [ ] Implement focus management for dialogs (trap focus, restore on close)
- [ ] Add visible focus indicators for keyboard navigation
- [ ] Test with screen reader (NVDA or JAWS)
- [ ] Ensure color contrast meets WCAG AA standards
- [ ] Add alt text for visualization preview images
- [ ] Support high contrast mode (Windows/macOS)

**Progress:** 0/9 tasks complete

---

## Overall Progress

**Status:** 15/53 tasks complete (28%)

**Success Criteria:**

v3 is complete when:

- ✅ All error scenarios show user-facing notifications
- ✅ No dead code in App.tsx
- ✅ createFileOperations properly memoized
- ✅ All Tauri responses validated with Zod
- ✅ Test coverage >70%
- ✅ All components have JSDoc prop documentation
- ✅ CSS has no !important, uses modules
- ✅ CLI health check shows real status
- ✅ Basic accessibility testing passes (keyboard nav + screen reader)
