import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

// ============================================================================
// LAZY LOADED PAGE COMPONENTS
// ============================================================================
// Always lazy load page components for code splitting
const PageDashboard = lazy(() => import("~/pages/dashboard/PageDashboard"));
const PageAnalytics = lazy(() => import("~/pages/dashboard/PageAnalytics"));
const PageReports = lazy(() => import("~/pages/dashboard/PageReports"));
const PageReportDetail = lazy(
  () => import("~/pages/dashboard/PageReportDetail")
);

// ============================================================================
// ROUTE DEFINITION
// ============================================================================

/**
 * Dashboard routes module.
 * Contains all routes related to the user dashboard.
 *
 * Structure:
 * /dashboard          - Main dashboard (index)
 * /dashboard/analytics - Analytics page
 * /dashboard/reports   - Reports list
 * /dashboard/reports/:reportId - Single report detail
 */
export const dashboardRoutes: RouteObject = {
  path: "dashboard",
  children: [
    // Index route - renders at /dashboard
    { index: true, Component: PageDashboard },

    // Nested routes
    { path: "analytics", Component: PageAnalytics },
    { path: "reports", Component: PageReports },

    // Dynamic route with parameter
    { path: "reports/:reportId", Component: PageReportDetail },
  ],
};

// =============================================================================
// ALTERNATIVE: ARRAY EXPORT
// =============================================================================
//
// Use array export when routes don't share a common parent path:
//
// export const settingsRoutes: RouteObject[] = [
//   { path: "settings", Component: PageSettings },
//   { path: "settings/profile", Component: PageProfile },
//   { path: "settings/billing", Component: PageBilling },
// ];
//
// Import with spread operator:
// { Component: LayoutPrivate, children: [...settingsRoutes] }
//
// =============================================================================
// ALTERNATIVE: WITH LAYOUT WRAPPER
// =============================================================================
//
// When domain needs its own layout (e.g., sidebar, header):
//
// import LayoutDashboard from "~/pages/dashboard/LayoutDashboard";
//
// export const dashboardRoutes: RouteObject = {
//   path: "dashboard",
//   Component: LayoutDashboard,  // Domain-specific layout
//   children: [
//     { index: true, Component: PageDashboard },
//     { path: "analytics", Component: PageAnalytics },
//   ],
// };
//
// =============================================================================
// EXAMPLE USAGE IN ROUTER
// =============================================================================
//
// In router.tsx:
//
// import { dashboardRoutes } from "~/routes/dashboard.routes";
//
// {
//   Component: LayoutPrivate,
//   children: [
//     dashboardRoutes,
//     // Other domain routes...
//   ],
// }
//
// =============================================================================
// FILE ORGANIZATION PATTERN
// =============================================================================
//
// src/routes/
// ├── auth.routes.tsx       # Login, signup, password reset
// ├── dashboard.routes.tsx  # Main dashboard pages (this file)
// ├── settings.routes.tsx   # User settings
// ├── admin.routes.tsx      # Admin-only routes
// └── index.ts              # Optional: re-export all routes
//
// =============================================================================
// NESTED ROUTES WITH OUTLET
// =============================================================================
//
// For routes that have their own nested children:
//
// export const reportsRoutes: RouteObject = {
//   path: "reports",
//   children: [
//     {
//       index: true,
//       Component: PageReportsList,
//     },
//     {
//       path: ":reportId",
//       Component: PageReportDetail,
//       children: [
//         { path: "edit", Component: PageReportEdit },
//         { path: "share", Component: PageReportShare },
//       ],
//     },
//   ],
// };
//
// In PageReportDetail, use <Outlet /> to render child routes.
