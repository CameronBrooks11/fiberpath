# Styling Guide

Complete guide to CSS architecture and styling patterns in FiberPath GUI.

## Overview

FiberPath GUI uses a **design token system** with modular CSS. All styles are centralized in design tokens, and components use CSS modules for scoped styling.

**Key Principles:**

- **Design Tokens:** All colors, spacing, typography defined once
- **Modular CSS:** Component-specific styles in `.module.css` files
- **No CSS-in-JS:** Plain CSS for performance and simplicity
- **No Utility Classes:** Avoid Tailwind-style utilities (semantic class names instead)

## Design Tokens

### Token File (`src/styles/tokens.css`)

All design system variables defined as CSS custom properties:

```css
:root {
  /* Colors */
  --color-primary: #12a89a;
  --color-bg: #09090b;
  --color-text: #f7f8fa;

  /* Spacing */
  --spacing-xs: 0.25rem; /* 4px */
  --spacing-sm: 0.5rem; /* 8px */
  --spacing-md: 0.75rem; /* 12px */
  --spacing-lg: 1rem; /* 16px */

  /* Typography */
  --font-size-base: 0.875rem; /* 14px */
  --font-size-lg: 1rem; /* 16px */

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
}
```

### Token Categories

#### Colors

```css
/* Brand */
--color-primary: #12a89a;
--color-primary-hover: #0e8a7e;

/* Backgrounds */
--color-bg: #09090b;
--color-bg-panel: #141416;
--color-bg-hover: #222226;

/* Borders */
--color-border: #242428;
--color-border-focus: var(--color-primary);

/* Text */
--color-text: #f7f8fa;
--color-text-muted: #8f929c;

/* Semantic */
--color-success: #32d2b6;
--color-error: #ff8a8a;
--color-warning: #ffb74d;
--color-info: #64b5f6;
```

#### Spacing Scale

```css
--spacing-xs: 0.25rem; /* 4px */
--spacing-sm: 0.5rem; /* 8px */
--spacing-md: 0.75rem; /* 12px */
--spacing-lg: 1rem; /* 16px */
--spacing-xl: 1.5rem; /* 24px */
--spacing-2xl: 2rem; /* 32px */
--spacing-3xl: 3rem; /* 48px */
```

**Usage:**

```css
.button {
  padding: var(--spacing-sm) var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}
```

#### Typography

```css
/* Font Families */
--font-family-base: "Segoe UI", "Inter", system-ui, sans-serif;
--font-family-mono: "Cascadia Code", "Consolas", monospace;

/* Font Sizes */
--font-size-xs: 0.7rem; /* 11.2px */
--font-size-sm: 0.75rem; /* 12px */
--font-size-base: 0.875rem; /* 14px */
--font-size-md: 0.9375rem; /* 15px */
--font-size-lg: 1rem; /* 16px */
--font-size-xl: 1.25rem; /* 20px */

/* Font Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

#### Borders & Radii

```css
--border-width-thin: 1px;
--border-width-medium: 2px;

--border-radius-sm: 0.25rem; /* 4px */
--border-radius-md: 0.375rem; /* 6px */
--border-radius-lg: 0.5rem; /* 8px */
--border-radius-xl: 0.75rem; /* 12px */
```

#### Shadows

```css
--shadow-sm: 0 1px 2px rgb(0, 0, 0, 0.3);
--shadow-md: 0 4px 8px rgb(0, 0, 0, 0.4);
--shadow-lg: 0 8px 16px rgb(0, 0, 0, 0.5);
```

#### Transitions

```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;

--transition-colors:
  background-color var(--transition-fast), color var(--transition-fast);
--transition-transform: transform var(--transition-base);
```

## Component Styling

### CSS Modules Pattern

**File Structure:**

```sh
src/
├── components/
│   ├── PlanForm.tsx
│   └── PlanForm.module.css
└── styles/
    ├── tokens.css
    └── App.module.css
```

**Component:**

```typescript
import styles from './PlanForm.module.css';

export function PlanForm() {
  return (
    <div className={styles.container}>
      <button className={styles.submitButton}>
        Generate G-code
      </button>
    </div>
  );
}
```

**CSS Module:**

```css
.container {
  padding: var(--spacing-lg);
  background-color: var(--color-bg-panel);
  border-radius: var(--border-radius-lg);
}

.submitButton {
  padding: var(--spacing-sm) var(--spacing-lg);
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-colors);
}

.submitButton:hover {
  background-color: var(--color-primary-hover);
}
```

**Benefits:**

- Scoped class names (no collisions)
- TypeScript autocomplete for class names
- Tree-shakeable (unused styles removed)

### State Modifiers

```css
.button {
  /* Base styles */
}

