# Analytics & Tracking Quick Reference

## BEFORE YOU START

Check user's project:
1. Is `posthog-js` installed? → `npm install posthog-js`
2. Is PostHog API key configured? → Add `VITE_POSTHOG_KEY` to env
3. Is there an existing analytics setup? → Follow their patterns instead
4. Where is the provider hierarchy? → Analytics should wrap app components

## SETUP

```tsx
// App.tsx or main.tsx
import { AnalyticsProvider } from "~/providers/AnalyticsProvider";

export default function App({ children }) {
  return (
    <AnalyticsProvider>
      {children}
    </AnalyticsProvider>
  );
}
```

## TEMPLATES

All templates are in the `templates/` subdirectory.

| File | Purpose | When to use |
|------|---------|-------------|
| PostHogProvider.tsx | PostHog initialization & React context | Copy first, foundation |
| analytics.ts | Core tracking functions (identify, track) | Copy after PostHogProvider |
| AnalyticsProvider.tsx | Unified analytics layer | Copy for multi-platform tracking |
| tracking.ts | Domain-specific tracking utilities | Copy after analytics.ts |

## ENVIRONMENT VARIABLES

```env
# Required
VITE_POSTHOG_KEY=phc_...
VITE_POSTHOG_HOST=https://us.i.posthog.com  # or eu.i.posthog.com

# Optional - for multi-platform
VITE_GA_MEASUREMENT_ID=G-...
```

## CORE PATTERN

```
┌──────────────────────────────────────────────────────┐
│ Component Layer                                       │
│ trackSignUp(), trackLogin(), trackBeginCheckout()    │
├──────────────────────────────────────────────────────┤
│ Domain Tracking Layer                                 │
│ tracking.ts - business event functions               │
├──────────────────────────────────────────────────────┤
│ Core Analytics Layer                                  │
│ analytics.ts - identifyUser(), trackEvent()          │
├──────────────────────────────────────────────────────┤
│ Provider Layer                                        │
│ AnalyticsProvider → PostHogProvider                  │
└──────────────────────────────────────────────────────┘
```

## QUICK EXAMPLES

### Identify User (on login/session restore)
```tsx
import { identifyUser } from "~/lib/analytics";

// After successful login
identifyUser({
  userId: user.id,
  email: user.email,
  name: user.name,
  // Add any user properties relevant to analytics
});
```

### Track Event
```tsx
import { trackEvent } from "~/lib/analytics";

// Generic event
trackEvent("button_clicked", { buttonName: "submit", page: "checkout" });
```

### Domain-Specific Tracking
```tsx
import { trackSignUp, trackBeginCheckout } from "~/lib/tracking";

// Registration complete
trackSignUp({ method: "email", referralSource: "google" });

// User starts checkout
trackBeginCheckout({ planId: "pro", value: 29.99 });
```

### Page View Tracking
```tsx
import { useEffect } from "react";
import posthog from "posthog-js";

// In route component or layout
useEffect(() => {
  posthog.capture("$pageview");
}, []);
```

## PROVIDER HIERARCHY

Recommended order in your app:
```tsx
<QueryClientProvider>      {/* Data fetching */}
  <AnalyticsProvider>      {/* Tracking */}
    <AuthProvider>         {/* Auth state */}
      <RouterProvider />   {/* Routes */}
    </AuthProvider>
  </AnalyticsProvider>
</QueryClientProvider>
```

## CORE RULES

1. **Environment-based activation**: Only initialize when API key is present
2. **Error isolation**: Wrap all tracking calls in try-catch
3. **Identify on auth events**: Call `identifyUser()` on login, token refresh, session restore
4. **Reset on logout**: Call `posthog.reset()` to clear user identity
5. **No PII in events**: Don't track passwords, tokens, or sensitive data

## FEATURE FLAGS

```tsx
import posthog from "posthog-js";

// Check feature flag
if (posthog.isFeatureEnabled("new-checkout-flow")) {
  // Show new checkout
}

// Get flag payload
const variant = posthog.getFeatureFlag("pricing-experiment");
```

## IMPLEMENTATION CHECKLIST

1. [ ] Add `posthog-js` package
2. [ ] Add environment variables (VITE_POSTHOG_KEY, VITE_POSTHOG_HOST)
3. [ ] Add `PostHogProvider.tsx` wrapper
4. [ ] Add `analytics.ts` with core functions
5. [ ] Add `AnalyticsProvider.tsx` for unified interface
6. [ ] Add `tracking.ts` with domain events
7. [ ] Wrap app with AnalyticsProvider
8. [ ] Call `identifyUser()` in auth flow
9. [ ] Add tracking calls to key user actions
10. [ ] Add `posthog.reset()` to logout flow

## DEEP DIVE

See `posthog-patterns.md` for:
- Multi-platform analytics (PostHog + GA + Sentry)
- User identification lifecycle
- Feature flag patterns
- Error isolation strategies
- Page view auto-capture configuration
