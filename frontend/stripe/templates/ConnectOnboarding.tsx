// components/Stripe/ConnectOnboarding.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ConnectComponentsProvider,
  ConnectAccountOnboarding,
} from "@stripe/react-connect-js";
import { loadConnectAndInitialize } from "@stripe/connect-js/pure";
import type { StripeConnectInstance } from "@stripe/connect-js";
import { rest } from "~/lib/api/rest"; // Adjust to your API client
import { SkeletonLoader } from "~/atoms/SkeletonLoader";
import { Alert } from "~/components/Alert";

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

interface AccountSessionResponse {
  clientSecret: string;
}

interface ConnectOnboardingProps {
  /** Stripe Connect account ID */
  accountId: string;
  /** Path to redirect to after onboarding */
  returnPath: string;
}

/**
 * Hook to initialize Stripe Connect instance
 */
const useStripeConnectInstance = ({
  accountId,
}: {
  accountId?: string;
}) => {
  const [stripeConnectInstance, setStripeConnectInstance] =
    useState<StripeConnectInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) {
      setIsLoading(false);
      return;
    }

    const initializeConnect = async () => {
      try {
        const instance = loadConnectAndInitialize({
          publishableKey: STRIPE_PUBLISHABLE_KEY,
          fetchClientSecret: async () => {
            const response = await rest.post<AccountSessionResponse>(
              "/api/stripe/account-sessions",
              { account: accountId }
            );
            return response.clientSecret;
          },
          // Optional: customize appearance
          // appearance: {
          //   overlays: 'drawer',
          //   variables: {
          //     colorPrimary: '#0066cc',
          //   },
          // },
        });

        setStripeConnectInstance(instance);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to initialize Stripe Connect"
        );
      } finally {
        setIsLoading(false);
      }
    };

    initializeConnect();
  }, [accountId]);

  return { stripeConnectInstance, isLoading, error };
};

/**
 * Stripe Connect onboarding component for merchants/vendors
 *
 * Renders Stripe's pre-built onboarding flow for collecting:
 * - Business information
 * - Identity verification
 * - Bank account details
 * - Tax information
 *
 * @example
 * <ConnectOnboarding
 *   accountId="acct_xxx"
 *   returnPath="/settings/payments"
 * />
 */
export const ConnectOnboarding = ({
  accountId,
  returnPath,
}: ConnectOnboardingProps) => {
  const navigate = useNavigate();
  const { stripeConnectInstance, isLoading, error } = useStripeConnectInstance({
    accountId,
  });

  if (isLoading) {
    return <SkeletonLoader className="h-96" />;
  }

  if (error) {
    return <Alert type="danger">{error}</Alert>;
  }

  if (!stripeConnectInstance) {
    return <Alert type="danger">Unable to initialize onboarding</Alert>;
  }

  return (
    <ConnectComponentsProvider connectInstance={stripeConnectInstance}>
      <ConnectAccountOnboarding
        onExit={() => navigate(returnPath)}
        // Optional: customize collection options
        // collectionOptions={{
        //   fields: 'eventually_due',
        //   futureRequirements: 'include',
        // }}
      />
    </ConnectComponentsProvider>
  );
};

export default ConnectOnboarding;
