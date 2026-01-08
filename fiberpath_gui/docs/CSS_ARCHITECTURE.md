# CSS Architecture Documentation

## Overview

FiberPath GUI uses a modular CSS architecture built on design tokens and organized by concern. This document describes the structure, conventions, and best practices for styling components.

## Architecture Principles

1. **Design Tokens First**: All design decisions (colors, spacing, typography) are centralized in `tokens.css`
2. **Modular Organization**: CSS is split into logical modules (typography, forms, buttons, etc.)
3. **No !important**: Proper specificity management eliminates the need for `!important`
4. **BEM Naming**: Block-Element-Modifier naming convention for clarity
5. **Accessibility**: Focus states, ARIA support, and keyboard navigation styling

## File Structure

```
src/styles/
├── index.css           # Main entry point (imports all modules)
├── tokens.css          # Design system variables
├── reset.css           # Base resets and foundation
├── typography.css      # Text styles and headings
├── buttons.css         # Button variants
├── forms.css           # Inputs and form controls
├── panels.css          # Panels, cards, layers
├── layout.css          # Page layout and grid
├── dialogs.css         # Modal dialogs
└── notifications.css   # Toast notifications
```

## Design Tokens

All design tokens are defined in `tokens.css` as CSS custom properties. Use these variables throughout the application instead of hardcoding values.

### Color Palette

```css
/* Brand Colors */
var(--color-primary)           /* Primary teal: #12a89a */
var(--color-primary-soft)      /* Lighter teal: #75e3d8 */
var(--color-primary-hover)     /* Hover state: #0e8a7e */
var(--color-accent)            /* Gold accent: #d8b534 */

/* Background Colors */
var(--color-bg)                /* Main background: #09090b */
var(--color-bg-panel)          /* Panel background: #141416 */
var(--color-bg-panel-alt)      /* Alternate panel: #1d1d20 */
var(--color-bg-hover)          /* Hover state: #222226 */

/* Text Colors */
var(--color-text)              /* Primary text: #f7f8fa */
var(--color-text-muted)        /* Secondary text: #8f929c */

/* Semantic Colors */
var(--color-success)           /* Success green: #32d2b6 */
var(--color-error)             /* Error red: #ff8a8a */
var(--color-warning)           /* Warning orange: #ffb74d */
var(--color-info)              /* Info blue: #64b5f6 */
```

### Spacing Scale

```css
var(--spacing-xs)      /* 4px */
var(--spacing-sm)      /* 8px */
var(--spacing-md)      /* 12px */
var(--spacing-lg)      /* 16px */
var(--spacing-xl)      /* 24px */
var(--spacing-2xl)     /* 32px */
var(--spacing-3xl)     /* 48px */
```

### Typography

```css
/* Font Sizes */
var(--font-size-xs)       /* 11.2px */
var(--font-size-sm)       /* 12px */
var(--font-size-base)     /* 14px */
var(--font-size-md)       /* 15px */
var(--font-size-lg)       /* 16px */
var(--font-size-xl)       /* 20px */
var(--font-size-2xl)      /* 24px */

/* Font Weights */
var(--font-weight-normal)     /* 400 */
var(--font-weight-medium)     /* 500 */
var(--font-weight-semibold)   /* 600 */
var(--font-weight-bold)       /* 700 */
```

### Borders & Radii

```css
var(--border-radius-sm)    /* 4px */
var(--border-radius-md)    /* 6px */
var(--border-radius-lg)    /* 8px */
var(--border-radius-xl)    /* 12px */
```

### Transitions

```css
var(--transition-fast)     /* 150ms ease */
var(--transition-base)     /* 200ms ease */
var(--transition-slow)     /* 300ms ease */
```

## BEM Naming Convention

FiberPath uses BEM (Block Element Modifier) for CSS class names:

```
.block                  /* Component */
.block__element         /* Part of component */
.block--modifier        /* Variant of component */
.block__element--modifier
```

### Examples

```css
/* Layer Stack Component */
.layer-stack                    /* Block */
.layer-stack__header            /* Element */
.layer-stack__list              /* Element */
.layer-stack__list--dragging    /* Element with modifier */

/* Layer Row Component */
.layer-row                      /* Block */
.layer-row--active              /* Block with modifier */
.layer-row__drag-handle         /* Element */
.layer-row__icon                /* Element */
.layer-row__action-btn          /* Element */
.layer-row__action-btn--danger  /* Element with modifier */
```

