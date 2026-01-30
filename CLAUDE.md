# claude-project-helpers

Full-stack TypeScript pattern library for React frontend and Hono.js backend development.

## HOW TO USE THIS LIBRARY

1. Read CLAUDE.md (this file) to understand what's available
2. Based on user request, identify the relevant section (frontend/ or backend/)
3. Read that section's INDEX.md for quick reference
4. Check user's existing code before suggesting templates
5. Provide only what's missing

## PROJECT STRUCTURE

```
claude-project-helpers/
├── frontend/                       # React/TypeScript patterns
│   ├── setup/                      # Project setup (path aliases, dependencies)
│   ├── utils/                      # Shared utilities (classNames, mergeRefs, queryString)
│   ├── atoms/                      # Atomic design: smallest UI components
│   │   ├── buttons/                # Button, ButtonBase, ButtonLoading
│   │   ├── Link/                   # Internal/external link handling
│   │   ├── Image/                  # Image component with loading
│   │   └── SkeletonLoader/         # Loading skeleton
│   ├── molecules/                  # Atomic design: composed atoms
│   │   └── drawer/                 # Drawer, SlideUpDrawer
│   ├── hooks/                      # Shared hooks (useDrawers)
│   ├── components/                 # Component patterns & templates
│   │   ├── forms/                  # Form inputs (react-hook-form + zod)
│   │   ├── table/                  # Data table components
│   │   ├── tabs/                   # Tab components
│   │   └── templates/modal/        # Modal components
│   ├── providers/                  # Context/Provider patterns
│   ├── styling/                    # Tailwind/CSS patterns
│   ├── data-fetching/              # API + TanStack Query patterns
│   ├── routing/                    # React Router v6 patterns
│   ├── url-state/                  # URL params and query string patterns
│   ├── drawers/                    # Drawer patterns documentation
│   ├── error-handling/             # Error boundaries and fallbacks
│   ├── stripe/                     # Stripe payments, subscriptions, Connect
│   └── tracking/                   # Analytics & tracking (PostHog)
│
└── backend/                        # Hono.js/TypeScript backend patterns
    ├── plan/                       # Comprehensive architecture docs
    ├── structure/                  # Folder organization patterns
    ├── api/                        # Hono routes + OpenAPI
    ├── database/                   # PostgreSQL + Drizzle ORM
    ├── auth/                       # better-auth (sessions + API keys)
    ├── middleware/                 # Request middleware patterns
    ├── services/                   # Business logic patterns
    ├── queue/                      # BullMQ background jobs
    ├── testing/                    # Vitest + Testcontainers
    └── config/                     # Environment configuration
```

## FRONTEND ROUTING TABLE

| User wants...                      | Read                              | Check first                            |
| ---------------------------------- | --------------------------------- | -------------------------------------- |
| Project setup, path aliases, deps  | frontend/setup/INDEX.md           | Is ~/utils path alias configured?      |
| Form, input, validation            | frontend/components/forms/INDEX.md | Does FormWrapper/FormProvider exist?   |
| Provider, context, global state    | frontend/providers/INDEX.md       | Does a provider for this domain exist? |
| Component organization             | frontend/components/INDEX.md      | What's the current structure?          |
| Atomic design, atoms, molecules    | frontend/atomic-design.md         | What's the current component structure?|
| Button, Link, Image, Skeleton      | frontend/atoms/                   | Do these atoms already exist?          |
| Drawer, SlideUpDrawer              | frontend/molecules/drawer/        | Is drawer component defined?           |
| Data tables, selection, popovers   | frontend/components/table/        | Does table component exist?            |
| Tabs, tab navigation               | frontend/components/tabs/         | Does tab component exist?              |
| Modal, confirmation dialog         | frontend/components/templates/modal/ | Does Modal component exist?         |
| Styling, Tailwind                  | frontend/styling/INDEX.md         | Is Tailwind configured?                |
| Data fetching, API, TanStack Query | frontend/data-fetching/INDEX.md   | Is @tanstack/react-query installed?    |
| Serial loading, dependent queries  | frontend/data-fetching/patterns.md | N/A - see Serial Loading Patterns     |
| Routing, routes, navigation        | frontend/routing/INDEX.md         | Does router.tsx exist?                 |
| URL params, filters, query string  | frontend/url-state/INDEX.md       | Is useUrlParams hook defined?          |
| URL-synced modals, multiple modals | frontend/url-state/INDEX.md       | Is useModals hook defined?             |
| Drawers patterns, URL sync         | frontend/drawers/INDEX.md         | Is useDrawers hook defined?            |
| Merge refs, React 19 refs          | frontend/utils/mergeRefs.ts       | Using React 19 ref-as-prop?            |
| Error boundaries, error handling   | frontend/error-handling/INDEX.md  | Does ErrorBoundary component exist?    |
| Stripe payments, subscriptions     | frontend/stripe/INDEX.md          | Are Stripe packages installed?         |
| Stripe Connect, merchant onboard   | frontend/stripe/INDEX.md          | Is @stripe/connect-js installed?       |
| Analytics, tracking, PostHog       | frontend/tracking/INDEX.md        | Is posthog-js installed?               |
| User identification, events        | frontend/tracking/INDEX.md        | Is AnalyticsProvider set up?           |

