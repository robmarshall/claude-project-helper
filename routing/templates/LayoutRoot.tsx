import { Outlet } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import ErrorBoundary from "~/components/ErrorBoundary";
import queryClient from "~/lib/cache/queryClient";

/**
 * Root layout component that wraps the entire application.
 * Provides global context providers and error boundaries.
 *
 * Provider order (outermost to innermost):
 * 1. QueryClientProvider - React Query cache
 * 2. ErrorBoundary - Global error catching
 * 3. Outlet - Child routes
 */
const LayoutRoot = () => {
  return (
    <div className="h-full min-h-full">
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary boundaryName="ApplicationRoot" fallbackMode="fullpage">
          <Outlet />
        </ErrorBoundary>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </div>
  );
};

export default LayoutRoot;

// =============================================================================
// EXAMPLE USAGE
// =============================================================================
//
// In router.tsx:
//
// import LayoutRoot from "~/LayoutRoot";
//
// export const router = createBrowserRouter([
//   {
//     Component: LayoutRoot,
//     errorElement: <NotFoundPage />,
//     children: [
//       // Auth routes
//       authRoutes,
//       // Protected routes
//       { Component: LayoutPrivate, children: [...] },
//     ],
//   },
// ]);
//
// =============================================================================
// CUSTOMIZATION
// =============================================================================
//
// Add more providers as needed:
// - ThemeProvider for dark/light mode
// - AnalyticsProvider for tracking
// - ToastProvider for notifications
//
// Example:
// <QueryClientProvider client={queryClient}>
//   <ThemeProvider>
//     <ToastProvider>
//       <ErrorBoundary>
//         <Outlet />
//       </ErrorBoundary>
//     </ToastProvider>
//   </ThemeProvider>
// </QueryClientProvider>
