// hooks/stripe/useStripePromise.ts
import { useEffect, useRef, useState } from "react";
import { Stripe } from "@stripe/stripe-js";
import stripePromise, {
  stripePromiseWithAccount,
} from "~/lib/stripe/stripePromise";

/**
 * Hook to manage Stripe instance with conditional loading
 * Use when you need to delay Stripe loading until certain conditions are met
 */
export const useStripePromise = ({
  enable = false,
}: {
  enable?: boolean;
}): Stripe | null => {
  const stripeRef = useRef<Stripe | null>(null);
  const [stripe, setStripe] = useState<Stripe | null>(null);

  useEffect(() => {
    if (!enable || stripeRef.current) return;

    stripePromise().then((stripeInstance) => {
      stripeRef.current = stripeInstance;
      setStripe(stripeInstance);
    });
  }, [enable]);

  return stripe;
};

/**
 * Hook to manage Stripe instance for connected accounts
 * Use for payments that go to a merchant's Stripe account
 */
export const useStripePromiseWithAccount = ({
  stripeAccountId,
  enable = false,
}: {
  stripeAccountId: string;
  enable?: boolean;
}): Stripe | null => {
  const stripeRef = useRef<Stripe | null>(null);
  const [stripe, setStripe] = useState<Stripe | null>(null);

  useEffect(() => {
    if (!enable || !stripeAccountId || stripeRef.current) return;

    stripePromiseWithAccount(stripeAccountId).then((stripeInstance) => {
      stripeRef.current = stripeInstance;
      setStripe(stripeInstance);
    });
  }, [enable, stripeAccountId]);

  return stripe;
};

export default useStripePromise;
