import type { JSX } from "react";
import { Outlet } from "react-router";

import ErrorBoundary from "~/components/ErrorBoundary";
import useAuth from "~/hooks/auth/useAuth";
import useClientRedirect from "~/hooks/useClientRedirect";

/**
 * Protected route layout that requires authentication.
 * Redirects unauthenticated users to the login page.
 *
 * Key behaviors:
 * - Returns null during initial auth check (prevents flash)
 * - Redirects to /login if not authenticated
 * - Wraps children in ErrorBoundary for error isolation
 */
const LayoutPrivate = (): JSX.Element | null => {
  const { isInitialLoad, isLoading, isAuthenticated } = useAuth();
  const clientRedirect = useClientRedirect();

  // Show nothing during initial authentication check
  // This prevents a flash of the login page or protected content
  if (isInitialLoad && isLoading) {
    return null;
  }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isLoading) {
    clientRedirect("/login");
    return null;
  }

  return (
    <ErrorBoundary boundaryName="Private Area" fallbackMode="detailed">
      <Outlet />
    </ErrorBoundary>
  );
};

export default LayoutPrivate;

// =============================================================================
// EXAMPLE USAGE
// =============================================================================
//
// In router.tsx:
//
// import LayoutPrivate from "~/pages/private/LayoutPrivate";
//
// {
//   Component: LayoutPrivate,
//   children: [
//     { path: "/", Component: PageHome },
//     { path: "dashboard", Component: PageDashboard },
//     { path: "settings", Component: PageSettings },
//   ],
// }
//
// =============================================================================
// CUSTOMIZATION: EMAIL VERIFICATION GATE
// =============================================================================
//
// To require email verification for certain routes:
//
// import { useEffect } from "react";
// import { useLocation } from "react-router";
// import useCurrentUser from "~/hooks/user/useCurrentUser";
//
// const LayoutPrivate = () => {
//   const { pathname } = useLocation();
//   const { data: user, isLoading: isUserLoading } = useCurrentUser();
//   const clientRedirect = useClientRedirect();
//
//   // Paths that require email verification
//   const protectedPaths = ["/billing", "/settings/payments"];
//
//   useEffect(() => {
//     if (!isUserLoading && user && !user.emailVerified) {
//       if (protectedPaths.includes(pathname)) {
//         clientRedirect(`/verify-email?returnTo=${encodeURIComponent(pathname)}`);
//       }
//     }
//   }, [pathname, user, isUserLoading, clientRedirect]);
//
//   // ... rest of component
// };
//
// =============================================================================
// CUSTOMIZATION: ROLE-BASED ACCESS
// =============================================================================
//
// To restrict routes by user role:
//
// const LayoutAdminOnly = () => {
//   const { user } = useAuth();
//   const clientRedirect = useClientRedirect();
//
//   if (user?.role !== "admin") {
//     clientRedirect("/unauthorized");
//     return null;
//   }
//
//   return <Outlet />;
// };
