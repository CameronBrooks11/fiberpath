# FiberPath Roadmap v6 - XXX

**Focus:** X
**Prerequisites:** X
**Timeline:** X  
**Priority:** X

---

## Phase 2: Documentation

- [ ] Add JSDoc comments to all exported functions and components
- [ ] Document keyboard shortcut system implementation details

## Phase 3: Retroactive changelog

- [ ] **Create CHANGELOG.md retroactively** based on all roadmaps (v1-v4)
  - Document major features from v1 (Core Planning & G-code Generation)
  - Document v2 (CLI Commands, Simulation, API)
  - Document v3 (GUI with Tauri/React, Main Tab Features)
  - Document v4 (Tabbed Interface, Marlin Streaming)
  - Document v5 (Streaming Enhancements, Core Polish)
- [ ] Establish changelog maintenance process for future releases
  - Use semantic versioning convention (## [X.X.X] - YYYY-MM-DD)

---

## Phase 4: Code Organization

- [ ] Extract MenuBar menu definitions to configuration file (currently 310-line component with inline menu structure)
- [ ] Consider flattening: Move StreamTab/StreamTab.tsx to tabs/ (duplication: components/StreamTab/StreamTab.tsx and components/tabs/StreamTab.tsx)
- [ ] Add barrel exports (index.ts) to component subdirectories for cleaner imports
- [ ] Move projectStore from state/ to stores/ for consistency (currently split: stores/ has streamStore/toastStore, state/ has projectStore)

---

## Phase 5: Performance Optimization

- [ ] Add React.memo to pure components (LayerRow, form components)
- [ ] Virtualize LayerStack for large layer counts using react-window
- [ ] Implement lazy loading for dialogs with React.lazy and code splitting
- [ ] Optimize preview image handling (implement caching, cancel pending requests)
- [ ] Profile bundle size and implement tree-shaking optimizations
- [ ] Add performance budget enforcement in CI

**Note:** Comprehensive performance.md documentation exists with memoization patterns, profiling tools, and optimization strategies. Implementation still needed.

---

## Phase 6: Developer Experience

- [ ] Add ESLint with recommended React and TypeScript rules
- [ ] Add Prettier for automatic code formatting
- [ ] Set up pre-commit hooks with lint-staged and husky
- [ ] Create VSCode workspace settings with recommended extensions
- [ ] Add Storybook for isolated component development and documentation
- [ ] Document common development tasks (adding layer types, menu items, commands)
- [ ] Set up debugging configurations for VSCode

---

## Phase 7: Enhanced Validation

- [ ] Review current Tools > Validate Wind Definition implementation and determine how it can be improved to be actually useful to user
- [ ] Create reusable validation hooks for forms (useValidatedInput, useValidatedForm)
- [ ] Implement field-level validation with debouncing for better UX
- [ ] Show validation errors inline in forms instead of console only
- [ ] Add cross-field validation (e.g., pattern number vs mandrel circumference compatibility)
- [ ] Add comprehensive edge case validation (empty projects, extreme values, invalid combinations)

**Note:** Build upon existing JSON Schema validation (37 tests in validation.test.ts). Comprehensive schemas.md documentation exists.

---

## Phase 11: Testing & Release Process

- [ ] Add comprehensive GUI usage section to README with screenshots
- [ ] Add high-quality screenshots to docs/ folder
- [ ] Create video demo showing layer authoring workflow
- [ ] Update CHANGELOG.md with all changes since last release

---

## Phase X: Cross-Platform Testing & Bug Fixes

- [ ] Test on Windows/macOS/Linux
- [ ] Fix platform-specific issues
- [ ] Cross-platform smoke tests (Windows, macOS, Linux) especially keyboard shortcuts
- [ ] Improve validation error messages with specific context (show actual values that caused errors)

## Phase 3: Advanced UX Enhancements

- [ ] Light / dark mode toggle (implement CSS variables and theme switcher)
- [ ] Add panel resize handles for customizable workspace layout (attempted at one point and didnt go well)
- [ ] Add keyboard shortcut customization UI
- [ ] Add workspace layout presets (different panel arrangements)
- [ ] Improve validation error messages with specific context
- [ ] Add undo/redo system (command pattern for state mutations)
- [ ] Add layer presets system (save/load common configurations)

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
