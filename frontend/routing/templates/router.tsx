import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";

// ============================================================================
// LAYOUT COMPONENTS
// ============================================================================
// Option 1: Direct import (critical layouts, smaller apps)
import LayoutRoot from "~/LayoutRoot";
import NotFoundPage from "~/pages/NotFoundPage";

// Option 2: Lazy load layouts (code splitting, larger apps)
// React Router handles Suspense automatically for Component prop
const LayoutProviderWrapped = lazy(
  () => import("~/layouts/LayoutProviderWrapped")
);
const LayoutPrivate = lazy(() => import("~/pages/private/LayoutPrivate"));
const LayoutAuth = lazy(() => import("~/pages/auth/LayoutAuth"));

// ============================================================================
// ROUTE MODULES
// ============================================================================
import { authRoutes } from "~/routes/auth.routes";
import { dashboardRoutes } from "~/routes/dashboard.routes";
import { settingsRoutes } from "~/routes/settings.routes";

// ============================================================================
// LAZY LOADED PAGES
// ============================================================================
const PageHome = lazy(() => import("~/pages/private/PageHome"));
const PageFormPreview = lazy(() => import("~/pages/forms/PageFormPreview"));

// ============================================================================
// ISOLATED ROUTE PROVIDERS
// ============================================================================
// For routes that need different providers than the main app
import { LocalSessionProvider } from "~/providers/LocalSessionProvider";

// ============================================================================
// ROUTER CONFIGURATION
// ============================================================================

export const router = createBrowserRouter(
  [
    {
      Component: LayoutRoot,
      errorElement: <NotFoundPage />,
      children: [
        // ================================================================
        // ISOLATED ROUTES (outside main provider tree)
        // ================================================================
        // Use for: form previews, OAuth callbacks, embedded widgets
        {
          path: "forms/:formId/preview",
          element: (
            <LocalSessionProvider>
              <Suspense fallback={null}>
                <PageFormPreview />
              </Suspense>
            </LocalSessionProvider>
          ),
        },

        // ================================================================
        // MAIN APPLICATION (inside providers)
        // ================================================================
        {
          Component: LayoutProviderWrapped,
          children: [
            // ==============================================================
            // AUTHENTICATION ROUTES
            // ==============================================================
            authRoutes,

            // ==============================================================
            // PRIVATE AUTHENTICATED ROUTES
            // ==============================================================
            {
              Component: LayoutPrivate,
              children: [
                // Home Page
                { path: "/", Component: PageHome },

                // Dashboard Routes
                dashboardRoutes,

                // Settings Routes
                ...settingsRoutes,
              ],
            },
          ],
        },
      ],
    },
  ],
  {
    // Optional: Set basename if app runs in a subdirectory
    basename: "/app",
  }
);

// =============================================================================
// EXAMPLE USAGE
// =============================================================================
//
// In main.tsx:
//
// import { RouterProvider } from "react-router-dom";
// import { router } from "./router";
//
// createRoot(document.getElementById("root")!).render(
//   <StrictMode>
//     <RouterProvider router={router} />
//   </StrictMode>
// );
