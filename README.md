# Claude Project Helpers

A grab-and-go toolbox of rules, patterns, and code templates for building React/TypeScript projects.

## How to Use

When building a new project, reference this folder to get consistent, battle-tested patterns:

1. **Read the documentation** - Each section has a README and detailed guides
2. **Copy templates** - Use the `.tsx` template files as starting points
3. **Follow the rules** - Each guide has a "Quick Reference Rules" section at the top

## Sections

### [Forms](./forms/)
React Hook Form + Zod validation patterns and input component templates.

**Quick Links:**
- [React Hook Form Guide](./forms/react-hook-form.md) - Form setup, field registration
- [Zod Validation](./forms/zod-validation.md) - Schema patterns and recipes
- [Input Components](./forms/input-components.md) - Component documentation
- [Templates](./forms/templates/) - Copy-paste ready components

**Templates:** `FormWrapper`, `Input`, `Select`, `Checkbox`, `CheckboxGroup`, `Textarea`, `CurrencyInput`, `InputWrapper`, `ErrorMessage`

---

### [Providers](./providers/)
Context/Provider patterns for state management.

**Quick Links:**
- [Context Pattern Guide](./providers/context-pattern.md) - Full provider patterns
- [BaseProvider.tsx](./providers/templates/BaseProvider.tsx) - Copy-paste template

**Key Patterns:** Context + Hook, useReducer, Provider Composition

---

### [Components](./components/)
Atomic design patterns for component organization.

**Quick Links:**
- [Atomic Design Guide](./components/atomic-design.md) - Full guide with examples

**Levels:** Atoms → Molecules → Organisms → Templates → Pages

---

### [Styling](./styling/)
Tailwind CSS patterns and utilities.

**Quick Links:**
- [Tailwind Patterns Guide](./styling/tailwind-patterns.md) - Common patterns, variants

**Key Topics:** Button variants, Input styles, Responsive design, State classes, clsx/cva

---

### [Routing](./routing/)
React Router v6 patterns for navigation and route protection.

**Quick Links:**
- [React Router Patterns Guide](./routing/react-router-patterns.md) - Full guide with examples
- [Templates](./routing/templates/) - Copy-paste ready components

**Templates:** `router.tsx`, `LayoutRoot.tsx`, `LayoutPrivate.tsx`, `LayoutAuth.tsx`, `example.routes.tsx`

**Key Patterns:** Protected routes, Auth guards, Lazy loading, Nested layouts, Domain route files

---

### [URL State](./url-state/)
URL parameter management for shareable, bookmarkable app state.

**Quick Links:**
- [URL Params Patterns Guide](./url-state/url-params-patterns.md) - Full guide with examples
- [Templates](./url-state/templates/) - Copy-paste ready hooks

**Templates:** `queryString.ts`, `useUrlParams.ts`

**Key Patterns:** Query string parsing, URL-synced filters, Pagination, Tab selection

---

### [Drawers](./drawers/)
Modal and drawer patterns with optional URL synchronization.

**Quick Links:**
- [Drawer Patterns Guide](./drawers/drawer-patterns.md) - Full guide with examples
- [Templates](./drawers/templates/) - Copy-paste ready components

**Templates:** `useDrawers.ts`, `SlideUpDrawer.tsx`, `Drawer.tsx`

**Key Patterns:** URL-synced drawers, Stacking modals, Bottom sheets, Side panels

---

### [Error Handling](./error-handling/)
Error boundaries and fallback UI patterns.

**Quick Links:**
- [Error Boundary Patterns Guide](./error-handling/error-boundary-patterns.md) - Full guide with examples
- [Templates](./error-handling/templates/) - Copy-paste ready components

**Templates:** `ErrorBoundary.tsx`, `ErrorFallback.tsx`, `types.ts`

**Key Patterns:** Boundary placement, Fallback modes, Error reporting, Retry mechanisms

---

## Design Principles

1. **Simplicity** - No complexity, just grab and use
2. **Copy-paste ready** - Templates work with minimal changes
3. **Rules-first** - Quick reference at top of each file
4. **Consistent format** - Same structure across all docs
5. **No over-engineering** - Only include what's commonly needed

## Common Tasks

| Task | Go To |
|------|-------|
| Build a form | [forms/README.md](./forms/README.md) |
| Add form validation | [forms/zod-validation.md](./forms/zod-validation.md) |
| Create an input component | [forms/input-components.md](./forms/input-components.md) |
| Set up a provider | [providers/context-pattern.md](./providers/context-pattern.md) |
| Organize components | [components/atomic-design.md](./components/atomic-design.md) |
| Style with Tailwind | [styling/tailwind-patterns.md](./styling/tailwind-patterns.md) |
| Set up routing | [routing/INDEX.md](./routing/INDEX.md) |
| Add protected routes | [routing/react-router-patterns.md](./routing/react-router-patterns.md) |
| Add URL params/filters | [url-state/INDEX.md](./url-state/INDEX.md) |
| Add drawers/modals | [drawers/INDEX.md](./drawers/INDEX.md) |
| Add error boundaries | [error-handling/INDEX.md](./error-handling/INDEX.md) |

## Dependencies

Most templates assume these packages are installed:

```bash
npm install react-hook-form @hookform/resolvers zod tailwindcss clsx
```

For routing:
```bash
npm install react-router-dom
```

For URL state:
```bash
npm install qs
npm install -D @types/qs
```

For drawers:
```bash
npm install @headlessui/react motion
```

For error reporting (optional):
```bash
npm install @sentry/react
```

Optional for variant management:
```bash
npm install class-variance-authority
```
