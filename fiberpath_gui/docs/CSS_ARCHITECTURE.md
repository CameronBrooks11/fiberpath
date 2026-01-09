# CSS Architecture Documentation

## Overview

The FiberPath GUI uses a **modular CSS architecture** with a design token system for consistency and maintainability. All styles are organized into logical modules that can be independently maintained and imported in a specific order.

## Architecture Principles

### 1. **Design Tokens First**

All design values (colors, spacing, typography) are defined as CSS custom properties in `tokens.css`. This creates a single source of truth for design decisions.

### 2. **Modular Organization**

CSS is split into focused modules by responsibility:

- **tokens.css** - Design system variables
- **reset.css** - Base resets and foundation
- **typography.css** - Text styles
- **buttons.css** - Button components
- **forms.css** - Form inputs and controls
- **panels.css** - Panels, cards, and containers
- **layout.css** - Page layout and grid
- **dialogs.css** - Modal dialogs
- **notifications.css** - Toast notifications

### 3. **No !important Declarations**

All `!important` declarations have been removed. Specificity is controlled through proper selector structure and cascade order.

### 4. **BEM-like Naming Convention**

Class names follow a BEM-inspired pattern:

```css
.component-name {
  /* Block */
}
.component-name__element {
  /* Element */
}
.component-name--modifier {
  /* Modifier */
}
```

### 5. **Progressive Enhancement**

Styles are loaded in cascade order from general to specific:

1. Tokens → 2. Reset → 3. Typography → 4. Components → 5. Layout → 6. Overlays

## File Structure

```text
src/styles/
├── index.css           # Main entry point (imports all modules)
├── tokens.css          # Design tokens (CSS custom properties)
├── reset.css           # Base resets and app shell
├── typography.css      # Text, headings, links
├── buttons.css         # Button variants
├── forms.css           # Inputs, labels, validation
├── panels.css          # Panels, cards, layer components
├── layout.css          # Page layout, grid, responsive
├── dialogs.css         # Modal dialogs
├── notifications.css   # Toast notifications
└── base.css            # DEPRECATED (kept for compatibility)
```

## Design Token System

### Color Tokens

```css
/* Brand Colors */
--color-primary: #12a89a;
--color-primary-soft: #75e3d8;
--color-primary-hover: #0e8a7e;
--color-accent: #d8b534;

/* Background Colors */
--color-bg: #09090b;
--color-bg-panel: #141416;
--color-bg-panel-alt: #1d1d20;
--color-bg-hover: #222226;

/* Text Colors */
--color-text: #f7f8fa;
--color-text-muted: #8f929c;

/* Semantic Colors */
--color-success: #32d2b6;
--color-error: #ff8a8a;
--color-warning: #ffb74d;
--color-info: #64b5f6;
```

### Spacing Tokens

```css
--spacing-xs: 0.25rem; /* 4px */
--spacing-sm: 0.5rem; /* 8px */
--spacing-md: 0.75rem; /* 12px */
--spacing-lg: 1rem; /* 16px */
--spacing-xl: 1.5rem; /* 24px */
--spacing-2xl: 2rem; /* 32px */
--spacing-3xl: 3rem; /* 48px */
```

### Typography Tokens

