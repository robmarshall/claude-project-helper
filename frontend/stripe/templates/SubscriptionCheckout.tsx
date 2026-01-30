// components/Stripe/SubscriptionCheckout.tsx
import { useEffect, useState } from "react";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { rest } from "~/lib/api/rest"; // Adjust to your API client
import { SkeletonLoader } from "~/atoms/SkeletonLoader";
import { Alert } from "~/components/Alert";

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Module-level singleton for stripe instance
let stripePromise: Promise<Stripe | null> | null = null;
const getStripePromise = () => {
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

interface CheckoutSessionResponse {
  clientSecret: string;
}

interface SubscriptionCheckoutProps {
  /** Organization ID for the subscription */
  organizationId: string;
  /** Stripe Price ID (e.g., price_xxx) */
  priceId: string;
  /** Path to redirect to after checkout (appended to return URL) */
  redirectPath?: string;
  /** Error callback */
  onError?: (message: string) => void;
}

/**
 * Embedded subscription checkout using Stripe's pre-built UI
 *
 * This component handles the entire checkout flow including:
 * - Payment method collection
 * - Tax calculation
 * - Subscription creation
 *
 * After successful checkout, users are redirected to /stripe/return
 * with a session_id parameter.
 *
 * @example
 * <SubscriptionCheckout
 *   organizationId="org_123"
 *   priceId="price_xxx"
 *   redirectPath="/dashboard"
 *   onError={(msg) => toast.error(msg)}
 * />
 */
export const SubscriptionCheckout = ({
  organizationId,
  priceId,
  redirectPath,
  onError,
}: SubscriptionCheckoutProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isStripeConfigured = !!STRIPE_PUBLISHABLE_KEY;
  const stripe = getStripePromise();

  useEffect(() => {
    if (!isStripeConfigured) {
      console.error("Stripe publishable key is not configured");
      onError?.("Payment system is not configured. Please contact support.");
    }
  }, [isStripeConfigured, onError]);

  if (!isStripeConfigured) {
    return <Alert type="danger">Payment system unavailable</Alert>;
  }

  if (error) {
    return <Alert type="danger">{error}</Alert>;
  }

  if (!stripe) {
    return <SkeletonLoader className="h-96" />;
  }

  // Function to fetch client secret from backend
  const fetchClientSecret = async (): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // Build return URL
      const returnUrl = new URL(window.location.origin);
      returnUrl.pathname = "/stripe/return";
      if (redirectPath) {
        returnUrl.searchParams.set("redirect", redirectPath);
      }

      const response = await rest.post<CheckoutSessionResponse>(
        "/api/stripe/subscription-checkout-session",
        {
          organization: organizationId,
          price: priceId,
          returnUrl: returnUrl.toString(),
        }
      );

      return response.clientSecret;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create checkout";
      setError(message);
      onError?.(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[400px]">
      {isLoading && <SkeletonLoader className="h-96" />}

      <EmbeddedCheckoutProvider
        stripe={stripe}
        options={{ fetchClientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
};

export default SubscriptionCheckout;
