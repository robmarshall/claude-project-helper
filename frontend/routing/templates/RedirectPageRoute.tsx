import { Navigate, useParams } from "react-router-dom";

// ============================================================================
// REDIRECT PAGE ROUTE
// ============================================================================
// Declarative redirect component for use in route definitions.
// Supports dynamic parameter substitution from the URL.
//
// Usage:
//   { path: "old-path", element: <RedirectPageRoute to="/new-path" /> }
//   { path: "users/:userId/profile", element: <RedirectPageRoute to="/profiles/:userId" /> }
// ============================================================================

interface Props {
  to: string;
}

const RedirectPageRoute = ({ to }: Props) => {
  const params = useParams();

  // Replace :param placeholders with actual values from URL
  let destination = to;
  for (const [key, value] of Object.entries(params)) {
    destination = destination.replace(`:${key}`, value || "");
  }

  return <Navigate to={destination} replace />;
};

export default RedirectPageRoute;

// =============================================================================
// EXAMPLES
// =============================================================================
//
// Simple redirect (no params):
//   { path: "old-dashboard", element: <RedirectPageRoute to="/dashboard" /> }
//
// Single param substitution:
//   { path: "users/:userId", element: <RedirectPageRoute to="/profiles/:userId" /> }
//   /users/123 -> /profiles/123
//
// Multiple params:
//   { path: "org/:orgId/team/:teamId", element: <RedirectPageRoute to="/teams/:teamId" /> }
//   /org/abc/team/xyz -> /teams/xyz
//
// Partial param usage (some params dropped):
//   { path: "legacy/:userId/settings/:tab", element: <RedirectPageRoute to="/settings/:tab" /> }
//   /legacy/123/settings/profile -> /settings/profile
//
// =============================================================================
// USAGE IN ROUTER
// =============================================================================
//
// import RedirectPageRoute from "~/components/RedirectPageRoute";
//
// export const router = createBrowserRouter([
//   {
//     Component: LayoutRoot,
//     children: [
//       // Redirects
//       { path: "home", element: <RedirectPageRoute to="/" /> },
//       { path: "app/*", element: <RedirectPageRoute to="/dashboard" /> },
//
//       // Regular routes
//       { path: "/", Component: PageHome },
//       { path: "dashboard", Component: PageDashboard },
//     ],
//   },
// ]);