## BACKEND ROUTING TABLE

| User wants...                      | Read                              | Check first                            |
| ---------------------------------- | --------------------------------- | -------------------------------------- |
| Backend architecture overview      | backend/plan/OVERVIEW.md          | N/A                                    |
| Folder organization, file naming   | backend/structure/README.md       | What's the current structure?          |
| Database schemas, queries, Drizzle | backend/database/README.md        | Is Drizzle ORM configured?             |
| API routes, OpenAPI, handlers      | backend/api/README.md             | Is Hono configured?                    |
| Session auth, API keys, RBAC       | backend/auth/README.md            | Is better-auth configured?             |
| Request middleware, rate limiting  | backend/middleware/README.md      | What middleware exists?                |
| Business logic, service patterns   | backend/services/README.md        | What's the service layer structure?    |
| Background jobs, scheduled tasks   | backend/queue/README.md           | Is BullMQ configured?                  |
| Unit tests, integration tests      | backend/testing/README.md         | Is Vitest configured?                  |
| Environment, connections, shutdown | backend/config/README.md          | Is env validation set up?              |

## SHARED UTILITIES (frontend/utils/)

The `frontend/utils/` folder contains shared helpers used across multiple sections:

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

## ATOMIC DESIGN COMPONENTS

The project follows atomic design principles. See `frontend/atomic-design.md` for full documentation.