.button:hover {
  /* Hover state */
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button.primary {
  /* Primary variant */
}

.button.secondary {
  /* Secondary variant */
}
```

**Usage:**

```typescript
<button className={`${styles.button} ${isPrimary ? styles.primary : styles.secondary}`}>
  Click
</button>
```

### Conditional Classes

```typescript
import clsx from 'clsx'; // Optional utility

function Button({ variant, disabled }: ButtonProps) {
  return (
    <button
      className={clsx(
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        disabled && styles.disabled
      )}
    >
      Click
    </button>
  );
}
```

## Layout Patterns

### Flexbox Layouts

```css
.container {
  display: flex;
  gap: var(--spacing-md);
}

.row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}
```

### Grid Layouts

```css
.formGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

.layerGrid {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--spacing-sm);
  align-items: center;
}
```

### Panel Container

```css
.panel {
  background-color: var(--color-bg-panel);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-xl);
}
```

## Common Component Patterns

### Button Styles

```css
.button {
  padding: var(--spacing-sm) var(--spacing-lg);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: var(--transition-colors);
}

.buttonPrimary {
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.buttonPrimary:hover {
  background-color: var(--color-primary-hover);
}

.buttonSecondary {
  background-color: var(--color-bg-hover);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.buttonDanger {
  background-color: var(--color-error-red);
  color: white;
}

.buttonDanger:hover {
  background-color: var(--color-error-red-hover);
}
```

### Input Styles

```css
.input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  color: var(--color-text);
  font-size: var(--font-size-base);
  font-family: var(--font-family-base);
  transition: var(--transition-colors);
}

.input:focus {
  outline: none;
  border-color: var(--color-border-focus);
}

.input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Card Styles

```css
.card {
  background-color: var(--color-bg-panel);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.cardHeader {
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
}

.cardContent {
  color: var(--color-text-muted);
}
```

## Responsive Design

### Media Queries

```css
.container {
  padding: var(--spacing-lg);
}

@media (min-width: 768px) {
  .container {
    padding: var(--spacing-2xl);
  }
}

@media (min-width: 1024px) {
  .container {
    padding: var(--spacing-3xl);
  }
}
```

### Container Queries (future)

```css
.panel {
  container-type: inline-size;
}

.item {
  font-size: var(--font-size-sm);
}

@container (min-width: 500px) {
  .item {
    font-size: var(--font-size-base);
  }
}
```

## Animations

### Hover Effects

```css
.button {
  transition: var(--transition-colors), var(--transition-transform);
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

### Loading States

```css
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.loading {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Slide In

```css
@keyframes slideIn {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.panel {
  animation: slideIn var(--transition-base);
}
```

## Best Practices

### ✅ Do

- **Use design tokens:** Always use `var(--token-name)` instead of hardcoded values
- **Semantic class names:** `.submitButton` not `.greenBtn`
- **Modular CSS:** One CSS module per component
- **Consistent spacing:** Use spacing scale (xs, sm, md, lg, xl)
- **Accessible colors:** Ensure sufficient contrast ratios

### ❌ Don't

- **Hardcode values:** Don't use `#12a89a` directly, use `var(--color-primary)`
- **Global styles:** Avoid global `.button` classes (use modules)
- **Magic numbers:** Don't use `17.5px`, use tokens or calculate from tokens
- **!important:** Avoid unless absolutely necessary
- **Deep nesting:** Keep specificity low (max 2-3 levels)

## Adding New Tokens

### Step-by-Step

1. **Add to tokens.css:**

   ```css
   :root {
     --color-new-feature: #abcdef;
   }
   ```

2. **Use in component:**

   ```css
   .newFeature {
     background-color: var(--color-new-feature);
   }
   ```

3. **Document usage:**

   ```css
   /* New Feature Colors - Used for XYZ functionality */
   --color-new-feature: #abcdef;
   --color-new-feature-hover: #98bcde;
   ```

## Debugging Styles

### Inspect Element

Right-click element → Inspect → Styles tab shows:

- Computed values for CSS variables
- Applied styles from modules
- Inheritance chain

### CSS Variable Inspection

```javascript
// In browser console
getComputedStyle(document.documentElement).getPropertyValue("--color-primary");
// Returns: "#12a89a"
```

### Module Class Names

In dev mode, class names show source:

```html
<button class="PlanForm_submitButton__abc123"></button>
```

In production, class names are hashed:

```html
<button class="a1b2c3"></button>
```

## Migration from Inline Styles

**Before:**

```typescript
<button style={{ backgroundColor: '#12a89a', padding: '8px 16px' }}>
  Click
</button>
```

**After:**

```typescript
// Button.module.css
.button {
  background-color: var(--color-primary);
  padding: var(--spacing-sm) var(--spacing-lg);
}

// Button.tsx
<button className={styles.button}>Click</button>
```

**Benefits:** Type safety, reusability, performance.

## Next Steps

- [Performance Guide](performance.md) - Optimizing styles for performance
- [Tech Stack Details](../architecture/tech-stack.md) - Vite CSS handling
- [Development Guide](../development.md) - Hot reloading styles
