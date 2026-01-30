// components/Stripe/SetupPaymentMethod.tsx
import { useState } from "react";
import {
  Elements,
  PaymentElement,
  AddressElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import stripePromise from "~/lib/stripe/stripePromise";
import { useStripeSetupIntent } from "~/hooks/stripe/useStripeSetupIntent";
import { Button } from "~/atoms/buttons/Button";
import { SkeletonLoader } from "~/atoms/SkeletonLoader";
import { Alert } from "~/components/Alert";

interface SetupPaymentMethodProps {
  /** URL to redirect to after setup */
  returnUrl: string;
  /** Optional cancel handler */
  onCancel?: () => void;
}

/**
 * Inner form component - must be inside Elements provider
 */
const SetupPaymentMethodInner = ({
  returnUrl,
  onCancel,
}: {
  returnUrl: string;
  onCancel?: () => void;
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

    // Confirm the setup intent
    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    // This point is only reached if there's an immediate error
    if (error) {
      setErrorMessage(error.message ?? "An unexpected error occurred");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Billing address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Billing Address
        </label>
        <AddressElement options={{ mode: "billing" }} />
      </div>

      {/* Payment method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        <PaymentElement
          options={{
            fields: {
              billingDetails: {
                // Don't collect address again - we got it from AddressElement
                name: "never",
                address: "never",
              },
            },
          }}
        />
      </div>

      {errorMessage && <Alert type="danger">{errorMessage}</Alert>}

      <div className="flex gap-3">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={!stripe || isProcessing}
          isLoading={isProcessing}
          className="flex-1"
        >
          Save Payment Method
        </Button>
      </div>
    </form>
  );
};

/**
 * Setup payment method form with Stripe Elements
 *
 * Saves a payment method for future use without charging immediately.
 * Collects billing address and payment details.
 *
 * After submission, the user is redirected to returnUrl with:
 * - setup_intent_client_secret (to verify the result)
 * - setup_intent (the setup intent ID)
 *
 * @example
 * <SetupPaymentMethod
 *   returnUrl={`${window.location.origin}/payment-methods/confirm`}
 *   onCancel={() => closeDrawer()}
 * />
 */
export const SetupPaymentMethod = ({
  returnUrl,
  onCancel,
}: SetupPaymentMethodProps) => {
  const { setupIntent, isLoading, error } = useStripeSetupIntent({
    enable: true,
  });

  if (isLoading) {
    return <SkeletonLoader className="h-64" />;
  }

  if (error) {
    return <Alert type="danger">{error}</Alert>;
  }

  if (!setupIntent) {
    return <Alert type="danger">Unable to initialize payment setup</Alert>;
  }

  return (
    <Elements
      stripe={stripePromise()}
      options={{
        clientSecret: setupIntent,
        // Optional: customize appearance
        // appearance: {
        //   theme: 'stripe',
        // },
      }}
    >
      <SetupPaymentMethodInner returnUrl={returnUrl} onCancel={onCancel} />
    </Elements>
  );
};

export default SetupPaymentMethod;
