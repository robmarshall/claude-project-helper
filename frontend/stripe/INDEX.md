# Stripe Integration Patterns

React patterns for integrating Stripe payments, subscriptions, and merchant onboarding.

## Quick Reference

| Need | File | Description |
|------|------|-------------|
| Overview & setup | This file | Dependencies, initialization |
| Full patterns | stripe-patterns.md | Detailed implementation guides |
| Stripe initialization | templates/stripePromise.ts | Load Stripe instance |
| Payment form | templates/PaymentForm.tsx | PaymentElement wrapper |
| Setup intent form | templates/SetupPaymentMethod.tsx | Save payment methods |
| Subscription checkout | templates/SubscriptionCheckout.tsx | EmbeddedCheckout wrapper |
| Payment intent hook | templates/useStripePaymentIntent.ts | Create/fetch payment intents |
| Setup intent hook | templates/useStripeSetupIntent.ts | Create setup intents |
| Stripe promise hook | templates/useStripePromise.ts | Manage Stripe instance |
| Connect onboarding | templates/ConnectOnboarding.tsx | Merchant onboarding |

## Dependencies

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
# For Stripe Connect (merchant onboarding):
npm install @stripe/connect-js @stripe/react-connect-js
```

## Environment Variables

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Package Purposes

| Package | Purpose |
|---------|---------|
| `@stripe/stripe-js` | Core Stripe JS library, `loadStripe()` function |
| `@stripe/react-stripe-js` | React hooks (`useStripe`, `useElements`) and components |
| `@stripe/connect-js` | Stripe Connect for merchant onboarding |
| `@stripe/react-connect-js` | React bindings for Connect components |

## Key Concepts

### Payment Intents vs Setup Intents

- **Payment Intent**: Process a one-time payment immediately
- **Setup Intent**: Save a payment method for future use (no charge now)

### Stripe Elements

Pre-built UI components for collecting payment information:
- `PaymentElement` - Unified payment method form (cards, wallets, etc.)
- `AddressElement` - Billing/shipping address collection
- `CardElement` - Card-only input (legacy, prefer PaymentElement)

### Flow Types

1. **Direct Payment**: Collect payment method → Confirm payment → Done
2. **Setup for Later**: Collect payment method → Confirm setup → Save method
3. **Subscription**: Create checkout session → EmbeddedCheckout → Webhook

## Basic Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    YOUR REACT APP                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  INITIALIZATION                                          │
│  └─ stripePromise.ts: loadStripe(publishableKey)        │
│                                                          │
│  PAYMENT FLOWS                                           │
│  ├─ PaymentForm: <Elements> + <PaymentElement>          │
│  ├─ SetupForm: <Elements> + <AddressElement> + <PE>     │
│  └─ Subscription: <EmbeddedCheckoutProvider>            │
│                                                          │
│  HOOKS                                                   │
│  ├─ useStripePromise: Manage Stripe instance            │
│  ├─ useStripePaymentIntent: Fetch payment intents       │
│  └─ useStripeSetupIntent: Create setup intents          │
│                                                          │
│  CONNECT (Merchants)                                     │
│  └─ ConnectOnboarding: <ConnectAccountOnboarding>       │
│                                                          │
└─────────────────────────────────────────────────────────┘
            │                    │
            ▼                    ▼
    ┌───────────────┐    ┌───────────────┐
    │  Your Backend │    │    Stripe     │
    │  API Routes   │    │    Servers    │
    └───────────────┘    └───────────────┘
```

## Implementation Checklist

### One-Time Payments

1. [ ] Add `stripePromise.ts` initialization
2. [ ] Create backend endpoint for payment intents
3. [ ] Add `useStripePaymentIntent` hook
4. [ ] Create `PaymentForm` component with `<Elements>` and `<PaymentElement>`
5. [ ] Handle payment confirmation and errors
6. [ ] Add return URL handling for redirects

### Saving Payment Methods

1. [ ] Add `stripePromise.ts` initialization
2. [ ] Create backend endpoint for setup intents
3. [ ] Add `useStripeSetupIntent` hook
4. [ ] Create form with `<AddressElement>` and `<PaymentElement>`
5. [ ] Handle setup confirmation
6. [ ] Add feedback/status UI after redirect

### Subscriptions

1. [ ] Add `stripePromise.ts` initialization
2. [ ] Create backend endpoint for checkout sessions
3. [ ] Add `useCreateSubscriptionCheckout` hook
4. [ ] Create `<EmbeddedCheckout>` wrapper component
5. [ ] Handle return URL and verify subscription
6. [ ] Add customer portal integration for management

### Stripe Connect (Merchants)

1. [ ] Install Connect packages
2. [ ] Create backend endpoint for account sessions
3. [ ] Add `useStripeConnectInstance` hook
4. [ ] Create onboarding component with `<ConnectAccountOnboarding>`
5. [ ] Handle onboarding completion

## See Also

- [stripe-patterns.md](./stripe-patterns.md) - Detailed implementation patterns
- [templates/](./templates/) - Copy-paste ready code