```css
/* Font Families */
--font-family-base:
  "Segoe UI", "Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
--font-family-mono: "Cascadia Code", "Consolas", "Monaco", monospace;

/* Font Sizes */
--font-size-xs: 0.7rem; /* 11.2px */
--font-size-sm: 0.75rem; /* 12px */
--font-size-base: 0.875rem; /* 14px */
--font-size-md: 0.9375rem; /* 15px */
--font-size-lg: 1rem; /* 16px */
--font-size-xl: 1.25rem; /* 20px */
--font-size-2xl: 1.5rem; /* 24px */

/* Font Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

## Usage Examples

### Using Design Tokens

✅ **DO:**

```css
.my-component {
  padding: var(--spacing-md);
  color: var(--color-text);
  background: var(--color-bg-panel);
  border-radius: var(--border-radius-md);
}
```

❌ **DON'T:**

```css
.my-component {
  padding: 12px;
  color: #f7f8fa;
  background: #141416;
  border-radius: 6px;
}
```

### BEM Naming

✅ **DO:**

```css
.layer-row {
  /* Block */
}
.layer-row__icon {
  /* Element */
}
.layer-row__content {
  /* Element */
}
.layer-row--active {
  /* Modifier */
}
```

❌ **DON'T:**

```css
.layer-row {
}
.icon {
  /* Too generic */
}
.content {
  /* Too generic */
}
.active {
  /* Too generic */
}
```

### Avoiding !important

✅ **DO:**

```css
/* Use more specific selectors */
.menubar__dropdown button.menubar__recent-file {
  flex-direction: column;
  align-items: flex-start;
}
```

❌ **DON'T:**

```css
.menubar__recent-file {
  flex-direction: column !important;
  align-items: flex-start !important;
}
```

## Responsive Design

Media queries use mobile-first approach:

```css
/* Mobile base styles */
.component {
  padding: var(--spacing-md);
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    padding: var(--spacing-lg);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component {
    padding: var(--spacing-xl);
  }
}
```

## Component-Specific Guidelines

### Buttons

All buttons should use predefined classes:

- `.primary` - Primary actions (CTA)
- `.secondary` - Secondary actions
- `.danger` - Destructive actions
- `.ghost` - Minimal styling
- `.icon-only` - Icon buttons

### Forms

- Use `.param-form__*` classes for parameter forms
- All inputs should have labels
- Error states use `.param-form__input--error`
- Validation messages use `.param-form__error`

### Panels

- Use `.panel` for content sections
- Layer-specific components use `.layer-*` prefix
- Panel headers use `.panel-header`

## Linting

### Run CSS Linter

```bash
npm run lint:css
```

### Auto-fix CSS Issues

```bash
npm run lint:css:fix
```

### Linting Rules

- **No !important** - Enforced (declaration-no-important)
- **Consistent color format** - Hex colors (#rrggbb)
- **Consistent alpha notation** - Numbers (0.5 not 50%)
- **BEM naming** - Recommended but not enforced

## Migration from base.css

The old `base.css` file has been deprecated. All styles have been migrated to modular files.

### Backwards Compatibility

Legacy CSS variable names are aliased in `tokens.css`:

```css
--primary → --color-primary
--text → --color-text
--bg-panel → --color-bg-panel
/* etc. */
```

### Updating Components

When updating components, prefer new variable names:

```css
/* Old */
color: var(--text-muted);

/* New */
color: var(--color-text-muted);
```

## Future Considerations

### CSS Modules (Optional)

For component-scoped styles, consider CSS Modules:

```css
/* ComponentName.module.css */
.container {
  padding: var(--spacing-md);
}
```

```tsx
import styles from "./ComponentName.module.css";

<div className={styles.container}>...</div>;
```

### CSS-in-JS (Not Recommended)

The current architecture does not use CSS-in-JS solutions (styled-components, emotion) to:

- Keep bundle size small
- Maintain clear separation of concerns
- Leverage native CSS features (custom properties, cascade)
- Enable easy theming without JavaScript

## Resources

- [BEM Methodology](http://getbem.com/)
- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Stylelint Documentation](https://stylelint.io/)
- [CSS Architecture Best Practices](https://cssguidelin.es/)

## Maintenance

### Adding New Tokens

1. Add the token to `tokens.css` in the appropriate section
2. Document the token with a comment
3. Use semantic naming (e.g., `--color-error` not `--red`)

### Adding New Components

1. Determine which module the styles belong to
2. Add styles using existing tokens
3. Follow BEM naming convention
4. Avoid magic numbers - use tokens instead
5. Run linter to check for issues

### Refactoring Existing Styles

1. Identify hardcoded values
2. Replace with design tokens
3. Remove !important declarations
4. Ensure proper specificity
5. Test across browsers
6. Run linter to verify compliance
