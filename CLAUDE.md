# claude-project-helpers

React/TypeScript pattern library for forms, providers, components, styling, data fetching, routing, URL state, drawers, and error handling.

## HOW TO USE THIS LIBRARY

1. Read CLAUDE.md (this file) to understand what's available
2. Based on user request, identify the relevant section
3. Read that section's INDEX.md for quick reference
4. Check user's existing code before suggesting templates
5. Provide only what's missing

## PROJECT STRUCTURE

```
claude-project-helpers/
├── setup/                    # Project setup (path aliases, dependencies)
├── utils/                    # Shared utilities used across sections
├── forms/                    # Form patterns (react-hook-form + zod)
├── providers/                # Context/Provider patterns
├── components/               # Component organization patterns
├── styling/                  # Tailwind/CSS patterns
├── data-fetching/            # API + TanStack Query patterns
├── routing/                  # React Router v6 patterns
├── url-state/                # URL params and query string patterns
├── drawers/                  # Modal/drawer patterns with URL sync
└── error-handling/           # Error boundaries and fallbacks
```

## ROUTING TABLE

| User wants...                      | Read                   | Check first                            |
| ---------------------------------- | ---------------------- | -------------------------------------- |
| Project setup, path aliases, deps  | setup/INDEX.md         | Is ~/utils path alias configured?      |
| Form, input, validation            | forms/INDEX.md         | Does FormWrapper/FormProvider exist?   |
| Provider, context, global state    | providers/INDEX.md     | Does a provider for this domain exist? |
| Component organization             | components/INDEX.md    | What's the current structure?          |
| Styling, Tailwind                  | styling/INDEX.md       | Is Tailwind configured?                |
| Data fetching, API, TanStack Query | data-fetching/INDEX.md | Is @tanstack/react-query installed?    |
| Serial loading, dependent queries  | data-fetching/patterns.md | N/A - see Serial Loading Patterns    |
| Routing, routes, navigation        | routing/INDEX.md       | Does router.tsx exist?                 |
| URL params, filters, query string  | url-state/INDEX.md     | Is useUrlParams hook defined?          |
| URL-synced modals, multiple modals | url-state/INDEX.md     | Is useModals hook defined?             |
| Drawers, modals, side panels       | drawers/INDEX.md       | Is useDrawers hook defined?            |
| Merge refs, React 19 refs          | utils/mergeRefs.ts     | Using React 19 ref-as-prop?            |
| Error boundaries, error handling   | error-handling/INDEX.md| Does ErrorBoundary component exist?    |

## SHARED UTILITIES (utils/)

The `utils/` folder contains shared helpers used across multiple sections:

- **classNames.ts** - Class merging utility (clsx + tailwind-merge)
  - `classNames(...inputs)` - Merge Tailwind classes safely with conflict resolution
  - Supports conditional classes, arrays, and object syntax

- **queryString.ts** - Query string utilities using `qs` library
  - `buildQueryString(params)` - Build URL query string with `?` prefix
  - `buildCacheKey(params)` - Build cache key string (no prefix)
  - `appendSort(queryString, sort)` - Append sort parameter

- **mergeRefs.ts** - Merge multiple refs into one (React 19 compatible)
  - `mergeRefs(ref1, ref2, ...)` - Combine refs from different sources
  - Essential for React Hook Form + forwarded refs
  - Works with both callback refs and RefObjects

When copying templates, adjust import paths based on user's project structure (e.g., `~/utils/classNames`).

## CONTEXT-AWARE LOGIC

### Forms

IF user's project has FormProvider/FormWrapper:

- Only provide the specific input component needed
- Skip form setup, just add to existing form

IF user's project has NO form setup:

- Start with FormWrapper.tsx (includes FormProvider + Zod)
- Then add input components as needed

IF adding to existing form:

- Check the Zod schema location, add new field there
- Add input component in the JSX

### Providers

IF provider for this domain already exists:

- Extend existing provider with new state/actions

IF NO provider exists:

- Use BaseProvider.tsx as starting point
- Customize for the domain (Auth, Theme, Modal, etc.)

### Data Fetching

