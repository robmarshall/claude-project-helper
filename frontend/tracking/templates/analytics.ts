import posthog from "posthog-js";

/**
 * Core analytics functions for user identification and event tracking.
 *
 * All functions are wrapped in try-catch to prevent analytics errors
 * from affecting application functionality.
 */

interface IdentifyUserParams {
  userId: string;
  email?: string;
  name?: string;
  /** Additional user properties for segmentation */
  [key: string]: unknown;
}

/**
 * Identify a user for analytics tracking.
 *
 * Call this function when:
 * - User logs in
 * - User session is restored
 * - User token is refreshed
 * - User profile is updated
 *
 * @example
 * ```tsx
 * identifyUser({
 *   userId: user.id,
 *   email: user.email,
 *   name: user.name,
 *   plan: user.subscription?.plan,
 *   company: user.organization?.name,
 * });
 * ```
 */
export const identifyUser = ({
  userId,
  email,
  name,
  ...additionalProperties
}: IdentifyUserParams): void => {
  try {
    posthog.identify(userId, {
      email,
      name,
      ...additionalProperties,
    });
  } catch (error) {
    console.error("[Analytics] Failed to identify user:", error);
  }
};

/**
 * Track a custom event.
 *
 * @param eventName - Name of the event (use snake_case)
 * @param properties - Optional event properties
 *
 * @example
 * ```tsx
 * trackEvent("button_clicked", { buttonName: "submit", page: "checkout" });
 * trackEvent("feature_used", { featureName: "export", format: "csv" });
 * ```
 */
export const trackEvent = (
  eventName: string,
  properties?: Record<string, unknown>
): void => {
  try {
    posthog.capture(eventName, properties);
  } catch (error) {
    console.error("[Analytics] Failed to track event:", error);
  }
};

/**
 * Track a page view.
 *
 * Use this for SPA navigation when automatic page view capture is disabled.
 *
 * @param pageName - Optional friendly name for the page
 *
 * @example
 * ```tsx
 * // In route component
 * useEffect(() => {
 *   trackPageView("dashboard");
 * }, []);
 * ```
 */
export const trackPageView = (pageName?: string): void => {
  try {
    posthog.capture("$pageview", {
      ...(pageName && { page: pageName }),
      $current_url: window.location.href,
    });
  } catch (error) {
    console.error("[Analytics] Failed to track page view:", error);
  }
};

/**
 * Reset the current user's identity.
 *
 * Call this when the user logs out to ensure their identity
 * is not associated with subsequent anonymous activity.
 *
 * @example
 * ```tsx
 * const handleLogout = async () => {
 *   await signOut();
 *   resetUser();
 *   navigate("/login");
 * };
 * ```
 */
export const resetUser = (): void => {
  try {
    posthog.reset();
  } catch (error) {
    console.error("[Analytics] Failed to reset user:", error);
  }
};

/**
 * Set user properties without changing identity.
 *
 * Use this to update user traits after identification.
 *
 * @example
 * ```tsx
 * setUserProperties({
 *   plan: "pro",
 *   completedOnboarding: true,
 * });
 * ```
 */
export const setUserProperties = (
  properties: Record<string, unknown>
): void => {
  try {
    posthog.people.set(properties);
  } catch (error) {
    console.error("[Analytics] Failed to set user properties:", error);
  }
};

/**
 * Check if a feature flag is enabled for the current user.
 *
 * @param flagKey - The feature flag key
 * @returns boolean indicating if the flag is enabled
 *
 * @example
 * ```tsx
 * if (isFeatureEnabled("new-dashboard")) {
 *   return <NewDashboard />;
 * }
 * ```
 */
export const isFeatureEnabled = (flagKey: string): boolean => {
  try {
    return posthog.isFeatureEnabled(flagKey) ?? false;
  } catch (error) {
    console.error("[Analytics] Failed to check feature flag:", error);
    return false;
  }
};

/**
 * Get the variant key for a feature flag.
 *
 * @param flagKey - The feature flag key
 * @returns The variant key or undefined
 *
 * @example
 * ```tsx
 * const variant = getFeatureFlag("pricing-experiment");
 * if (variant === "variant-a") {
 *   return <PricingVariantA />;
 * }
 * ```
 */
export const getFeatureFlag = (
  flagKey: string
): string | boolean | undefined => {
  try {
    return posthog.getFeatureFlag(flagKey);
  } catch (error) {
    console.error("[Analytics] Failed to get feature flag:", error);
    return undefined;
  }
};
