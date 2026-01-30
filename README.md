# Claude Project Helpers

A grab-and-go toolbox of patterns, rules, and code templates for building full-stack TypeScript applications.

## How to Use

When building a new project, reference this folder to get consistent, battle-tested patterns:

1. **Read the documentation** - Each section has an INDEX.md and detailed guides
2. **Copy templates** - Use the `.tsx`/`.ts` template files as starting points
3. **Follow the rules** - Each guide has a "Quick Reference Rules" section at the top

## Structure

```
claude-project-helpers/
├── frontend/                    # React/TypeScript patterns
│   ├── atoms/                   # Atomic design: smallest UI components
│   ├── molecules/               # Atomic design: composed atoms
│   ├── components/              # Forms, tables, tabs, modals
│   ├── hooks/                   # Shared hooks (useDrawers)
│   ├── providers/               # Context/Provider patterns
│   ├── routing/                 # React Router v6 patterns
│   ├── data-fetching/           # TanStack Query patterns
│   ├── url-state/               # URL params management
│   ├── styling/                 # Tailwind CSS patterns
│   ├── error-handling/          # Error boundaries
│   ├── utils/                   # Shared utilities
│   └── setup/                   # Project setup
│
└── backend/                     # Hono.js/TypeScript backend patterns
    ├── api/                     # Routes + OpenAPI
    ├── database/                # PostgreSQL + Drizzle ORM
    ├── auth/                    # better-auth patterns
    ├── services/                # Business logic
    ├── queue/                   # BullMQ background jobs
    ├── middleware/              # Request middleware
    ├── testing/                 # Vitest + Testcontainers
    └── config/                  # Environment configuration
```

---

## Frontend

### [Atomic Design](./frontend/atomic-design.md)
Component organization following atomic design principles.

**Folders:**
- [atoms/](./frontend/atoms/) - Button, ButtonLoading, Link, Image, SkeletonLoader
- [molecules/](./frontend/molecules/) - Drawer, SlideUpDrawer

---

### [Components](./frontend/components/)
Reusable component templates.

**Quick Links:**
- [Forms](./frontend/components/forms/) - React Hook Form + Zod validation
- [Tables](./frontend/components/table/) - Data tables with selection, popovers
- [Tabs](./frontend/components/tabs/) - Tab navigation
- [Modals](./frontend/components/templates/modal/) - Modal, BaseButtonModal, DangerModal

**Form Templates:** `FormWrapper`, `Input`, `Select`, `Checkbox`, `CheckboxGroup`, `Textarea`, `CurrencyInput`, `InputWrapper`, `ErrorMessage`

**Table Templates:** `TableWrapper`, `TableHeader`, `TableRow`, `TableCell`, `TableSelect`, `TableMenuPopover`, `TableDetailsPopover`, `SelectActionBar`

---

### [Providers](./frontend/providers/)
Context/Provider patterns for state management.

**Quick Links:**
- [Context Pattern Guide](./frontend/providers/context-pattern.md) - Full provider patterns
- [BaseProvider.tsx](./frontend/providers/templates/BaseProvider.tsx) - Copy-paste template
- [AuthProvider.tsx](./frontend/providers/templates/AuthProvider.tsx) - Auth example

---

### [Routing](./frontend/routing/)
React Router v6 patterns for navigation and route protection.

**Quick Links:**
- [React Router Patterns Guide](./frontend/routing/react-router-patterns.md) - Full guide
- [Templates](./frontend/routing/templates/) - Copy-paste components

**Templates:** `router.tsx`, `LayoutRoot.tsx`, `LayoutPrivate.tsx`, `LayoutAuth.tsx`, `LayoutProviderWrapped.tsx`, `RedirectPageRoute.tsx`, `example.routes.tsx`

---

### [Data Fetching](./frontend/data-fetching/)
TanStack Query patterns for API integration.

**Quick Links:**
- [Patterns Guide](./frontend/data-fetching/patterns.md) - Serial loading, dependent queries
- [Templates](./frontend/data-fetching/templates/) - API client, hooks

**Templates:** `api.ts`, `types.ts`, `cache.ts`, `crud.ts`, `useResource.ts`, `usePaginatedResource.ts`

---

### [URL State](./frontend/url-state/)
URL parameter management for shareable, bookmarkable app state.

**Quick Links:**
- [URL Params Patterns Guide](./frontend/url-state/url-params-patterns.md) - Full guide
- [Templates](./frontend/url-state/templates/) - Copy-paste hooks

**Templates:** `queryString.ts`, `useUrlParams.ts`, `useModals.ts`

---

### [Drawers](./frontend/drawers/)
Drawer patterns with optional URL synchronization.

**Quick Links:**
- [Drawer Patterns Guide](./frontend/drawers/drawer-patterns.md) - Full guide
- [useDrawers Hook](./frontend/hooks/useDrawers.ts) - URL-synced drawer state
- [Drawer Components](./frontend/molecules/drawer/) - Drawer, SlideUpDrawer

