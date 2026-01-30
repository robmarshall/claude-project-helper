// components/Stripe/SetupIntentFeedback.tsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useStripePromise } from "~/hooks/stripe/useStripePromise";
import { Alert } from "~/components/Alert";
import { SkeletonLoader } from "~/atoms/SkeletonLoader";

type MessageType = "success" | "processing" | "failed";

interface SetupIntentFeedbackProps {
  /** Callback when setup is confirmed successful */
  onSuccess?: () => void;
  /** Callback when setup fails */
  onError?: (message: string) => void;
}

/**
 * Displays the result of a setup intent after redirect
 *
 * Place this component on the page users are redirected to after
 * completing the SetupPaymentMethod form. It reads the setup_intent_client_secret
 * from URL params and displays the result.
 *
 * @example
 * // On /payment-methods/confirm page
 * <SetupIntentFeedback
 *   onSuccess={() => refetchPaymentMethods()}
 *   onError={(msg) => console.error(msg)}
 * />
 */
export const SetupIntentFeedback = ({
  onSuccess,
  onError,
}: SetupIntentFeedbackProps) => {
  const [searchParams] = useSearchParams();
  const clientSecret = searchParams.get("setup_intent_client_secret");

  const stripe = useStripePromise({ enable: !!clientSecret });
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<MessageType>("processing");

  useEffect(() => {
    if (!stripe || !clientSecret) return;

    stripe.retrieveSetupIntent(clientSecret).then(({ setupIntent }) => {
      switch (setupIntent?.status) {
        case "succeeded":
          setMessage("Success! Your payment method has been saved.");
          setMessageType("success");
          onSuccess?.();
          break;

        case "processing":
          setMessage(
            "Processing payment details. We'll update you when processing is complete."
          );
          setMessageType("processing");
          break;

        case "requires_payment_method":
          setMessage(
            "Failed to process payment details. Please try another payment method."
          );
          setMessageType("failed");
          onError?.("requires_payment_method");
          break;

        case "requires_action":
          setMessage(
            "Additional verification required. Please complete the verification step."
          );
          setMessageType("processing");
          break;

        default:
          setMessage("Something went wrong. Please try again.");
          setMessageType("failed");
          onError?.("unknown_status");
      }
    });
  }, [stripe, clientSecret, onSuccess, onError]);

  // No client secret in URL - nothing to show
  if (!clientSecret) {
    return null;
  }

  // Loading stripe or retrieving setup intent
  if (!message) {
    return <SkeletonLoader className="h-12" />;
  }

  const alertType =
    messageType === "success"
      ? "success"
      : messageType === "failed"
        ? "danger"
        : "info";

  return <Alert type={alertType}>{message}</Alert>;
};

export default SetupIntentFeedback;
