# Tailwind CSS Patterns Guide

## Quick Reference Rules

1. **Mobile-first** - Start with base styles, add breakpoints for larger screens
2. **Use design tokens** - Stick to Tailwind's scale (spacing, colors, etc.)
3. **Component variants** - Use conditional classes or cva/clsx utilities
4. **Avoid arbitrary values** - Prefer Tailwind's built-in scale
5. **Group related classes** - Organize by category (layout, spacing, typography)

---

## Dependencies

```bash
npm install tailwindcss @tailwindcss/forms clsx
# Optional: class-variance-authority for variant management
npm install class-variance-authority
```

---

## Class Organization

Order classes consistently for readability:

```tsx
className={`
  /* 1. Layout & Position */
  flex items-center justify-between
  absolute top-0 left-0

  /* 2. Sizing */
  w-full h-12 max-w-md

  /* 3. Spacing */
  p-4 px-6 py-2 gap-4
  m-0 mt-4 mb-2

  /* 4. Typography */
  text-sm font-medium text-gray-900

  /* 5. Background & Border */
  bg-white rounded-lg border border-gray-200

  /* 6. Effects */
  shadow-sm ring-1 ring-gray-300

  /* 7. States */
  hover:bg-gray-50 focus:ring-2 focus:ring-blue-500
  disabled:opacity-50 disabled:cursor-not-allowed

  /* 8. Transitions */
  transition-colors duration-150
`}
```

---

## Common Component Patterns

### Button Variants

```tsx
// Base button classes
const buttonBase = `
  inline-flex items-center justify-center
  rounded-md font-medium
  focus:outline-none focus:ring-2 focus:ring-offset-2
  disabled:opacity-50 disabled:cursor-not-allowed
  transition-colors duration-150
`;

// Size variants
const buttonSizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

// Color variants
const buttonVariants = {
  primary: `
    bg-blue-600 text-white
    hover:bg-blue-700
    focus:ring-blue-500
  `,
  secondary: `
    bg-white text-gray-700 border border-gray-300
    hover:bg-gray-50
    focus:ring-blue-500
  `,
  danger: `
    bg-red-600 text-white
    hover:bg-red-700
    focus:ring-red-500
  `,
  ghost: `
    bg-transparent text-gray-700
    hover:bg-gray-100
    focus:ring-gray-500
  `,
};
```

### Input Styles

```tsx
// Base input
const inputBase = `
  block w-full rounded-md border-0 py-1.5 px-3
  text-gray-900 shadow-sm
  ring-1 ring-inset ring-gray-300
  placeholder:text-gray-400
  focus:ring-2 focus:ring-inset focus:ring-blue-600
  sm:text-sm sm:leading-6
`;

// Error state
const inputError = `
  text-red-900 ring-red-300
  placeholder:text-red-300
  focus:ring-red-500
`;

// Disabled state
const inputDisabled = `
  bg-gray-50 text-gray-500 cursor-not-allowed
`;
```

### Card Styles

```tsx
const card = `
  bg-white rounded-lg shadow-sm
  border border-gray-200
  p-6
`;

const cardHoverable = `
  ${card}
  hover:shadow-md hover:border-gray-300
  transition-shadow duration-150
  cursor-pointer
`;
```

### Badge Styles

```tsx
const badgeBase = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

const badgeVariants = {
  gray: "bg-gray-100 text-gray-700",
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  yellow: "bg-yellow-100 text-yellow-700",
  red: "bg-red-100 text-red-700",
};
```

---

## Responsive Design

### Mobile-First Breakpoints

```tsx
// Mobile first - no prefix for mobile
// sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px

className="
  w-full          // Mobile: full width
  sm:w-1/2        // Small: half width
  md:w-1/3        // Medium: third width
  lg:w-1/4        // Large: quarter width
"

className="
  flex-col        // Mobile: stack vertically
  md:flex-row     // Medium+: horizontal
"

className="
  text-sm         // Mobile: small text
  md:text-base    // Medium+: normal text
  lg:text-lg      // Large+: larger text
"
```

