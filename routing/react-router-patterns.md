# React Router v6 Patterns Guide

## Router Setup

### createBrowserRouter

Use `createBrowserRouter` for modern React Router v6 applications:

```tsx
import { createBrowserRouter, RouterProvider } from "react-router-dom";

export const router = createBrowserRouter(
  [
    {
      Component: LayoutRoot,
      errorElement: <NotFoundPage />,
      children: [
        // Routes here
      ],
    },
  ],
  {
    basename: "/app", // Optional: if app runs in a subdirectory
  }
);

// In main.tsx
createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);
```

### Route Definition Options

```tsx
// Option 1: Component prop (recommended when no props needed)
{ path: "dashboard", Component: PageDashboard }

// Option 2: element prop (when component needs props or wrapping)
{
  path: "dashboard",
  element: (
    <Suspense fallback={null}>
      <PageDashboard />
    </Suspense>
  ),
}

// Option 3: Index route (default child)
{ index: true, Component: PageHome }
```

## Nested Layouts Architecture

### Layout Hierarchy

The recommended hierarchy wraps providers progressively:

```
LayoutRoot (Global providers - QueryClient, Analytics)
│
└── LayoutProviderWrapped (Session/Auth providers)
    │
    ├── LayoutAuth (Auth pages - login, signup)
    │   └── Login, Signup, ForgotPassword pages
    │
    └── LayoutPrivate (Protected - requires authentication)
        │
        ├── Full-width pages (no sidebar)
        │   └── Invoices, File viewers, etc.
        │
        └── LayoutHasSidebar (Standard navigation)
            └── Dashboard, Settings, etc.
```

### Implementation

```tsx
// router.tsx
export const router = createBrowserRouter([
  {
    Component: LayoutRoot,
    errorElement: <NotFoundPage />,
    children: [
      {
        Component: LayoutProviderWrapped,
        children: [
          // Auth routes (wrapped by LayoutAuth)
          authRoutes,

          // Protected routes
          {
            Component: LayoutPrivate,
            children: [
              // Root private page
              { path: "/", Component: PageHome },

              // Full-width pages (no sidebar)
              ...invoiceRoutes,

              // Pages with sidebar
              {
                Component: LayoutHasSidebar,
                children: [
                  dashboardRoutes,
                  settingsRoutes,
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);
```

## Protected Routes

### Basic Auth Guard

```tsx
// LayoutPrivate.tsx
import { Outlet } from "react-router";
import useAuth from "~/hooks/auth/useAuth";
import useClientRedirect from "~/hooks/useClientRedirect";

const LayoutPrivate = () => {
  const { isInitialLoad, isLoading, isAuthenticated } = useAuth();
  const clientRedirect = useClientRedirect();

  // Show nothing during initial load
  if (isInitialLoad && isLoading) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated && !isLoading) {
    clientRedirect("/login");
    return null;
  }

  return <Outlet />;
};

export default LayoutPrivate;
```

### Auth Page Guard (Redirect Authenticated Users)

```tsx
// LayoutAuth.tsx
import { Outlet } from "react-router";
import useAuth from "~/hooks/auth/useAuth";
import useClientRedirect from "~/hooks/useClientRedirect";

const LayoutAuth = () => {
  const { isInitialLoad, isLoading, isAuthenticated, user } = useAuth();
  const clientRedirect = useClientRedirect();

  // Show nothing during initial load
  if (isInitialLoad && isLoading) {
    return null;
  }

  // Redirect authenticated users to their dashboard
  if (!isLoading && isAuthenticated && user?.role) {
    if (user.role === "admin") {
      clientRedirect("/admin");
    } else {
      clientRedirect("/dashboard");
    }
    return null;
  }

  return <Outlet />;
};

export default LayoutAuth;
```

### Email Verification Gate

For apps requiring email verification before accessing certain features:

```tsx
// In LayoutPrivate.tsx
const LayoutPrivate = () => {
  const { pathname } = useLocation();
  const { data: userData, isLoading } = useCurrentUser();
  const clientRedirect = useClientRedirect();

  useEffect(() => {
    if (!isLoading && userData && !userData.emailVerified) {
      // List of paths that require email verification
      const protectedPaths = ["/billing", "/settings/payments"];

      if (protectedPaths.includes(pathname)) {
        clientRedirect(`/verify-email?returnTo=${pathname}`);
      }
    }
  }, [pathname, userData, isLoading, clientRedirect]);

  // ... rest of component
};
```

## Lazy Loading

### Page Components

Always lazy load page components for code splitting:

```tsx
import { lazy, Suspense } from "react";

// Lazy load page components
const PageDashboard = lazy(() => import("~/pages/Dashboard"));
const PageSettings = lazy(() => import("~/pages/Settings"));
const PageProfile = lazy(() => import("~/pages/Profile"));

// In routes
{
  path: "dashboard",
  element: (
    <Suspense fallback={null}>
      <PageDashboard />
    </Suspense>
  ),
}
```

