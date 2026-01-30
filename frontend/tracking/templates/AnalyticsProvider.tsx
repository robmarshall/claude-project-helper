import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "./PostHogProvider";

/**
 * Centralized analytics provider that aggregates multiple analytics platforms.
 *
 * This pattern allows you to:
 * - Send events to multiple platforms (PostHog, Google Analytics, etc.)
 * - Abstract analytics implementation from components
 * - Centralize error handling for all analytics calls
 * - Easily add/remove platforms without changing component code
 */

interface IdentifyParams {
  userId: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}

interface AnalyticsContextValue {
  /** Track a custom event across all platforms */
  trackEvent: (name: string, properties?: Record<string, unknown>) => void;
  /** Identify user across all platforms */
  identifyUser: (params: IdentifyParams) => void;
  /** Reset user identity across all platforms (call on logout) */
  resetUser: () => void;
  /** Track page view across all platforms */
  trackPageView: (pageName?: string) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

/**
 * Hook to access analytics functions.
 *
 * @example
 * ```tsx
 * const { trackEvent, identifyUser } = useAnalytics();
 *
 * trackEvent("button_clicked", { button: "submit" });
 * ```
 */
export const useAnalytics = (): AnalyticsContextValue => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within AnalyticsProvider");
  }
  return context;
};

interface AnalyticsProviderProps {
  children: ReactNode;
}

/**
 * Analytics provider that wraps your app and provides tracking functions.
 *
 * Supports multiple analytics platforms:
 * - PostHog (primary)
 * - Google Analytics (optional, via gtag)
 * - Add more platforms as needed
 *
 * Usage:
 * ```tsx
 * <QueryClientProvider client={queryClient}>
 *   <AnalyticsProvider>
 *     <AuthProvider>
 *       <RouterProvider router={router} />
 *     </AuthProvider>
 *   </AnalyticsProvider>
 * </QueryClientProvider>
 * ```
 */
export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => {
  const trackEvent = useCallback(
    (name: string, properties?: Record<string, unknown>) => {
      try {
        // PostHog
        posthog.capture(name, properties);

        // Google Analytics (if configured)
        if (window.gtag) {
          window.gtag("event", name, properties);
        }

        // Add additional platforms here:
        // - Mixpanel: mixpanel.track(name, properties)
        // - Amplitude: amplitude.logEvent(name, properties)
        // - Segment: analytics.track(name, properties)
      } catch (error) {
        // Never let analytics crash the app
        console.error("[Analytics] Error tracking event:", error);
      }
    },
    []
  );

  const identifyUser = useCallback(
    ({ userId, email, name, ...rest }: IdentifyParams) => {
      try {
        // PostHog
        posthog.identify(userId, {
          email,
          name,
          ...rest,
        });

        // Google Analytics (if configured)
        const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
        if (window.gtag && gaId) {
          window.gtag("config", gaId, {
            user_id: userId,
          });
        }

        // Add additional platforms here:
        // - Mixpanel: mixpanel.identify(userId); mixpanel.people.set({ email, name, ...rest })
        // - Amplitude: amplitude.setUserId(userId); amplitude.setUserProperties({ email, name, ...rest })
        // - Sentry: Sentry.setUser({ id: userId, email, username: name })
      } catch (error) {
        console.error("[Analytics] Error identifying user:", error);
      }
    },
    []
  );

  const resetUser = useCallback(() => {
    try {
      // PostHog
      posthog.reset();

      // Add additional platforms here:
      // - Mixpanel: mixpanel.reset()
      // - Amplitude: amplitude.reset()
      // - Sentry: Sentry.setUser(null)
    } catch (error) {
      console.error("[Analytics] Error resetting user:", error);
    }
  }, []);

  const trackPageView = useCallback((pageName?: string) => {
    try {
      // PostHog
      posthog.capture("$pageview", {
        ...(pageName && { page: pageName }),
        $current_url: window.location.href,
      });

      // Google Analytics (if configured)
      const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
      if (window.gtag && gaId) {
        window.gtag("config", gaId, {
          page_path: window.location.pathname,
          page_title: pageName || document.title,
        });
      }
    } catch (error) {
      console.error("[Analytics] Error tracking page view:", error);
    }
  }, []);

  return (
    <PostHogProvider>
      <AnalyticsContext.Provider
        value={{ trackEvent, identifyUser, resetUser, trackPageView }}
      >
        {children}
      </AnalyticsContext.Provider>
    </PostHogProvider>
  );
};

// Type declaration for gtag (add to your types/gtag.d.ts)
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
