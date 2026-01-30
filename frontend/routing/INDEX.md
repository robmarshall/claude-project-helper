# Routing Quick Reference

## BEFORE YOU START

Check user's project:
1. Does `router.tsx` exist? → Review existing structure before adding routes
2. Is React Router v6 installed? → If not, run `npm install react-router-dom`
3. Are there layout guard components? → Follow their auth patterns
4. Are routes organized by domain? → Add to existing domain file

## NEW ROUTING SETUP

Need: router.tsx, LayoutRoot.tsx, then domain route files

1. Copy templates/router.tsx → Main router with createBrowserRouter
2. Copy templates/LayoutRoot.tsx → Root layout with providers
3. Copy templates/LayoutPrivate.tsx → Protected route guard
4. Copy templates/LayoutAuth.tsx → Auth page guard (optional)
5. Create domain route files (e.g., auth.routes.tsx)

## ADDING NEW ROUTES

1. Find the appropriate domain file (auth.routes.tsx, dashboard.routes.tsx, etc.)
2. Add lazy import for the new page component
3. Add route object to the children array
4. If new domain → Create new routes file, import in router.tsx

## TEMPLATES

All templates are in the `templates/` subdirectory.

| File | Use for |
|------|---------|
| router.tsx | Main router configuration |
| LayoutRoot.tsx | Application root with providers |
| LayoutPrivate.tsx | Protected routes (requires auth) |
| LayoutAuth.tsx | Auth pages (redirects if logged in) |
| example.routes.tsx | Domain routes file pattern |

## CORE PATTERNS

### 1. Nested Layouts (Provider Wrapping Order)

```
LayoutRoot (QueryClient, Analytics, ErrorBoundary)
└── LayoutProviderWrapped (Session, Auth)
    ├── LayoutAuth (Auth pages - login, signup)
    └── LayoutPrivate (Protected pages)
        └── LayoutHasSidebar (With navigation)
```

### 2. Protected Route Guard

```tsx
const LayoutPrivate = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const redirect = useClientRedirect();

  if (isLoading) return null;
  if (!isAuthenticated) {
    redirect("/login");
    return null;
  }

  return <Outlet />;
};
```

### 3. Auth Page Guard (Redirect if Logged In)

```tsx
const LayoutAuth = () => {
  const { isLoading, isAuthenticated, user } = useAuth();
  const redirect = useClientRedirect();

  if (isLoading) return null;
  if (isAuthenticated) {
    redirect(user?.role === "admin" ? "/admin" : "/dashboard");
    return null;
  }

  return <Outlet />;
};
```

### 4. Lazy Loading Pattern

```tsx
// Page components - lazy load
const PageDashboard = lazy(() => import("~/pages/Dashboard"));

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

### 5. Domain Routes File

```tsx
// dashboard.routes.tsx
import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const PageDashboard = lazy(() => import("~/pages/Dashboard"));

export const dashboardRoutes: RouteObject = {
  path: "dashboard",
  children: [
    { index: true, Component: PageDashboard },
    { path: "settings", Component: PageSettings },
  ],
};
```

## CORE RULES

1. Use `createBrowserRouter` for React Router v6
2. Always wrap lazy components in `Suspense` with `fallback={null}`
3. Layout components don't need lazy loading (needed immediately)
4. Export `RouteObject` type for TypeScript safety
5. Use `Component` prop (not `element`) when component doesn't need props
6. Check auth state before rendering content, return `null` during loading
7. Redirect unauthenticated users, don't show loading spinners on protected routes

## ROUTE ORGANIZATION

```
src/
├── router.tsx              # Main router configuration
├── LayoutRoot.tsx          # Root layout (providers)
├── routes/
│   ├── auth.routes.tsx     # Login, signup, password reset
│   ├── dashboard.routes.tsx # User dashboard
│   ├── admin.routes.tsx    # Admin routes
│   └── settings.routes.tsx # Settings pages
└── pages/
    ├── auth/
    │   ├── LayoutAuth.tsx
    │   └── PageLogin.tsx
    └── dashboard/
        ├── LayoutPrivate.tsx
        └── PageDashboard.tsx
```

## DEEP DIVE

- Full patterns guide → react-router-patterns.md
- Error boundaries → See ErrorBoundary component in templates
- Email verification gates → react-router-patterns.md#email-verification