### Layout Components

Layout components should NOT be lazy loaded (they're needed immediately):

```tsx
// Import directly - not lazy
import LayoutPrivate from "~/pages/private/LayoutPrivate";
import LayoutAuth from "~/pages/auth/LayoutAuth";

// Use directly
{ Component: LayoutPrivate, children: [...] }
```

### Suspense Patterns

```tsx
// Option 1: fallback={null} - cleanest, no flash of loading
<Suspense fallback={null}>
  <PageDashboard />
</Suspense>

// Option 2: Loading skeleton (for important pages)
<Suspense fallback={<PageSkeleton />}>
  <PageDashboard />
</Suspense>

// Option 3: Minimal spinner (rarely needed)
<Suspense fallback={<LoadingSpinner />}>
  <PageDashboard />
</Suspense>
```

## Domain Route Files

### Structure

Organize routes by domain/feature area:

```
src/routes/
├── auth.routes.tsx       # Login, signup, password reset
├── dashboard.routes.tsx  # Main dashboard pages
├── settings.routes.tsx   # User settings
├── admin.routes.tsx      # Admin-only routes
└── index.ts              # Re-exports all routes
```

### Pattern

```tsx
// dashboard.routes.tsx
import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

// Lazy load all page components
const PageDashboard = lazy(() => import("~/pages/dashboard/PageDashboard"));
const PageAnalytics = lazy(() => import("~/pages/dashboard/PageAnalytics"));
const PageReports = lazy(() => import("~/pages/dashboard/PageReports"));

export const dashboardRoutes: RouteObject = {
  path: "dashboard",
  children: [
    // Index route (default)
    { index: true, Component: PageDashboard },

    // Nested routes
    { path: "analytics", Component: PageAnalytics },
    { path: "reports", Component: PageReports },

    // Dynamic route
    { path: "reports/:reportId", Component: PageReportDetail },
  ],
};
```

### Importing in Router

```tsx
// router.tsx
import { authRoutes } from "~/routes/auth.routes";
import { dashboardRoutes } from "~/routes/dashboard.routes";
import { settingsRoutes } from "~/routes/settings.routes";

// Spread or nest as needed
{
  Component: LayoutPrivate,
  children: [
    dashboardRoutes,
    settingsRoutes,
    // Or spread if it's an array
    ...adminRoutes,
  ],
}
```

## Error Handling

### Error Boundaries in Routes

```tsx
import ErrorBoundary from "~/components/ErrorBoundary";

// In LayoutRoot
const LayoutRoot = () => (
  <ErrorBoundary boundaryName="ApplicationRoot" fallbackMode="fullpage">
    <Outlet />
  </ErrorBoundary>
);

// In LayoutPrivate
const LayoutPrivate = () => (
  <ErrorBoundary boundaryName="Private Area" fallbackMode="detailed">
    <Outlet />
  </ErrorBoundary>
);
```

### Route-Level Error Element

```tsx
{
  Component: LayoutRoot,
  errorElement: <NotFoundPage />,
  children: [...]
}
```

## Client-Side Redirects

### useClientRedirect Hook

```tsx
// hooks/useClientRedirect.ts
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

const useClientRedirect = () => {
  const navigate = useNavigate();

  return useCallback(
    (to: string, options?: { replace?: boolean }) => {
      navigate(to, options);
    },
    [navigate]
  );
};

export default useClientRedirect;
```

### Usage

```tsx
const redirect = useClientRedirect();

// Simple redirect
redirect("/login");

// Replace history (back button won't return here)
redirect("/dashboard", { replace: true });
```

## TypeScript Integration

### Route Types

```tsx
import type { RouteObject } from "react-router-dom";

// Single route object
export const dashboardRoutes: RouteObject = { ... };

// Array of routes
export const settingsRoutes: RouteObject[] = [ ... ];
```

### Typed Route Params

```tsx
import { useParams } from "react-router-dom";

// Define params type
type ReportParams = {
  reportId: string;
};

// In component
const { reportId } = useParams<ReportParams>();
```

## Common Patterns

### Isolated Routes (Outside Provider Tree)

For routes that need isolation from the main provider tree (e.g., form previews):

```tsx
{
  // Outside LayoutProviderWrapped
  path: "forms/:formId/preview",
  element: (
    <LocalSessionProvider>
      <PageFormPreview />
    </LocalSessionProvider>
  ),
}
```

### Index Route vs Path Route

```tsx
// Index route: renders at parent's path
{ index: true, Component: PageDashboard }
// URL: /dashboard (when parent has path: "dashboard")

// Path route: renders at specific sub-path
{ path: "analytics", Component: PageAnalytics }
// URL: /dashboard/analytics
```

### Catch-All / Not Found

```tsx
// At the end of children array
{ path: "*", element: <NotFoundPage /> }
```

## Dependencies

```bash
npm install react-router-dom
```

For TypeScript support (included with react-router-dom v6):
```bash
# Types are included, no separate install needed
```
