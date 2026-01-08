# FiberPath Roadmap v5 - Enhancement & Polish

**Focus:** Code quality improvements, developer experience, and UX enhancements  
**Prerequisites:** v3 (Code Quality & Stability) must be complete  
**Timeline:** 2-3 weeks

---

## Phase 1: Documentation

- [ ] Add JSDoc comments to all exported functions and components
- [ ] Document Zustand store architecture and state flow patterns
- [ ] Create architecture diagrams (component hierarchy, data flow)
- [ ] Document keyboard shortcut system implementation details
- [ ] Create CONTRIBUTING.md with code style guidelines, testing requirements, and PR process
- [ ] Add inline comments for complex algorithms (validation, layer conversion)

**Progress:** 0/6 tasks complete

---

## Phase 2: Code Organization

- [ ] Refactor App.tsx into smaller focused components (currently 305 lines)
- [ ] Extract MenuBar menu definitions to configuration file
- [ ] Create feature-based folder structure (features/layers/, features/export/, features/project/)
- [ ] Organize hooks by category (hooks/state/, hooks/commands/, hooks/ui/)

**Progress:** 0/4 tasks complete

**Note:** Consider separating layer components, export dialogs, and project management into focused modules

---

## Phase 3: Performance Optimization

- [ ] Add React.memo to pure components (LayerRow, form components)
- [ ] Virtualize LayerStack for large layer counts using react-window
- [ ] Implement lazy loading for dialogs with React.lazy and code splitting
- [ ] Optimize preview image handling (implement caching, cancel pending requests)
- [ ] Profile bundle size and implement tree-shaking optimizations
- [ ] Add performance budget enforcement in CI

**Progress:** 0/6 tasks complete

---

## Phase 4: Developer Experience

- [ ] Add ESLint with recommended React and TypeScript rules
- [ ] Add Prettier for automatic code formatting
- [ ] Set up pre-commit hooks with lint-staged and husky
- [ ] Create VSCode workspace settings with recommended extensions
- [ ] Add Storybook for isolated component development and documentation
- [ ] Document common development tasks (adding layer types, menu items, commands)
- [ ] Set up debugging configurations for VSCode

**Progress:** 0/7 tasks complete

---

## Phase 5: Enhanced Validation

- [ ] Review current Tools > Validate Wind Definition implementation and determine how it can be improved to be actually useful to user
- [ ] Document validation strategy (client-side vs server-side ownership)
- [ ] Create reusable validation hooks for forms (useValidatedInput, useValidatedForm)
- [ ] Implement field-level validation with debouncing for better UX
- [ ] Show validation errors inline in forms instead of console only
- [ ] Add cross-field validation (e.g., pattern number vs mandrel circumference compatibility)
- [ ] Add comprehensive edge case validation (empty projects, extreme values, invalid combinations)

**Progress:** 0/6 tasks complete

**Note:** Build upon existing JSON Schema validation (37 tests in validation.test.ts)

---

## Phase 6: UX & Polish

- [ ] Light / dark mode toggle (implement CSS variables and theme switcher)
- [ ] Review and revise styling for consistency (margins, fonts, colors - professional appearance)
- [ ] Add panel resize handles for customizable workspace layout
- [ ] Performance test with large layer stacks (50+ layers stress test)
- [ ] Cross-platform smoke tests (Windows, macOS, Linux) especially keyboard shortcuts
- [ ] Improve validation error messages with specific context (show actual values that caused errors)

**Progress:** 0/6 tasks complete

---

## Phase 7: Testing & Release Process

- [ ] Establish versioning and release process (semantic versioning, CHANGELOG, PyPI packaging)
- [ ] Set up automated release builds with GitHub Actions
- [ ] Create download links on docs website from GitHub releases
- [ ] Write example-driven tutorials (docs/tutorials/\*.md) showing complete workflows
- [ ] Add comprehensive GUI usage section to README with screenshots
- [ ] Add high-quality screenshots to docs/ folder
- [ ] Create video demo showing layer authoring workflow
- [ ] Update CHANGELOG.md with all changes since last release
- [ ] Version bump to 0.3.0 after v5 completion

**Progress:** 0/9 tasks complete

---

## Overall Progress

**Status:** 0/44 tasks complete (0%)

---

## Future Enhancements (Post-v5 Backlog)

Ideas for future versions:

- [ ] Undo/Redo system (implement command pattern for all state mutations)
- [ ] Layer presets system (save/load common layer configurations)
- [ ] 3D visualization (Three.js-based mandrel and tow path rendering)
- [ ] Advanced layer strategies UI (variable angle profiles, custom winding patterns)
- [ ] Custom G-code headers/footers configuration (machine-specific setup)
- [ ] Cloud sync and project sharing capabilities
- [ ] Batch processing for multiple .wind files
- [ ] Coverage analysis and visualization
- [ ] Real-time G-code preview in canvas (highlight current position)
- [ ] WebGL-based toolpath rendering for performance
- [ ] Multi-language support (i18n) for international users