---

### [Styling](./frontend/styling/)
Tailwind CSS patterns and utilities.

**Quick Links:**
- [Tailwind Patterns Guide](./frontend/styling/tailwind-patterns.md) - Common patterns
- [Button Variants](./frontend/styling/templates/buttonVariants.ts) - CVA example

---

### [Error Handling](./frontend/error-handling/)
Error boundaries and fallback UI patterns.

**Quick Links:**
- [Error Boundary Patterns Guide](./frontend/error-handling/error-boundary-patterns.md)
- [Templates](./frontend/error-handling/templates/) - ErrorBoundary, ErrorFallback

---

### [Utilities](./frontend/utils/)
Shared utility functions.

- `classNames.ts` - Tailwind class merging (clsx + tailwind-merge)
- `queryString.ts` - URL query string building
- `mergeRefs.ts` - React ref merging (React 19 compatible)

---

### [Setup](./frontend/setup/)
Project setup guides for path aliases, dependencies, and configuration.

---

## Backend

### [Overview](./backend/CLAUDE.md)
Complete backend guide using Hono.js, Drizzle ORM, BullMQ, and better-auth.

**Tech Stack:**
| Layer | Technology |
|-------|------------|
| Framework | Hono.js + OpenAPI |
| Database | PostgreSQL + Drizzle ORM |
| Queue | BullMQ + Redis |
| Auth | better-auth (sessions + API keys) |
| Testing | Vitest + Testcontainers |

---

### Backend Sections

| Section | Description |
|---------|-------------|
| [Structure](./backend/structure/) | Folder organization patterns |
| [Database](./backend/database/) | Drizzle schemas, queries, migrations |
| [API](./backend/api/) | Hono routes, OpenAPI, handlers |
| [Auth](./backend/auth/) | Sessions, API keys, RBAC |
| [Middleware](./backend/middleware/) | Request middleware patterns |
| [Services](./backend/services/) | Business logic layer |
| [Queue](./backend/queue/) | BullMQ background jobs |
| [Testing](./backend/testing/) | Unit and integration tests |
| [Config](./backend/config/) | Environment configuration |

For comprehensive patterns, see [backend/plan/](./backend/plan/).

---

## Design Principles

1. **Simplicity** - No complexity, just grab and use
2. **Copy-paste ready** - Templates work with minimal changes
3. **Rules-first** - Quick reference at top of each file
4. **Consistent format** - Same structure across all docs
5. **No over-engineering** - Only include what's commonly needed

---

## Common Tasks

| Task | Go To |
|------|-------|
| Build a form | [frontend/components/forms/](./frontend/components/forms/) |
| Add form validation | [frontend/components/forms/zod-validation.md](./frontend/components/forms/zod-validation.md) |
| Create a data table | [frontend/components/table/](./frontend/components/table/) |
| Add tabs | [frontend/components/tabs/](./frontend/components/tabs/) |
| Create a modal | [frontend/components/templates/modal/](./frontend/components/templates/modal/) |
| Set up a provider | [frontend/providers/context-pattern.md](./frontend/providers/context-pattern.md) |
| Organize components | [frontend/atomic-design.md](./frontend/atomic-design.md) |
| Style with Tailwind | [frontend/styling/tailwind-patterns.md](./frontend/styling/tailwind-patterns.md) |
| Set up routing | [frontend/routing/INDEX.md](./frontend/routing/INDEX.md) |
| Add protected routes | [frontend/routing/react-router-patterns.md](./frontend/routing/react-router-patterns.md) |
| Add URL params/filters | [frontend/url-state/INDEX.md](./frontend/url-state/INDEX.md) |
| Add drawers/modals | [frontend/drawers/INDEX.md](./frontend/drawers/INDEX.md) |
| Add error boundaries | [frontend/error-handling/INDEX.md](./frontend/error-handling/INDEX.md) |
| Set up backend API | [backend/CLAUDE.md](./backend/CLAUDE.md) |
| Add database schema | [backend/database/](./backend/database/) |
| Add authentication | [backend/auth/](./backend/auth/) |
| Add background jobs | [backend/queue/](./backend/queue/) |

---

## Dependencies

### Frontend

```bash
# Core
npm install react-hook-form @hookform/resolvers zod tailwindcss clsx

# Routing
npm install react-router-dom

# Data fetching
npm install @tanstack/react-query

# URL state
npm install qs && npm install -D @types/qs

# Drawers/Modals
npm install @headlessui/react motion

# Styling utilities
npm install class-variance-authority tailwind-merge

# Error reporting (optional)
npm install @sentry/react
```

### Backend

```bash
# Core
npm install hono @hono/node-server @hono/zod-openapi zod

# Database
npm install drizzle-orm postgres
npm install -D drizzle-kit

# Queue
npm install bullmq ioredis

# Auth
npm install better-auth

# Dev/Testing
npm install -D typescript tsup vitest @types/node
npm install -D @testcontainers/postgresql
```
