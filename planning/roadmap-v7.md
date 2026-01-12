# FiberPath Roadmap v7 - Advanced Features

**Focus:** Nice-to-have features and advanced functionality  
**Prerequisites:** v6 (Streaming Enhancements & Core Polish) must be complete  
**Timeline:** 4-5 weeks  
**Priority:** Medium - implement based on user demand and feedback

---

## Phase 1: Developer Experience Tools

- [ ] Add ESLint with recommended React and TypeScript rules
- [ ] Add Prettier for automatic code formatting
- [ ] Set up pre-commit hooks with lint-staged and husky
- [ ] Create VSCode workspace settings with recommended extensions
- [ ] Add Storybook for isolated component development and documentation
- [ ] Document common development tasks (adding layer types, menu items, commands)
- [ ] Set up debugging configurations for VSCode

**Progress:** 0/7 tasks complete

**Note:** Improves developer workflow but not user-facing. Priority after core features stable.

---

## Phase 2: Enhanced Validation & Error Handling

- [ ] Review current Tools > Validate Wind Definition and improve usefulness
- [ ] Document validation strategy (client-side vs server-side ownership)
- [ ] Create reusable validation hooks (useValidatedInput, useValidatedForm)
- [ ] Implement field-level validation with debouncing for better UX
- [ ] Show validation errors inline in forms instead of console only
- [ ] Add cross-field validation (pattern number vs mandrel circumference compatibility)
- [ ] Add comprehensive edge case validation (empty projects, extreme values)

**Progress:** 0/7 tasks complete

**Note:** Current validation works, this makes it more user-friendly.

---

## Phase 3: Advanced UX Enhancements

- [ ] Light / dark mode toggle (CSS variables and theme switcher)
- [ ] Add panel resize handles for customizable workspace layout
- [ ] Add keyboard shortcut customization UI
- [ ] Add workspace layout presets (different panel arrangements)
- [ ] Improve validation error messages with specific context
- [ ] Add undo/redo system (command pattern for state mutations)
- [ ] Add layer presets system (save/load common configurations)

**Progress:** 0/7 tasks complete

**Note:** Quality-of-life improvements for power users.

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

**Progress:** 0/9 tasks complete

**Note:** Important for professional software, but can come after core features mature.

---

## Phase 5: Advanced Layer Strategies

- [ ] Design UI for variable angle profiles
- [ ] Implement custom winding pattern editor
- [ ] Add visual pattern preview
- [ ] Add pattern validation
- [ ] Add pattern library/templates
- [ ] Document advanced winding strategies
- [ ] Add examples for common patterns

**Progress:** 0/7 tasks complete

**Note:** For advanced users needing complex winding patterns. Evaluate demand first.

---

## Phase 6: Custom G-code Configuration

- [ ] Add UI for custom G-code headers (machine-specific setup)
- [ ] Add UI for custom G-code footers (cooldown, home, etc.)
- [ ] Add G-code template system with variables
- [ ] Add preview of generated header/footer
- [ ] Add validation for custom G-code
- [ ] Save header/footer templates
- [ ] Add machine profiles (different machines, different headers)

**Progress:** 0/7 tasks complete

**Note:** Useful for users with non-standard machine setups. Currently can edit .gcode files manually.

---

## Phase 7: Batch Processing

- [ ] Add batch planning UI (select multiple .wind files)
- [ ] Add batch export UI (multiple files to .gcode)
- [ ] Add batch simulation
- [ ] Add batch validation
- [ ] Add progress tracking for batch operations
- [ ] Add error handling for batch failures
- [ ] Add batch results summary

**Progress:** 0/7 tasks complete

**Note:** Useful for production scenarios with many similar parts. Niche use case.

---

## Phase 8: Cloud Sync & Sharing (Research Phase)

- [ ] Research cloud storage options (user's OneDrive, Dropbox, Google Drive)
- [ ] Design sync architecture (conflict resolution, offline support)
- [ ] Research project sharing mechanisms
- [ ] Evaluate security and privacy concerns
- [ ] Prototype basic sync functionality
- [ ] User testing with cloud sync
- [ ] Document sync architecture decisions

**Progress:** 0/7 tasks complete

**Note:** Nice to have but complex. Requires backend infrastructure or third-party integration. Evaluate if users actually want this.

---

## Overall Progress

**Status:** 0/58 tasks complete (0%)

**Phase Summary:**

- Phase 1: Developer Experience (7 tasks)
- Phase 2: Enhanced Validation (7 tasks)
- Phase 3: Advanced UX (7 tasks)
- Phase 4: Accessibility (9 tasks)
- Phase 5: Advanced Layer Strategies (7 tasks)
- Phase 6: Custom G-code Config (7 tasks)
- Phase 7: Batch Processing (7 tasks)
- Phase 8: Cloud Sync Research (7 tasks)

---

## Implementation Notes

**Priority Guidance:**

- Phases 1-3: Implement after v5 if development continues actively
- Phase 4: Implement if FiberPath targets institutional/educational use
- Phases 5-6: Implement based on user feature requests
- Phases 7-8: Only if clear demand from production users

**User Feedback Driven:**
All v6 features should be evaluated against actual user requests and usage patterns. Don't build what users don't need.

**Last Updated:** 2026-01-09