### Common Responsive Patterns

```tsx
// Responsive grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

// Responsive spacing
<div className="p-4 md:p-6 lg:p-8">

// Hide/show at breakpoints
<div className="hidden md:block">    // Hidden on mobile
<div className="block md:hidden">    // Visible only on mobile

// Responsive flex direction
<div className="flex flex-col md:flex-row gap-4">
```

---

## State Styling

### Interactive States

```tsx
className="
  // Base
  bg-white text-gray-900

  // Hover
  hover:bg-gray-50

  // Focus
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2

  // Active
  active:bg-gray-100

  // Disabled
  disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
"
```

### Focus Visible (Keyboard Only)

```tsx
// Only show focus ring on keyboard navigation
className="
  focus:outline-none
  focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
"
```

### Group Hover

```tsx
// Child reacts to parent hover
<div className="group">
  <span className="text-gray-500 group-hover:text-blue-600">
    Hover parent to see me change
  </span>
</div>
```

### Peer States

```tsx
// Sibling reacts to another sibling's state
<input className="peer" placeholder="Enter email" />
<p className="hidden peer-invalid:block text-red-500">
  Invalid email
</p>
```

---

## Layout Patterns

### Centered Content

```tsx
// Horizontally centered with max width
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

// Vertically and horizontally centered
<div className="flex min-h-screen items-center justify-center">

// Grid centered
<div className="grid place-items-center min-h-screen">
```

### Sticky Header

```tsx
<header className="sticky top-0 z-50 bg-white border-b border-gray-200">
```

### Sidebar Layout

```tsx
<div className="flex min-h-screen">
  <aside className="w-64 shrink-0 border-r border-gray-200">
    {/* Sidebar */}
  </aside>
  <main className="flex-1 overflow-auto">
    {/* Content */}
  </main>
</div>
```

### Card Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <div key={item.id} className="bg-white rounded-lg shadow p-6">
      {/* Card content */}
    </div>
  ))}
</div>
```

---

## Using clsx for Conditional Classes

```tsx
import clsx from "clsx";

function Button({ variant, size, disabled, className, children }) {
  return (
    <button
      className={clsx(
        // Base classes
        "inline-flex items-center justify-center rounded-md font-medium",
        // Size
        {
          "px-3 py-1.5 text-sm": size === "sm",
          "px-4 py-2 text-sm": size === "md",
          "px-6 py-3 text-base": size === "lg",
        },
        // Variant
        {
          "bg-blue-600 text-white hover:bg-blue-700": variant === "primary",
          "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50": variant === "secondary",
          "bg-red-600 text-white hover:bg-red-700": variant === "danger",
        },
        // Disabled
        disabled && "opacity-50 cursor-not-allowed",
        // Custom classes
        className
      )}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

---

## Using CVA (Class Variance Authority)

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  // Base classes
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
        secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-gray-500",
        danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
      },
      size: {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  className?: string;
}

function Button({ variant, size, className, children }: ButtonProps) {
  return (
    <button className={buttonVariants({ variant, size, className })}>
      {children}
    </button>
  );
}
```

---

## Color Scales Reference

### Gray Scale (for UI elements)

```
gray-50:  #f9fafb  (backgrounds)
gray-100: #f3f4f6  (hover backgrounds)
gray-200: #e5e7eb  (borders)
gray-300: #d1d5db  (input borders)
gray-400: #9ca3af  (placeholder text)
gray-500: #6b7280  (secondary text)
gray-600: #4b5563  (body text)
gray-700: #374151  (headings)
gray-800: #1f2937  (dark headings)
gray-900: #111827  (primary text)
```

### Primary Colors (blue)

```
blue-50:  Light background
blue-100: Badges, highlights
blue-500: Links, icons
blue-600: Primary buttons
blue-700: Button hover
```

### Semantic Colors

```
green-*:  Success states
yellow-*: Warning states
red-*:    Error/danger states
```

---

## See Also

- [Input Components](../forms/input-components.md) - Form styling
- [Atomic Design](../components/atomic-design.md) - Component organization