IF user's project has existing API client (api.ts, rest.ts, etc.):

- Follow their patterns, don't replace
- Only add missing hooks (useResource, usePaginatedResource)

IF user's project has NO API setup:

- Start with types.ts, api.ts, cache.ts (foundation)
- Add crud.ts for CRUD operations
- Add useResource.ts and usePaginatedResource.ts for hooks
- Create domain-specific hooks wrapping the base hooks

IF adding new resource type:

- Create domain hook (e.g., useSingleUser.ts) wrapping useResource
- Add any transform logic in the domain hook
- Handle related cache invalidation

### Routing

IF user's project has existing router.tsx:

- Follow their layout patterns
- Add new routes to appropriate domain file
- Check for existing auth guards

IF user's project has NO routing setup:

- Start with router.tsx, LayoutRoot.tsx
- Add LayoutPrivate.tsx for protected routes
- Add LayoutAuth.tsx if auth pages needed
- Create domain route files as needed

IF adding protected routes:

- Ensure LayoutPrivate wraps the routes
- Check useAuth hook implementation
- Follow existing redirect patterns

### URL State

IF user's project has existing URL param handling:

- Follow their patterns (useSearchParams, custom hooks)
- Only add missing utilities

IF user's project has NO URL state setup:

- Start with queryString.ts (parse/stringify utilities)
- Add useUrlParams.ts hook
- Use for filters, pagination, tabs

IF converting React state to URL state:

- Identify state that should be shareable/bookmarkable
- Replace useState with useUrlParams
- Add default values for undefined params

### Drawers

IF user's project has existing drawer/modal system:

- Follow their patterns
- Only add missing features (URL sync, stacking)

IF user's project has NO drawer setup:

- Decide: URL-synced (useDrawers) or local state (useState)
- Add Drawer.tsx for simple side panels
- Add SlideUpDrawer.tsx for bottom sheets

IF adding URL-synced drawers:

- Add useDrawers.ts hook
- Use for primary actions that should be linkable
- Keep data minimal (pass IDs, fetch inside drawer)

### Error Handling

IF user's project has existing ErrorBoundary:

- Follow their patterns and fallback styles
- Extend with additional boundaries as needed

IF user's project has NO error boundary:

- Add ErrorBoundary at root level (fullpage mode)
- Add at layout levels (detailed mode)
- Add around risky components (minimal mode)

IF integrating with error reporting (Sentry, etc.):

- Uncomment Sentry integration in ErrorBoundary
- Add boundaryName to all boundaries for tracking
- Configure onError callback for custom reporting

## TRIGGER PATTERNS

### setup/INDEX.md

Keywords: setup, configure, install, dependencies, path alias, tsconfig, vite config, tailwind setup

### forms/INDEX.md

Keywords: form, input, validation, submit, field, register, useForm, zod, login form, registration, contact form

### providers/INDEX.md

Keywords: provider, context, global state, useContext, auth, theme, modal, toast, share state

### components/INDEX.md

Keywords: component structure, atomic design, atoms, molecules, organisms, where should this go

### styling/INDEX.md

Keywords: tailwind, className, styles, button styles, responsive, clsx, cva

### data-fetching/INDEX.md

Keywords: api, fetch, REST, useQuery, tanstack, cache, CRUD, pagination, data hook, useData, usePagination, API client, serial loading, dependent queries, runQuery, race condition

### routing/INDEX.md

Keywords: router, routes, navigation, react-router, protected routes, auth guard, lazy loading, code splitting, nested layouts, createBrowserRouter

### url-state/INDEX.md

Keywords: url params, query string, useSearchParams, filters, pagination, shareable url, bookmarkable, url state, qs library, useModals, multiple modals, modal stack, compressed URL params

### drawers/INDEX.md

Keywords: drawer, modal, side panel, bottom sheet, slide up, useDrawers, headless ui, dialog, overlay, stacking modals

### error-handling/INDEX.md

Keywords: error boundary, error handling, fallback, crash, catch error, sentry, error reporting, retry, componentDidCatch

## DEPENDENCIES

See `setup/INDEX.md` for full dependency lists per section.
