# FiberPath Roadmap v5 - Streaming Enhancements & Core Polish

**Focus:** Essential quality-of-life improvements and streaming feature completion  
**Prerequisites:** v4 (Basic Marlin Streaming) must be complete  
**Timeline:** 2-3 weeks  
**Priority:** High - immediate improvements after v4 ships

---

## Phase 1: Streaming Feature Completion

- [ ] Add Settings tab to TabBar (3 tabs: Main, Stream, Settings)
- [ ] Create settingsStore (Zustand) for persistent preferences
- [ ] Create SettingsTab with streaming/general/export sections
- [ ] Add Tauri commands: load_settings, save_settings (JSON in app_data)
- [ ] Add streaming settings (defaultBaudRate, defaultTimeout, verboseLogging)
- [ ] Add general settings (autoSaveInterval, recentFilesLimit)
- [ ] Add export settings (defaultNamingPattern)
- [ ] Add Save Settings and Reset to Defaults buttons
- [ ] Test settings persistence across app restarts
- [ ] Add timestamps to log messages
- [ ] Add log filtering (show all, errors only, commands only, responses only)
- [ ] Add Export Log button (save to .txt file)
- [ ] Add Copy Log button (clipboard API)
- [ ] Add command history to manual control (up/down arrows, last 50 commands)
- [ ] Store command history in streamStore, persist across sessions
- [ ] Create command response parser (extract X/Y/Z coordinates from M114)
- [ ] Display parsed position data in dedicated UI element
- [ ] Add StreamStatistics component (ETA, elapsed time, progress %)
- [ ] Calculate ETA based on average command time
- [ ] Update statistics in real-time during streaming

**Progress:** 0/20 tasks complete

**Note:** Quality-of-life enhancements for streaming. v4 already has essential manual control (command input + common buttons). These add convenience (command history, parsed responses, statistics).

---

## Phase 2: Documentation

- [ ] Add JSDoc comments to all exported functions and components
- [ ] Document Zustand store architecture and state flow patterns
- [ ] Create architecture diagrams (component hierarchy, data flow)
- [ ] Document keyboard shortcut system implementation details
- [ ] Add inline comments for complex algorithms (validation, layer conversion)

**Progress:** 0/5 tasks complete

---

## Phase 2: Code Organization

- [ ] Start this phase by reviewing the current state of the entire GUI directory and modify/add to the following tasks below as needed based on that review.
- [ ] Refactor App.tsx into smaller focused components (currently 305 lines)
- [ ] Extract MenuBar menu definitions to configuration file
- [ ] Create feature-based folder structure (features/layers/, features/export/, features/project/)
- [ ] Organize hooks by category (hooks/state/, hooks/commands/, hooks/ui/)

**Progress:** 0/? tasks complete

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

**Progress:** 0/7 tasks complete

**Note:** Build upon existing JSON Schema validation (37 tests in validation.test.ts)

---

## Phase 6: UX & Polish

- [ ] Light / dark mode toggle (implement CSS variables and theme switcher)
- [ ] Review and revise styling for consistency (margins, fonts, colors - professional appearance)
- [ ] Add panel resize handles for customizable workspace layout
- [ ] Performance test with large layer stacks (50+ layers stress test)
- [ ] Test on Windows/macOS/Linux
- [ ] Fix platform-specific issues
- [ ] Cross-platform smoke tests (Windows, macOS, Linux) especially keyboard shortcuts
- [ ] Improve validation error messages with specific context (show actual values that caused errors)

**Progress:** 0/6 tasks complete

---

## Phase 7: Accessibility (a11y) Compliance

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

**Note:** Accessibility is crucial for professional software. This phase ensures FiberPath is usable by everyone, including users with disabilities.

---

## Phase 9: Advanced Stream Visualization (Optional)

- [ ] Evaluate if 3D streaming visualization adds real value (user feedback)
- [ ] If valuable: Add three.js and @react-three/fiber dependencies
- [ ] Refactor StreamTab to 3-panel layout (controls | log | visualization)
- [ ] Set up Canvas with camera, lights, OrbitControls
- [ ] Add coordinate axes helper and grid
- [ ] Create gcode-parser.ts utility for movement commands
- [ ] Parse G0/G1 commands, handle G90/G91 positioning
- [ ] Create Toolpath component with BufferGeometry
- [ ] Color-code by move type (travel=red, extrude=blue)
- [ ] Add current position marker during streaming
- [ ] Optimize rendering performance (60fps target)
- [ ] Add Show/Hide toggle and Reset Camera button
- [ ] Test with various G-code file sizes

**Progress:** 0/13 tasks complete

**Note:** Only implement if user testing shows demand. Current plot visualization in Main tab may be sufficient.

---

## Phase 10: Testing & Release Process

- [ ] Create download links on docs website from GitHub releases
- [ ] Write example-driven tutorials (docs/tutorials/\*.md) showing complete workflows
- [ ] Add comprehensive GUI usage section to README with screenshots
- [ ] Add high-quality screenshots to docs/ folder
- [ ] Create video demo showing layer authoring workflow
- [ ] Update CHANGELOG.md with all changes since last release
- [ ] Version bump to 0.5.0 after v5 completion

**Progress:** 0/7 tasks complete

---

## Overall Progress

**Status:** 0/42 tasks complete (0%)

**Phase Summary:**

- Phase 1: Streaming Feature Completion (20 tasks)
- Phase 2: Documentation (5 tasks)
- Phase 3: Code Organization (4 tasks)
- Phase 4: Performance Optimization (5 tasks)
- Phase 5: Testing & Release (8 tasks)

**Timeline:** 2-3 weeks after v4 complete

---

## Scope Note

**Moved to v6 (Medium Priority):**

- Developer experience tools (ESLint, Prettier, Storybook)
- Enhanced validation (field-level, cross-field)
- UX enhancements (light/dark mode, panel resize, undo/redo)
- Accessibility improvements (ARIA, screen reader, WCAG)
- Advanced layer strategies UI
- Custom G-code headers/footers
- Batch processing
- Cloud sync research

**Moved to Backlog (Low Priority / Speculative):**

- 3D streaming visualization (32 tasks, unclear value)
- WebGL rendering
- Multi-language support (i18n)
- Coverage analysis visualization
- CAD software plugins
- AI/ML-based optimization

**v5 Focus:** Complete streaming features that users will want immediately, improve code quality, ensure cross-platform stability.

**Last Updated:** 2026-01-09
