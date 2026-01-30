# Stripe Implementation Patterns

Detailed patterns for Stripe integration in React applications.

## Table of Contents

1. [Initialization](#initialization)
2. [Payment Intents (One-Time Payments)](#payment-intents)
3. [Setup Intents (Save Payment Methods)](#setup-intents)
4. [Subscriptions](#subscriptions)
5. [Stripe Connect (Merchant Onboarding)](#stripe-connect)
6. [Error Handling](#error-handling)
7. [Customer Portal](#customer-portal)
8. [Backend API Endpoints](#backend-api-endpoints)

---

## Initialization

### Stripe Promise

The Stripe instance must be loaded asynchronously. Create a singleton to avoid multiple loads.

```typescript
// lib/stripe/stripePromise.ts
import { loadStripe, Stripe } from "@stripe/stripe-js";

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Basic stripe promise (for your platform)
const stripePromise = (): Promise<Stripe | null> =>
  loadStripe(STRIPE_PUBLISHABLE_KEY);

// With connected account (for payments to merchants)
export const stripePromiseWithAccount = (
  stripeAccountId: string
): Promise<Stripe | null> =>
  loadStripe(STRIPE_PUBLISHABLE_KEY, {
    stripeAccount: stripeAccountId,
  });

export default stripePromise;
```

### Stripe Promise Hook

Manage Stripe instance with React state for conditional loading.

```typescript
// hooks/stripe/useStripePromise.ts
import { useEffect, useRef, useState } from "react";
import { Stripe } from "@stripe/stripe-js";
import stripePromise, { stripePromiseWithAccount } from "~/lib/stripe/stripePromise";

export const useStripePromise = ({ enable = false }): Stripe | null => {
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
```

---

## Payment Intents

For processing one-time payments.

### Payment Intent Hook

```typescript
// hooks/stripe/useStripePaymentIntent.ts
import { useState, useEffect } from "react";
import { rest } from "~/lib/api/rest";

interface PaymentIntentResponse {
  client_secret: string;
  payment_intent: string;
}

interface UseStripePaymentIntentProps {
  invoiceId: string;
  paymentMethodId?: string;
  enable?: boolean;
}

export const useStripePaymentIntent = ({
  invoiceId,
  paymentMethodId,
  enable = true,
}: UseStripePaymentIntentProps) => {
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
          { invoice: invoiceId, paymentMethod: paymentMethodId }
        );
        setData(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create payment intent");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [invoiceId, paymentMethodId, enable]);

  return { data, isLoading, error };
};
```

### Payment Form Component

```typescript
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
  invoiceId: string;
  returnUrl: string;
  onSuccess?: () => void;
}

// Inner component (must be inside Elements provider)
const PaymentFormInner = ({ returnUrl }: { returnUrl: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    // Validate form
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setErrorMessage(submitError.message ?? "An error occurred");
      setIsProcessing(false);
      return;
    }

    // Confirm payment
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    // Only reaches here if redirect fails
    if (error) {
      setErrorMessage(error.message ?? "An error occurred");
    }
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />

      {errorMessage && (
        <Alert type="danger" className="mt-4">
          {errorMessage}
        </Alert>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        isLoading={isProcessing}
        className="mt-4 w-full"
      >
        Pay Now
      </Button>
    </form>
  );
};

// Main component with Elements wrapper
export const PaymentForm = ({
  invoiceId,
  returnUrl,
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
      options={{ clientSecret: data.client_secret }}
    >
      <PaymentFormInner returnUrl={returnUrl} />
    </Elements>
  );
};
```

---

## Setup Intents

For saving payment methods without charging immediately.

### Setup Intent Hook

```typescript
// hooks/stripe/useStripeSetupIntent.ts
import { useState, useEffect } from "react";
import { rest } from "~/lib/api/rest";

interface SetupIntentResponse {
  client_secret: string;
  setup_intent: string;
}

export const useStripeSetupIntent = ({ enable = false }) => {
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
        setError(err instanceof Error ? err.message : "Failed to create setup intent");
      } finally {
        setIsLoading(false);
      }
    };

    createSetupIntent();
  }, [enable]);

  return { setupIntent, isLoading, error };
};
```

### Setup Payment Method Form

```typescript
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
  returnUrl: string;
  onCancel?: () => void;
}

// Inner component
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

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage(null);

    // Validate form
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setErrorMessage(submitError.message ?? "An error occurred");
      setIsProcessing(false);
      return;
    }

    // Confirm setup
    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    if (error) {
      setErrorMessage(error.message ?? "An unexpected error occurred");
    }
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Billing address */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Billing Address
        </label>
        <AddressElement options={{ mode: "billing" }} />
      </div>

      {/* Payment method */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Payment Method
        </label>
        <PaymentElement
          options={{
            fields: {
              billingDetails: {
                name: "never", // Already collected in AddressElement
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

// Main component
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
      options={{ clientSecret: setupIntent }}
    >
      <SetupPaymentMethodInner returnUrl={returnUrl} onCancel={onCancel} />
    </Elements>
  );
};
```

### Setup Intent Feedback (After Redirect)

```typescript
// components/Stripe/SetupIntentFeedback.tsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useStripePromise } from "~/hooks/stripe/useStripePromise";
import { Alert } from "~/components/Alert";
import { SkeletonLoader } from "~/atoms/SkeletonLoader";

type MessageType = "success" | "processing" | "failed";

export const SetupIntentFeedback = () => {
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
          break;
        case "processing":
          setMessage("Processing payment details. We'll update you shortly.");
          setMessageType("processing");
          break;
        case "requires_payment_method":
          setMessage("Failed to process. Please try another payment method.");
          setMessageType("failed");
          break;
        default:
          setMessage("Something went wrong. Please try again.");
          setMessageType("failed");
      }
    });
  }, [stripe, clientSecret]);

  if (!clientSecret) {
    return null;
  }

  if (!message) {
    return <SkeletonLoader className="h-12" />;
  }

  const alertType = messageType === "success" ? "success" : messageType === "failed" ? "danger" : "info";

  return <Alert type={alertType}>{message}</Alert>;
};
```

---

## Subscriptions

Using Stripe's Embedded Checkout for subscription purchases.

### Subscription Checkout Hook

```typescript
// hooks/stripe/useCreateSubscriptionCheckout.ts
import { useState } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { rest } from "~/lib/api/rest";

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Module-level singleton for stripe instance
let stripePromise: Promise<Stripe | null> | null = null;
const getStripePromise = () => {
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

interface CreateCheckoutParams {
  organizationId: string;
  priceId: string;
  redirectPath?: string;
}

interface CheckoutSessionResponse {
  clientSecret: string;
}

export const useCreateSubscriptionCheckout = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFetchClientSecret = ({
    organizationId,
    priceId,
    redirectPath,
  }: CreateCheckoutParams) => {
    return async (): Promise<string> => {
      setIsLoading(true);
      setError(null);

      try {
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
        const message = err instanceof Error ? err.message : "Failed to create checkout";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    };
  };

  return {
    stripePromise: getStripePromise(),
    isStripeConfigured: !!STRIPE_PUBLISHABLE_KEY,
    createFetchClientSecret,
    isLoading,
    error,
  };
};
```

### Embedded Checkout Component

```typescript
// components/Stripe/SubscriptionCheckout.tsx
import { useEffect } from "react";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { useCreateSubscriptionCheckout } from "~/hooks/stripe/useCreateSubscriptionCheckout";
import { SkeletonLoader } from "~/atoms/SkeletonLoader";
import { Alert } from "~/components/Alert";

interface SubscriptionCheckoutProps {
  organizationId: string;
  priceId: string;
  redirectPath?: string;
  onError?: (message: string) => void;
}

export const SubscriptionCheckout = ({
  organizationId,
  priceId,
  redirectPath,
  onError,
}: SubscriptionCheckoutProps) => {
  const {
    stripePromise,
    isStripeConfigured,
    createFetchClientSecret,
    error,
  } = useCreateSubscriptionCheckout();

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

  if (!stripePromise) {
    return <SkeletonLoader className="h-96" />;
  }

  const fetchClientSecret = createFetchClientSecret({
    organizationId,
    priceId,
    redirectPath,
  });

  return (
    <EmbeddedCheckoutProvider
      stripe={stripePromise}
      options={{ fetchClientSecret }}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
};
```

### Subscription Return Handler

```typescript
// pages/StripeReturn.tsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { rest } from "~/lib/api/rest";
import { SkeletonLoader } from "~/atoms/SkeletonLoader";
import { Alert } from "~/components/Alert";

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
      // Invalidate cached data
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["users", "current"] });

      // Redirect after sync
      navigate(redirectPath, { replace: true });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to verify subscription");
    },
  });

  useEffect(() => {
    if (sessionId) {
      syncMutation.mutate(sessionId);
    } else {
      setError("No session found");
    }
  }, [sessionId]);

  if (error) {
    return (
      <div className="p-8">
        <Alert type="danger">{error}</Alert>
      </div>
    );
  }

  return (
    <div className="p-8">
      <SkeletonLoader className="h-32" />
      <p className="text-center mt-4 text-gray-600">
        Verifying your subscription...
      </p>
    </div>
  );
};
```

---

## Stripe Connect

For merchant/vendor onboarding.

### Connect Instance Hook

```typescript
// hooks/stripe/useStripeConnectInstance.ts
import { useState, useEffect } from "react";
import { loadConnectAndInitialize } from "@stripe/connect-js/pure";
import type { StripeConnectInstance } from "@stripe/connect-js";
import { rest } from "~/lib/api/rest";

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

interface AccountSessionResponse {
  clientSecret: string;
}

export const useStripeConnectInstance = ({
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
        });

        setStripeConnectInstance(instance);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize Stripe Connect");
      } finally {
        setIsLoading(false);
      }
    };

    initializeConnect();
  }, [accountId]);

  return { stripeConnectInstance, isLoading, error };
};
```

### Connect Onboarding Component

```typescript
// components/Stripe/ConnectOnboarding.tsx
import { useNavigate } from "react-router-dom";
import {
  ConnectComponentsProvider,
  ConnectAccountOnboarding,
} from "@stripe/react-connect-js";
import { useStripeConnectInstance } from "~/hooks/stripe/useStripeConnectInstance";
import { SkeletonLoader } from "~/atoms/SkeletonLoader";
import { Alert } from "~/components/Alert";

interface ConnectOnboardingProps {
  accountId: string;
  returnPath: string;
}

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
      />
    </ConnectComponentsProvider>
  );
};
```

---

## Error Handling

### Element-Level Errors

```typescript
// After form validation
const { error: submitError } = await elements.submit();
if (submitError) {
  setErrorMessage(submitError.message ?? "An error occurred");
  return;
}

// After payment/setup confirmation
const { error } = await stripe.confirmPayment({ ... });
if (error) {
  // Card declined, insufficient funds, etc.
  setErrorMessage(error.message ?? "An error occurred");
}
```

### Setup Intent Status Handling

```typescript
switch (setupIntent?.status) {
  case "succeeded":
    // Payment method saved successfully
    break;
  case "processing":
    // Still processing (bank transfers, etc.)
    break;
  case "requires_payment_method":
    // Failed - user needs to try again
    break;
  case "requires_action":
    // Additional authentication needed
    break;
}
```

### Error Boundary Wrapper

Wrap Stripe components in error boundaries for graceful failures:

```typescript
<ErrorBoundary boundaryName="StripePayment" fallbackMode="detailed">
  <Elements stripe={stripePromise} options={options}>
    <PaymentFormInner />
  </Elements>
</ErrorBoundary>
```

---

## Customer Portal

For subscription management (upgrades, cancellations, billing history).

### Customer Portal Hook

```typescript
// hooks/stripe/useCustomerPortal.ts
import { useMutation } from "@tanstack/react-query";
import { rest } from "~/lib/api/rest";

interface PortalSessionResponse {
  url: string;
}

interface CreatePortalParams {
  organizationId: string;
  returnUrl?: string;
}

export const useCustomerPortal = () => {
  return useMutation({
    mutationFn: async ({ organizationId, returnUrl }: CreatePortalParams) => {
      const response = await rest.post<PortalSessionResponse>(
        "/api/stripe/customer-portal-session",
        {
          organization: organizationId,
          returnUrl: returnUrl || window.location.href,
        }
      );
      return response;
    },
    onSuccess: (data) => {
      // Open portal in new window
      window.open(data.url, "_blank");
    },
  });
};
```

### Customer Portal Button

```typescript
// components/Stripe/CustomerPortalButton.tsx
import { useCustomerPortal } from "~/hooks/stripe/useCustomerPortal";
import { Button } from "~/atoms/buttons/Button";

interface CustomerPortalButtonProps {
  organizationId: string;
  returnUrl?: string;
}

export const CustomerPortalButton = ({
  organizationId,
  returnUrl,
}: CustomerPortalButtonProps) => {
  const { mutate, isPending } = useCustomerPortal();

  return (
    <Button
      variant="secondary"
      onClick={() => mutate({ organizationId, returnUrl })}
      isLoading={isPending}
    >
      Manage Subscription
    </Button>
  );
};
```

---

## Backend API Endpoints

Your backend needs these endpoints:

### Payment Intents

```
POST /api/stripe/payment-intents
Body: { invoice: string, paymentMethod?: string }
Response: { client_secret: string, payment_intent: string }
```

### Setup Intents

```
POST /api/stripe/setup-intents
Body: {}
Response: { client_secret: string, setup_intent: string }
```

### Subscription Checkout

```
POST /api/stripe/subscription-checkout-session
Body: { organization: string, price: string, returnUrl: string }
Response: { clientSecret: string }
```

### Subscription Sync

```
POST /api/stripe/subscription-checkout-session/sync
Body: { checkoutSession: string }
Response: { success: boolean }
```

### Customer Portal

```
POST /api/stripe/customer-portal-session
Body: { organization: string, returnUrl: string }
Response: { url: string }
```

### Account Sessions (Connect)

```
POST /api/stripe/account-sessions
Body: { account: string }
Response: { clientSecret: string }
```

---

## Loading State Patterns

All Stripe components should follow this pattern:

```typescript
// Loading state
if (isLoading) {
  return <SkeletonLoader className="h-48" />;
}

// Error state
if (error) {
  return <Alert type="danger">{error}</Alert>;
}

// Configuration error
if (!isConfigured) {
  return <Alert type="danger">Payment system unavailable</Alert>;
}

// Ready state
return (
  <Elements stripe={stripePromise} options={{ clientSecret }}>
    <FormComponent />
  </Elements>
);
```

---

## Testing Stripe

### Test Card Numbers

| Card Number | Result |
|-------------|--------|
| 4242424242424242 | Success |
| 4000000000000002 | Declined |
| 4000002500003155 | Requires 3DS |
| 4000000000009995 | Insufficient funds |

### Test Bank Accounts (ACH)

| Routing | Account | Result |
|---------|---------|--------|
| 110000000 | 000123456789 | Success |
| 110000000 | 000111111116 | Failure |

Use any future expiration date and any 3-digit CVC.
