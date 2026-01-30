// pages/StripeReturn.tsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rest } from "~/lib/api/rest"; // Adjust to your API client
import { SkeletonLoader } from "~/atoms/SkeletonLoader";
import { Alert } from "~/components/Alert";

/**
 * Stripe return page for handling checkout redirects
 *
 * This page should be mounted at /stripe/return (or wherever you specify as returnUrl).
 * It handles the callback after Stripe checkout and syncs the subscription status.
 *
 * URL Parameters:
 * - session_id: Stripe checkout session ID
 * - redirect: Path to redirect to after verification (default: /dashboard)
 *
 * @example
 * // In your router
 * {
 *   path: "/stripe/return",
 *   element: <StripeReturn />,
 * }
 */
export const StripeReturn = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get("session_id");
  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const syncMutation = useMutation({
    mutationFn: async (checkoutSession: string) => {
      return rest.post("/api/stripe/subscription-checkout-session/sync", {
        checkoutSession,
      });
    },
    onSuccess: () => {
      // Invalidate cached data that might be affected by subscription
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["users", "current"] });
      queryClient.invalidateQueries({ queryKey: ["subscription"] });

      // Redirect to destination
      navigate(redirectPath, { replace: true });
    },
    onError: (err) => {
      setError(
        err instanceof Error ? err.message : "Failed to verify subscription"
      );
    },
  });

  useEffect(() => {
    if (sessionId) {
      syncMutation.mutate(sessionId);
    } else {
      setError("No checkout session found");
    }
  }, [sessionId]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="max-w-md w-full">
          <Alert type="danger">{error}</Alert>
          <button
            onClick={() => navigate(redirectPath)}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Return to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <SkeletonLoader className="h-32 mb-4" />
        <p className="text-gray-600">Verifying your subscription...</p>
      </div>
    </div>
  );
};

export default StripeReturn;