### Atoms (frontend/atoms/)
Smallest UI building blocks, single-responsibility:
- **buttons/** - `Button.tsx`, `ButtonBase.tsx`, `ButtonLoading.tsx`
- **Link/** - Internal/external link handling with proper target/rel
- **Image/** - Image with loading state
- **SkeletonLoader/** - Loading placeholder

### Molecules (frontend/molecules/)
Composed atoms working together:
- **drawer/** - `Drawer.tsx` (side panel), `SlideUpDrawer.tsx` (bottom sheet)

### Shared Hooks (frontend/hooks/)
- **useDrawers.ts** - URL-synced drawer state management

### Component Templates (frontend/components/)
- **forms/** - Form inputs (FormWrapper, Input, Select, Checkbox, etc.)
- **table/** - Data table (TableWrapper, TableHeader, TableRow, TableCell, etc.)
- **tabs/** - Tab navigation component
- **templates/modal/** - Modal, BaseButtonModal, DangerModal

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
- Add LayoutProviderWrapped.tsx for session/auth wrapper
- Create domain route files as needed

IF adding protected routes:

- Ensure LayoutPrivate wraps the routes
- Check useAuth hook implementation
- Follow existing redirect patterns

IF need declarative redirects:

- Use RedirectPageRoute.tsx for simple page redirects

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

### Drawers/Modals

IF user's project has existing drawer/modal system:

- Follow their patterns
- Only add missing features (URL sync, stacking)

IF user's project has NO drawer setup:

- Decide: URL-synced (useDrawers) or local state (useState)
- Add Drawer.tsx from molecules/ for simple side panels
- Add SlideUpDrawer.tsx from molecules/ for bottom sheets

IF adding URL-synced drawers:

- Add useDrawers.ts hook from hooks/
- Use for primary actions that should be linkable
- Keep data minimal (pass IDs, fetch inside drawer)

IF user needs modals (not drawers):

- Use Modal.tsx for base modal
- Use BaseButtonModal.tsx for modal with actions
- Use DangerModal.tsx for confirmation dialogs

### Tables

IF user's project has existing table components:

- Follow their patterns
- Only add missing features (selection, popovers)

IF user's project has NO table setup:

- Start with TableWrapper.tsx, TableHeader.tsx, TableRow.tsx, TableCell.tsx
- Add TableSelect.tsx for row selection
- Add SelectActionBar.tsx for bulk actions
- Add popovers (TableMenuPopover, TableDetailsPopover) as needed

### Stripe Integration

IF user's project has existing Stripe setup:

- Follow their patterns (stripePromise location, hooks structure)
- Only add missing components (payment form, subscription checkout)
- Check for existing payment method handling

IF user's project has NO Stripe setup:

- Start with stripePromise.ts (Stripe initialization)
- Add hooks: useStripePromise, useStripePaymentIntent, useStripeSetupIntent
- Add components based on needs (PaymentForm, SetupPaymentMethod, etc.)

IF adding one-time payments:

- Add useStripePaymentIntent hook
- Add PaymentForm component with Elements + PaymentElement
- Create backend endpoint for payment intents

IF adding saved payment methods:

- Add useStripeSetupIntent hook
- Add SetupPaymentMethod component with AddressElement + PaymentElement
- Add SetupIntentFeedback for redirect handling

IF adding subscriptions:

- Add SubscriptionCheckout component with EmbeddedCheckout
- Add StripeReturn page for checkout callback
- Add CustomerPortalButton for subscription management

IF adding Stripe Connect (merchants):

- Install @stripe/connect-js and @stripe/react-connect-js
- Add useStripeConnectInstance hook
- Add ConnectOnboarding component

### Analytics & Tracking

IF user's project has existing analytics setup:

- Follow their patterns (provider location, event naming)
- Only add missing tracking functions
- Check for existing user identification flow

IF user's project has NO analytics setup:

- Start with PostHogProvider.tsx (PostHog initialization)
- Add analytics.ts for core functions (identifyUser, trackEvent)
- Add AnalyticsProvider.tsx for multi-platform support
- Wrap app with AnalyticsProvider

IF adding user identification:

- Call identifyUser() after login, token refresh, session restore
- Call resetUser() on logout
- Include user properties relevant for segmentation

IF adding domain-specific events:

- Add tracking.ts with type-safe event functions
- Use consistent event naming (snake_case)
- Include relevant properties for each event

IF integrating multiple platforms (PostHog + GA):

- Use AnalyticsProvider pattern to aggregate platforms
- Send events to all platforms from single function calls
- Handle per-platform configuration in provider

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

### Backend (Hono.js)

IF user's project has existing Hono app:

- Follow their route organization patterns
- Add new routes to appropriate domain file
- Check for existing middleware

IF user's project has NO backend setup:

- Read backend/CLAUDE.md for complete guide
- Start with entry point (index.ts), app config (app.ts), env validation (env.ts)
- Add database schema, then services, then routes

IF adding new API domain:

1. Create schema in db/schema/[domain].ts
2. Generate migration with drizzle-kit
3. Create service in services/[domain]/
4. Create routes in routes/[domain]/
5. Mount routes in app.ts

IF adding authentication:

- Use better-auth for sessions (web UI)
- Use API keys for programmatic access
- Add RBAC middleware for permissions

IF adding background jobs:

- Use BullMQ with Redis
- Create processor in queue/processors/
- Add job to queue from service layer

## TRIGGER PATTERNS

### Frontend

#### frontend/setup/INDEX.md
Keywords: setup, configure, install, dependencies, path alias, tsconfig, vite config, tailwind setup

#### frontend/components/forms/INDEX.md
Keywords: form, input, validation, submit, field, register, useForm, zod, login form, registration, contact form

#### frontend/providers/INDEX.md
Keywords: provider, context, global state, useContext, auth, theme, modal, toast, share state

#### frontend/components/INDEX.md
Keywords: component structure, atomic design, atoms, molecules, organisms, where should this go

#### frontend/atomic-design.md
Keywords: atomic design, atoms, molecules, organisms, templates, pages, component hierarchy

#### frontend/atoms/
Keywords: button, link, image, skeleton, loader, loading, base components

#### frontend/molecules/drawer/
Keywords: drawer, side panel, bottom sheet, slide up

#### frontend/components/table/
Keywords: table, data table, grid, rows, columns, selection, checkbox, bulk actions, popover

#### frontend/components/tabs/
Keywords: tabs, tab navigation, tab panel, tab list

#### frontend/components/templates/modal/
Keywords: modal, dialog, popup, confirmation, danger modal, alert

#### frontend/styling/INDEX.md
Keywords: tailwind, className, styles, button styles, responsive, clsx, cva

#### frontend/data-fetching/INDEX.md
Keywords: api, fetch, REST, useQuery, tanstack, cache, CRUD, pagination, data hook, useData, usePagination, API client, serial loading, dependent queries, runQuery, race condition

#### frontend/routing/INDEX.md
Keywords: router, routes, navigation, react-router, protected routes, auth guard, lazy loading, code splitting, nested layouts, createBrowserRouter, redirect

#### frontend/url-state/INDEX.md
Keywords: url params, query string, useSearchParams, filters, pagination, shareable url, bookmarkable, url state, qs library, useModals, multiple modals, modal stack, compressed URL params

#### frontend/drawers/INDEX.md
Keywords: drawer patterns, URL-synced drawers, useDrawers hook

#### frontend/hooks/useDrawers.ts
Keywords: useDrawers, drawer state, URL sync, drawer management

#### frontend/error-handling/INDEX.md
Keywords: error boundary, error handling, fallback, crash, catch error, sentry, error reporting, retry, componentDidCatch

#### frontend/stripe/INDEX.md
Keywords: stripe, payment, checkout, subscription, payment intent, setup intent, payment element, embedded checkout, customer portal, stripe connect, merchant onboarding, @stripe/stripe-js, @stripe/react-stripe-js

#### frontend/tracking/INDEX.md
Keywords: analytics, tracking, posthog, events, identify, user identification, page view, feature flags, trackEvent, identifyUser, AnalyticsProvider, PostHogProvider, google analytics, gtag

### Backend

#### backend/CLAUDE.md
Keywords: backend, server, api, hono, node, typescript backend

#### backend/structure/README.md
Keywords: folder structure, file organization, project structure, naming conventions

#### backend/database/README.md
Keywords: database, postgresql, drizzle, orm, schema, migration, query, sql

#### backend/api/README.md
Keywords: api routes, endpoints, openapi, swagger, hono routes, rest api, crud

#### backend/auth/README.md
Keywords: authentication, auth, session, login, logout, api key, rbac, permissions, better-auth

#### backend/middleware/README.md
Keywords: middleware, request handling, rate limiting, cors, logging

#### backend/services/README.md
Keywords: service layer, business logic, service pattern, domain logic

#### backend/queue/README.md
Keywords: queue, background jobs, bullmq, redis, workers, scheduled tasks, async jobs

#### backend/testing/README.md
Keywords: testing, vitest, unit test, integration test, testcontainers, mock

#### backend/config/README.md
Keywords: environment, config, env variables, connection, graceful shutdown

## DEPENDENCIES

See `frontend/setup/INDEX.md` for frontend dependency lists.
See `backend/CLAUDE.md` for backend dependencies.
