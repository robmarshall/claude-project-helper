# PostHog Analytics Patterns

Detailed patterns for implementing analytics with PostHog in React applications.

## Environment Configuration

```env
# .env.local or .env
VITE_POSTHOG_KEY=phc_your_project_key
VITE_POSTHOG_HOST=https://us.i.posthog.com

# Optional: Google Analytics for multi-platform
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## PostHog Initialization

### Basic Initialization

```tsx
// lib/posthog.ts
import posthog from "posthog-js";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST;

export const initPostHog = () => {
  if (!POSTHOG_KEY) {
    console.warn("PostHog key not configured");
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Recommended settings
    capture_pageview: false, // Manual control for SPAs
    capture_pageleave: true,
    persistence: "localStorage",
  });
};

export { posthog };
```

### Configuration Options

```tsx
posthog.init(POSTHOG_KEY, {
  api_host: POSTHOG_HOST,

  // Page tracking
  capture_pageview: false,    // false for SPAs (handle manually)
  capture_pageleave: true,    // Track when users leave

  // Session recording (if enabled in PostHog)
  disable_session_recording: false,

  // Autocapture settings
  autocapture: true,          // Auto-track clicks, form submissions

  // Privacy
  persistence: "localStorage", // or "cookie" or "memory"
  disable_persistence: false,

  // Performance
  loaded: (posthog) => {
    // Called when PostHog is ready
    if (import.meta.env.DEV) {
      posthog.debug(); // Enable debug mode in development
    }
  },
});
```

## Provider Pattern

### PostHogProvider Component

```tsx
// providers/PostHogProvider.tsx
import { PostHogProvider as PHProvider } from "posthog-js/react";
import posthog from "posthog-js";
import { useEffect, useState } from "react";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST;

export const PostHogProvider = ({ children }: { children: React.ReactNode }) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!POSTHOG_KEY) {
      console.warn("PostHog key not configured, analytics disabled");
      return;
    }

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false,
      capture_pageleave: true,
    });

    setIsInitialized(true);

    return () => {
      // Cleanup on unmount (rare, but good practice)
      posthog.shutdown?.();
    };
  }, []);

  // Render children even if PostHog fails - analytics shouldn't block app
  if (!POSTHOG_KEY) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
};
```

## AnalyticsProvider Pattern (Multi-Platform)

For apps that send events to multiple analytics platforms:

```tsx
// providers/AnalyticsProvider.tsx
import { createContext, useContext, useCallback, ReactNode } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "./PostHogProvider";

interface AnalyticsContextValue {
  trackEvent: (name: string, properties?: Record<string, unknown>) => void;
  identifyUser: (params: IdentifyParams) => void;
  resetUser: () => void;
}

interface IdentifyParams {
  userId: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within AnalyticsProvider");
  }
  return context;
};

export const AnalyticsProvider = ({ children }: { children: ReactNode }) => {
  const trackEvent = useCallback((name: string, properties?: Record<string, unknown>) => {
    try {
      // PostHog
      posthog.capture(name, properties);

      // Google Analytics (if configured)
      if (window.gtag) {
        window.gtag("event", name, properties);
      }

      // Add other platforms here (Mixpanel, Amplitude, etc.)
    } catch (error) {
      // Never let analytics crash the app
      console.error("Analytics tracking error:", error);
    }
  }, []);

  const identifyUser = useCallback(({ userId, email, name, ...rest }: IdentifyParams) => {
    try {
      // PostHog
      posthog.identify(userId, {
        email,
        name,
        ...rest,
      });

      // Google Analytics
      if (window.gtag) {
        window.gtag("config", import.meta.env.VITE_GA_MEASUREMENT_ID, {
          user_id: userId,
        });
      }
    } catch (error) {
      console.error("Analytics identify error:", error);
    }
  }, []);

  const resetUser = useCallback(() => {
    try {
      posthog.reset();
      // Reset other platforms as needed
    } catch (error) {
      console.error("Analytics reset error:", error);
    }
  }, []);

  return (
    <PostHogProvider>
      <AnalyticsContext.Provider value={{ trackEvent, identifyUser, resetUser }}>
        {children}
      </AnalyticsContext.Provider>
    </PostHogProvider>
  );
};
```

## User Identification Lifecycle

### When to Identify Users

```tsx
// 1. After successful login
const handleLogin = async (credentials) => {
  const user = await login(credentials);
  identifyUser({
    userId: user.id,
    email: user.email,
    name: user.name,
    plan: user.subscription?.plan,
  });
};

// 2. After token refresh (user data may have changed)
const handleTokenRefresh = async () => {
  const user = await refreshToken();
  identifyUser({
    userId: user.id,
    email: user.email,
    // Updated properties
  });
};

// 3. On session restore (app load with existing session)
const handleSessionRestore = async () => {
  const session = await getSession();
  if (session?.user) {
    identifyUser({
      userId: session.user.id,
      email: session.user.email,
    });
  }
};

// 4. On logout - RESET the user
const handleLogout = async () => {
  await logout();
  posthog.reset(); // Clear user identity
};
```

### Integration with Auth Hook

```tsx
// hooks/useAuth.ts
import { useEffect } from "react";
import { useAnalytics } from "~/providers/AnalyticsProvider";

export const useAuth = () => {
  const { identifyUser, resetUser } = useAnalytics();
  const { user, isLoading } = useSession();

  // Identify user when session is loaded
  useEffect(() => {
    if (!isLoading && user) {
      identifyUser({
        userId: user.id,
        email: user.email,
        name: user.name,
      });
    }
  }, [user, isLoading, identifyUser]);

  const logout = async () => {
    await signOut();
    resetUser(); // Clear analytics identity
  };

  return { user, isLoading, logout };
};
```

## Event Tracking Patterns

### Core Tracking Functions

```tsx
// lib/analytics.ts
import posthog from "posthog-js";

