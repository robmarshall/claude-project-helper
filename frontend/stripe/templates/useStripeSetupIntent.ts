// hooks/stripe/useStripeSetupIntent.ts
import { useState, useEffect } from "react";
import { rest } from "~/lib/api/rest"; // Adjust to your API client

interface SetupIntentResponse {
  client_secret: string;
  setup_intent: string;
}

interface UseStripeSetupIntentProps {
  /** Whether to create the setup intent */
  enable?: boolean;
}

interface UseStripeSetupIntentReturn {
  /** The client secret for Elements */
  setupIntent: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to create a setup intent for saving payment methods
 *
 * Use this when you want to save a payment method for future use
 * without charging the customer immediately.
 *
 * @example
 * const { setupIntent, isLoading, error } = useStripeSetupIntent({
 *   enable: true,
 * });
 *
 * if (setupIntent) {
 *   // Ready to render Elements with clientSecret: setupIntent
 * }
 */
export const useStripeSetupIntent = ({
  enable = false,
}: UseStripeSetupIntentProps): UseStripeSetupIntentReturn => {
  const [setupIntent, setSetupIntent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enable) return;

    const createSetupIntent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await rest.post<SetupIntentResponse>(
          "/api/stripe/setup-intents"
        );
        setSetupIntent(response.client_secret);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create setup intent"
        );
      } finally {
        setIsLoading(false);
      }
    };

    createSetupIntent();
  }, [enable]);

  return { setupIntent, isLoading, error };
};

export default useStripeSetupIntent;
