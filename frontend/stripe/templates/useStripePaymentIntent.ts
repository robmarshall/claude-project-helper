// hooks/stripe/useStripePaymentIntent.ts
import { useState, useEffect } from "react";
import { rest } from "~/lib/api/rest"; // Adjust to your API client

interface PaymentIntentResponse {
  client_secret: string;
  payment_intent: string;
}

interface UseStripePaymentIntentProps {
  /** ID of the invoice/order to pay */
  invoiceId: string;
  /** Optional: ID of a saved payment method to use */
  paymentMethodId?: string;
  /** Whether to fetch the payment intent */
  enable?: boolean;
}

interface UseStripePaymentIntentReturn {
  data: PaymentIntentResponse | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch a payment intent from your backend
 *
 * @example
 * const { data, isLoading, error } = useStripePaymentIntent({
 *   invoiceId: "inv_123",
 *   enable: true,
 * });
 *
 * if (data?.client_secret) {
 *   // Ready to render Elements
 * }
 */
export const useStripePaymentIntent = ({
  invoiceId,
  paymentMethodId,
  enable = true,
}: UseStripePaymentIntentProps): UseStripePaymentIntentReturn => {
  const [data, setData] = useState<PaymentIntentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enable || !invoiceId) return;

    const fetchPaymentIntent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await rest.post<PaymentIntentResponse>(
          "/api/stripe/payment-intents",
          {
            invoice: invoiceId,
            paymentMethod: paymentMethodId,
          }
        );
        setData(response);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to create payment intent"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [invoiceId, paymentMethodId, enable]);

  return { data, isLoading, error };
};

export default useStripePaymentIntent;