export const identifyUser = (params: {
  userId: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}) => {
  try {
    const { userId, ...properties } = params;
    posthog.identify(userId, properties);
  } catch (error) {
    console.error("Failed to identify user:", error);
  }
};

export const trackEvent = (
  eventName: string,
  properties?: Record<string, unknown>
) => {
  try {
    posthog.capture(eventName, properties);
  } catch (error) {
    console.error("Failed to track event:", error);
  }
};

export const trackPageView = (pageName?: string) => {
  try {
    posthog.capture("$pageview", pageName ? { page: pageName } : undefined);
  } catch (error) {
    console.error("Failed to track page view:", error);
  }
};
```

### Domain-Specific Tracking

```tsx
// lib/tracking.ts
import { trackEvent } from "./analytics";

// Authentication events
export const trackSignUp = (params: {
  method: "email" | "google" | "github";
  referralSource?: string;
}) => {
  trackEvent("sign_up", params);
};

export const trackLogin = (params: {
  method: "email" | "google" | "github";
}) => {
  trackEvent("login", params);
};

// E-commerce events
export const trackBeginCheckout = (params: {
  planId: string;
  value: number;
  currency?: string;
}) => {
  trackEvent("begin_checkout", {
    currency: "USD",
    ...params,
  });
};

export const trackPurchase = (params: {
  transactionId: string;
  planId: string;
  value: number;
  currency?: string;
}) => {
  trackEvent("purchase", {
    currency: "USD",
    ...params,
  });
};

// Form engagement
export const trackFormStarted = (params: {
  formName: string;
  formLocation: string;
}) => {
  trackEvent("form_started", params);
};

export const trackFormCompleted = (params: {
  formName: string;
  formLocation: string;
  duration?: number;
}) => {
  trackEvent("form_completed", params);
};

export const trackFormAbandoned = (params: {
  formName: string;
  formLocation: string;
  lastField?: string;
}) => {
  trackEvent("form_abandoned", params);
};

// Feature usage
export const trackFeatureUsed = (params: {
  featureName: string;
  context?: string;
}) => {
  trackEvent("feature_used", params);
};
```

## Page View Tracking in SPAs

### Manual Page View Tracking

```tsx
// In router setup or layout component
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import posthog from "posthog-js";

export const PageViewTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    posthog.capture("$pageview", {
      $current_url: window.location.href,
    });
  }, [location.pathname]);

  return null;
};

// Add to router
<RouterProvider router={router}>
  <PageViewTracker />
</RouterProvider>
```

### Route-Based Tracking

```tsx
// In route component
import { useEffect } from "react";
import { trackPageView } from "~/lib/analytics";

export const DashboardPage = () => {
  useEffect(() => {
    trackPageView("dashboard");
  }, []);

  return <Dashboard />;
};
```

## Feature Flags

### Basic Feature Flag Check

```tsx
import posthog from "posthog-js";

// Boolean flag
if (posthog.isFeatureEnabled("new-dashboard")) {
  return <NewDashboard />;
}
return <OldDashboard />;
```

### Feature Flag with Variants

```tsx
import posthog from "posthog-js";

const pricingVariant = posthog.getFeatureFlag("pricing-experiment");

switch (pricingVariant) {
  case "control":
    return <PricingA />;
  case "variant-a":
    return <PricingB />;
  case "variant-b":
    return <PricingC />;
  default:
    return <PricingA />; // Fallback
}
```

### React Hook for Feature Flags

```tsx
import { useFeatureFlagEnabled, useFeatureFlagVariantKey } from "posthog-js/react";

export const FeatureComponent = () => {
  const isEnabled = useFeatureFlagEnabled("new-feature");
  const variant = useFeatureFlagVariantKey("experiment-name");

  if (!isEnabled) return null;

  return <div>Feature variant: {variant}</div>;
};
```

## Error Isolation

Always wrap analytics code to prevent app crashes:

```tsx
// Safe tracking wrapper
const safeTrack = <T extends (...args: unknown[]) => void>(fn: T) => {
  return (...args: Parameters<T>) => {
    try {
      fn(...args);
    } catch (error) {
      // Log but don't throw
      console.error("Analytics error:", error);

      // Optionally report to error tracking
      // Sentry.captureException(error);
    }
  };
};

// Usage
export const trackEvent = safeTrack((name: string, props?: Record<string, unknown>) => {
  posthog.capture(name, props);
});
```

## TypeScript Declarations

For Google Analytics gtag:

```tsx
// types/gtag.d.ts
declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "set",
      targetId: string,
      params?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

export {};
```

## Testing

### Mocking PostHog in Tests

```tsx
// test/setup.ts or __mocks__/posthog-js.ts
const posthogMock = {
  init: jest.fn(),
  identify: jest.fn(),
  capture: jest.fn(),
  reset: jest.fn(),
  isFeatureEnabled: jest.fn().mockReturnValue(false),
  getFeatureFlag: jest.fn().mockReturnValue(null),
};

jest.mock("posthog-js", () => posthogMock);

export { posthogMock };
```

### Testing Tracking Calls

```tsx
import { posthogMock } from "./setup";
import { trackSignUp } from "~/lib/tracking";

describe("tracking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("tracks sign up event", () => {
    trackSignUp({ method: "email" });

    expect(posthogMock.capture).toHaveBeenCalledWith("sign_up", {
      method: "email",
    });
  });
});
```

## Debug Mode

Enable debug mode to see all events in the console:

```tsx
// Only in development
if (import.meta.env.DEV) {
  posthog.debug();
}
```

This logs all captured events, identify calls, and feature flag evaluations to the console.
