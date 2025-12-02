import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";

// ============================================================================
// LAYOUT COMPONENTS (not lazy loaded - needed immediately)
// ============================================================================
import LayoutRoot from "~/LayoutRoot";
import LayoutPrivate from "~/pages/private/LayoutPrivate";
import LayoutAuth from "~/pages/auth/LayoutAuth";
import NotFoundPage from "~/pages/NotFoundPage";

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

// ============================================================================
// ROUTER CONFIGURATION
// ============================================================================

export const router = createBrowserRouter(
  [
    {
      Component: LayoutRoot,
      errorElement: <NotFoundPage />,
      children: [
        // ==================================================================
        // AUTHENTICATION ROUTES
        // ==================================================================
        authRoutes,

        // ==================================================================
        // PRIVATE AUTHENTICATED ROUTES
        // ==================================================================
        {
          Component: LayoutPrivate,
          children: [
            // Home Page
            {
              path: "/",
              element: (
                <Suspense fallback={null}>
                  <PageHome />
                </Suspense>
              ),
            },

            // Dashboard Routes
            dashboardRoutes,

            // Settings Routes
            ...settingsRoutes,
          ],
        },
      ],
    },
  ],
  {
    // Optional: Set basename if app runs in a subdirectory
    // basename: "/app",
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