## Component Styling Guidelines

### 1. Use Design Tokens

❌ **Bad:**
```css
.button {
  padding: 8px 16px;
  background: #12a89a;
  color: #f7f8fa;
}
```

✅ **Good:**
```css
.button {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-primary);
  color: var(--color-text);
}
```

### 2. Avoid !important

Use proper specificity instead:

❌ **Bad:**
```css
.menubar__dropdown button {
  display: flex !important;
}

.menubar__recent-file {
  flex-direction: column !important;
}
```

✅ **Good:**
```css
/* More specific selector wins naturally */
.menubar__dropdown button {
  display: flex;
}

.menubar__recent-file {
  flex-direction: column;
}
```

### 3. Transition Best Practices

✅ **Good:**
```css
.button {
  background: var(--color-primary);
  transition: var(--transition-colors), var(--transition-transform);
}

.button:hover {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}
```

### 4. Focus States for Accessibility

Always include visible focus states:

✅ **Good:**
```css
button:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}
```

### 5. Hover and Active States

Provide clear visual feedback:

```css
.layer-row {
  transition: var(--transition-colors);
}

.layer-row:hover {
  border-color: var(--color-primary-soft);
  background: var(--color-bg-panel-alt);
}

.layer-row--active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(18, 168, 154, 0.1);
}
```

## Module-Specific Guidelines

### Forms Module (`forms.css`)

- All inputs use consistent height: `var(--input-height)`
- Validation states: `--error`, `--success`
- Focus states with shadow: `box-shadow: 0 0 0 3px rgba(...)`

### Buttons Module (`buttons.css`)

- Variants: `.primary`, `.secondary`, `.danger`, `.ghost`, `.icon-only`
- Always handle `:disabled` state
- Include `:hover` and `:active` transitions

### Panels Module (`panels.css`)

- Consistent padding: `var(--spacing-lg)` or `var(--spacing-xl)`
- Border and shadow for elevation
- Use `--color-bg-panel` for backgrounds

## Responsive Design

Use mobile-first approach with min-width breakpoints:

```css
/* Mobile first (default) */
.panel {
  padding: var(--spacing-lg);
}

/* Tablet and up */
@media (min-width: 640px) {
  .panel {
    padding: var(--spacing-xl);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .panel {
    padding: var(--spacing-2xl);
  }
}
```

## CSS Modules (Component-Scoped)

For truly component-scoped styles, create `.module.css` files:

```tsx
// Component.module.css
.container {
  padding: var(--spacing-lg);
}

// Component.tsx
import styles from './Component.module.css';

function Component() {
  return <div className={styles.container}>...</div>;
}
```

## Linting

Use stylelint to enforce conventions:

```bash
# Check CSS
npm run lint:css

# Auto-fix issues
npm run lint:css:fix
```

### Stylelint Rules

- `declaration-no-important`: Disallow `!important`
- BEM naming patterns enforced
- Vendor prefixes managed by PostCSS
- Import statements must use strings

## Migration Guide

### Updating Existing Styles

1. Replace hardcoded colors with tokens:
   ```css
   /* Before */
   color: #8f929c;
   
   /* After */
   color: var(--color-text-muted);
   ```

2. Replace hardcoded spacing:
   ```css
   /* Before */
   padding: 0.5rem 1rem;
   
   /* After */
   padding: var(--spacing-sm) var(--spacing-lg);
   ```

3. Remove !important and fix specificity:
   ```css
   /* Before */
   .element {
     display: flex !important;
   }
   
   /* After - more specific selector */
   .parent .element {
     display: flex;
   }
   ```

## Best Practices Summary

1. ✅ Always use design tokens from `tokens.css`
2. ✅ Follow BEM naming convention
3. ✅ Never use `!important` (fix specificity instead)
4. ✅ Include focus states for accessibility
5. ✅ Use transitions for smooth interactions
6. ✅ Write mobile-first responsive styles
7. ✅ Run `npm run lint:css` before committing
8. ✅ Document new design tokens when adding them

## Resources

- [BEM Methodology](http://getbem.com/)
- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Stylelint Documentation](https://stylelint.io/)
