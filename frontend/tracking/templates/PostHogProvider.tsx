import { PostHogProvider as PHProvider } from "posthog-js/react";
import posthog from "posthog-js";
import { useEffect, useState, type ReactNode } from "react";

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com";

interface PostHogProviderProps {
  children: ReactNode;
}

/**
 * PostHog analytics provider component.
 *
 * Initializes PostHog when API key is available.
 * Gracefully degrades when credentials are missing (dev/test environments).
 *
 * Usage:
 * ```tsx
 * <PostHogProvider>
 *   <App />
 * </PostHogProvider>
 * ```
 *
 * Environment variables:
 * - VITE_POSTHOG_KEY: Your PostHog project API key (required)
 * - VITE_POSTHOG_HOST: PostHog host URL (optional, defaults to US cloud)
 */
export const PostHogProvider = ({ children }: PostHogProviderProps) => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Skip initialization if no API key
    if (!POSTHOG_KEY) {
      if (import.meta.env.DEV) {
        console.warn("[PostHog] API key not configured, analytics disabled");
      }
      return;
    }

    try {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        // Disable automatic page view capture for SPAs
        // Handle manually for accurate SPA tracking
        capture_pageview: false,
        // Track when users leave the page
        capture_pageleave: true,
        // Use localStorage for persistence
        persistence: "localStorage",
        // Enable debug mode in development
        loaded: (ph) => {
          if (import.meta.env.DEV) {
            ph.debug();
          }
        },
      });

      setIsInitialized(true);
    } catch (error) {
      // Never let analytics initialization crash the app
      console.error("[PostHog] Failed to initialize:", error);
    }

    return () => {
      // Cleanup on unmount
      try {
        posthog.shutdown?.();
      } catch {
        // Ignore cleanup errors
      }
    };
  }, []);

  // Always render children - analytics should never block the app
  if (!POSTHOG_KEY || !isInitialized) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
};
