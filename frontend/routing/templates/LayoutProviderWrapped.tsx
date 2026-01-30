import { Outlet } from "react-router";
import { SessionProvider } from "~/providers/SessionProvider";
import { AuthProvider } from "~/providers/AuthProvider";

// ============================================================================
// LAYOUT PROVIDER WRAPPED
// ============================================================================
// This layout sits between LayoutRoot and LayoutAuth/LayoutPrivate.
// It provides session and auth context to all routes that need it.
//
// Structure:
//   LayoutRoot (QueryClient, Analytics, ErrorBoundary)
//   └── LayoutProviderWrapped (Session, Auth) <-- This component
//       ├── LayoutAuth (Auth pages - login, signup)
//       └── LayoutPrivate (Protected pages)
//
// Why separate from LayoutRoot?
// - Keeps LayoutRoot focused on global concerns (error boundaries, analytics)
// - Allows isolated routes (form previews, OAuth callbacks) to bypass auth
// - Makes provider hierarchy explicit and easier to reason about
// ============================================================================

const LayoutProviderWrapped = () => {
  return (
    <SessionProvider>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </SessionProvider>
  );
};

export default LayoutProviderWrapped;

// =============================================================================
// USAGE IN ROUTER
// =============================================================================
//
// const LayoutProviderWrapped = lazy(
//   () => import("~/layouts/LayoutProviderWrapped")
// );
//
// {
//   Component: LayoutRoot,
//   children: [
//     // Isolated routes (outside providers)
//     { path: "forms/:formId/preview", element: <PageFormPreview /> },
//
//     // Main app (inside providers)
//     {
//       Component: LayoutProviderWrapped,
//       children: [
//         authRoutes,
//         { Component: LayoutPrivate, children: [...] },
//       ],
//     },
//   ],
// }
//
// =============================================================================
// ADDING MORE PROVIDERS
// =============================================================================
//
// Add providers in dependency order (outer providers can't depend on inner):
//
// const LayoutProviderWrapped = () => {
//   return (
//     <SessionProvider>           {/* No dependencies */}
//       <AuthProvider>            {/* Depends on Session */}
//         <FeatureFlagProvider>   {/* Depends on Auth (user features) */}
//           <Outlet />
//         </FeatureFlagProvider>
//       </AuthProvider>
//     </SessionProvider>
//   );
// };
