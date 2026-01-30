// components/Stripe/PaymentForm.tsx
import { useState } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import stripePromise from "~/lib/stripe/stripePromise";
import { useStripePaymentIntent } from "~/hooks/stripe/useStripePaymentIntent";
import { Button } from "~/atoms/buttons/Button";
import { SkeletonLoader } from "~/atoms/SkeletonLoader";
import { Alert } from "~/components/Alert";

interface PaymentFormProps {
  /** ID of the invoice/order to pay */
  invoiceId: string;
  /** URL to redirect to after payment */
  returnUrl: string;
  /** Optional callback on successful payment initiation */
  onSuccess?: () => void;
}

/**
 * Inner form component - must be inside Elements provider
 */
const PaymentFormInner = ({
  returnUrl,
  onSuccess,
}: {
  returnUrl: string;
  onSuccess?: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    // Validate form fields
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setErrorMessage(submitError.message ?? "An error occurred");
      setIsProcessing(false);
      return;
    }

    // Confirm the payment
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    // This point is only reached if there's an immediate error
    // (redirect-based payment methods will redirect before this)
    if (error) {
      setErrorMessage(error.message ?? "An error occurred");
      setIsProcessing(false);
    } else {
      onSuccess?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {errorMessage && <Alert type="danger">{errorMessage}</Alert>}

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        isLoading={isProcessing}
        className="w-full"
      >
        Pay Now
      </Button>
    </form>
  );
};

/**
 * Payment form with Stripe Elements
 *
 * Handles one-time payments using PaymentElement.
 * Automatically fetches payment intent and renders the payment form.
 *
 * @example
 * <PaymentForm
 *   invoiceId="inv_123"
 *   returnUrl={`${window.location.origin}/payment/complete`}
 *   onSuccess={() => console.log("Payment initiated")}
 * />
 */
export const PaymentForm = ({
  invoiceId,
  returnUrl,
  onSuccess,
}: PaymentFormProps) => {
  const { data, isLoading, error } = useStripePaymentIntent({
    invoiceId,
    enable: true,
  });

  if (isLoading) {
    return <SkeletonLoader className="h-48" />;
  }

  if (error) {
    return <Alert type="danger">{error}</Alert>;
  }

  if (!data?.client_secret) {
    return <Alert type="danger">Unable to initialize payment</Alert>;
  }

  return (
    <Elements
      stripe={stripePromise()}
      options={{
        clientSecret: data.client_secret,
        // Optional: customize appearance
        // appearance: {
        //   theme: 'stripe',
        //   variables: {
        //     colorPrimary: '#0066cc',
        //   },
        // },
      }}
    >
      <PaymentFormInner returnUrl={returnUrl} onSuccess={onSuccess} />
    </Elements>
  );
};

export default PaymentForm;
