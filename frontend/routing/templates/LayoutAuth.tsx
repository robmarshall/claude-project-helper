import { Suspense } from "react";
import { Outlet } from "react-router";

import useAuth from "~/hooks/auth/useAuth";
import useClientRedirect from "~/hooks/useClientRedirect";

/**
 * Auth page layout that redirects authenticated users away.
 * Used for login, signup, forgot password pages.
 *
 * Key behaviors:
 * - Returns null during initial auth check (prevents flash)
 * - Redirects authenticated users to their appropriate dashboard
 * - Supports role-based redirects (admin vs regular user)
 */
const LayoutAuth = () => {
  const { isInitialLoad, isLoading, isAuthenticated, user } = useAuth();
  const clientRedirect = useClientRedirect();

  // Show nothing during initial authentication check
  if (isInitialLoad && isLoading) {
    return null;
  }

  // Redirect authenticated users to their dashboard
  if (!isLoading && isAuthenticated && user?.role) {
    // Role-based redirects
    if (user.role === "admin") {
      clientRedirect("/admin");
    } else {
      clientRedirect("/dashboard");
    }
    return null;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Add your logo component here */}
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
          Welcome
        </h2>
      </div>

      {/* Auth Form Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-6 py-8 shadow sm:rounded-lg sm:px-10">
          <Suspense fallback={null}>
            <Outlet />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default LayoutAuth;

// =============================================================================
// EXAMPLE USAGE
// =============================================================================
//
// In routes/auth.routes.tsx:
//
// import LayoutAuth from "~/pages/auth/LayoutAuth";
//
// export const authRoutes: RouteObject = {
//   Component: LayoutAuth,
//   children: [
//     { path: "login", Component: PageLogin },
//     { path: "signup", Component: PageSignup },
//     { path: "forgot-password", Component: PageForgotPassword },
//     { path: "reset-password", Component: PageResetPassword },
//   ],
// };
//
// =============================================================================
// CUSTOMIZATION: SPLIT SCREEN LAYOUT
// =============================================================================
//
// For a two-column layout with image:
//
// return (
//   <div className="flex min-h-full flex-1">
//     {/* Left side - Form */}
//     <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20">
//       <Outlet />
//     </div>
//
//     {/* Right side - Image (hidden on mobile) */}
//     <div className="relative hidden w-0 flex-1 lg:block">
//       <img
//         className="absolute inset-0 h-full w-full object-cover"
//         src="/images/auth-background.jpg"
//         alt=""
//       />
//     </div>
//   </div>
// );
//
// =============================================================================
// CUSTOMIZATION: REDIRECT WITH RETURN URL
// =============================================================================
//
// To preserve the intended destination after login:
//
// import { useSearchParams } from "react-router-dom";
//
// const LayoutAuth = () => {
//   const [searchParams] = useSearchParams();
//   const returnTo = searchParams.get("returnTo") || "/dashboard";
//
//   if (!isLoading && isAuthenticated) {
//     clientRedirect(returnTo);
//     return null;
//   }
//
//   // ... rest of component
// };
