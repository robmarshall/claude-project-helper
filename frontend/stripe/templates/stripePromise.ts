// lib/stripe/stripePromise.ts
import { loadStripe, Stripe } from "@stripe/stripe-js";

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

/**
 * Load Stripe instance with connected account
 * Use for payments that go to a connected merchant account
 */
export const stripePromiseWithAccount = (
  stripeAccountId: string
): Promise<Stripe | null> =>
  loadStripe(STRIPE_PUBLISHABLE_KEY, {
    stripeAccount: stripeAccountId,
  });

/**
 * Load basic Stripe instance
 * Use for platform payments and subscriptions
 */
const stripePromise = (): Promise<Stripe | null> =>
  loadStripe(STRIPE_PUBLISHABLE_KEY);

export default stripePromise;
