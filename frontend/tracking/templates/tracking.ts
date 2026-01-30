import { trackEvent } from "./analytics";

/**
 * Domain-specific tracking utilities.
 *
 * This file contains type-safe tracking functions for common business events.
 * Each function wraps the core trackEvent with specific parameters.
 *
 * Benefits:
 * - Type-safe event parameters
 * - Consistent event naming
 * - Easy to discover available events
 * - Centralized event documentation
 */

// ============================================================================
// Authentication Events
// ============================================================================

interface SignUpParams {
  /** Registration method used */
  method: "email" | "google" | "github" | "apple" | "sso";
  /** How user found the product */
  referralSource?: string;
  /** Invite code if applicable */
  inviteCode?: string;
}

/**
 * Track user registration.
 * Call after successful account creation.
 */
export const trackSignUp = (params: SignUpParams): void => {
  trackEvent("sign_up", params);
};

interface LoginParams {
  /** Login method used */
  method: "email" | "google" | "github" | "apple" | "sso";
}

/**
 * Track user login.
 * Call after successful authentication.
 */
export const trackLogin = (params: LoginParams): void => {
  trackEvent("login", params);
};

/**
 * Track user logout.
 * Call when user intentionally logs out.
 */
export const trackLogout = (): void => {
  trackEvent("logout");
};

// ============================================================================
// E-commerce / Checkout Events
// ============================================================================

interface BeginCheckoutParams {
  /** Plan or product ID */
  planId: string;
  /** Monetary value */
  value: number;
  /** Currency code (defaults to USD) */
  currency?: string;
  /** Coupon or discount code */
  couponCode?: string;
}

/**
 * Track checkout initiation.
 * Call when user starts the checkout process.
 */
export const trackBeginCheckout = (params: BeginCheckoutParams): void => {
  trackEvent("begin_checkout", {
    currency: "USD",
    ...params,
  });
};

interface PurchaseParams {
  /** Transaction or payment ID */
  transactionId: string;
  /** Plan or product ID */
  planId: string;
  /** Monetary value */
  value: number;
  /** Currency code (defaults to USD) */
  currency?: string;
  /** Coupon or discount code */
  couponCode?: string;
}

/**
 * Track successful purchase.
 * Call after payment is confirmed.
 */
export const trackPurchase = (params: PurchaseParams): void => {
  trackEvent("purchase", {
    currency: "USD",
    ...params,
  });
};

interface SubscriptionParams {
  /** Subscription ID */
  subscriptionId: string;
  /** Plan ID */
  planId: string;
  /** Billing interval */
  interval: "monthly" | "yearly";
  /** Monetary value */
  value: number;
}

/**
 * Track subscription start.
 * Call when a new subscription is created.
 */
export const trackSubscriptionStarted = (params: SubscriptionParams): void => {
  trackEvent("subscription_started", params);
};

/**
 * Track subscription cancellation.
 * Call when user cancels their subscription.
 */
export const trackSubscriptionCancelled = (params: {
  subscriptionId: string;
  planId: string;
  reason?: string;
}): void => {
  trackEvent("subscription_cancelled", params);
};

// ============================================================================
// Form Events
// ============================================================================

interface FormParams {
  /** Unique form identifier */
  formName: string;
  /** Where the form appears */
  formLocation: string;
}

/**
 * Track form engagement start.
 * Call when user focuses on first field or starts interacting.
 */
export const trackFormStarted = (params: FormParams): void => {
  trackEvent("form_started", params);
};

/**
 * Track successful form submission.
 * Call after form is successfully submitted.
 */
export const trackFormCompleted = (
  params: FormParams & {
    /** Time spent on form in seconds */
    duration?: number;
  }
): void => {
  trackEvent("form_completed", params);
};

/**
 * Track form abandonment.
 * Call when user leaves form without completing.
 */
export const trackFormAbandoned = (
  params: FormParams & {
    /** Last field user interacted with */
    lastField?: string;
    /** Percent of form completed */
    percentComplete?: number;
  }
): void => {
  trackEvent("form_abandoned", params);
};

/**
 * Track form validation error.
 * Call when form submission fails validation.
 */
export const trackFormError = (
  params: FormParams & {
    /** Field that caused the error */
    errorField: string;
    /** Error message shown */
    errorMessage: string;
  }
): void => {
  trackEvent("form_error", params);
};

// ============================================================================
// Feature Usage Events
// ============================================================================

interface FeatureParams {
  /** Feature identifier */
  featureName: string;
  /** Additional context about usage */
  context?: string;
}

/**
 * Track feature usage.
 * Call when user engages with a specific feature.
 */
export const trackFeatureUsed = (params: FeatureParams): void => {
  trackEvent("feature_used", params);
};

/**
 * Track feature discovery.
 * Call when user first sees or discovers a feature.
 */
export const trackFeatureDiscovered = (params: FeatureParams): void => {
  trackEvent("feature_discovered", params);
};

// ============================================================================
// Navigation Events
// ============================================================================

/**
 * Track navigation between sections.
 * Use for significant navigation events beyond page views.
 */
export const trackNavigation = (params: {
  from: string;
  to: string;
  method?: "link" | "button" | "menu" | "breadcrumb";
}): void => {
  trackEvent("navigation", params);
};

// ============================================================================
// Search Events
// ============================================================================

/**
 * Track search query.
 * Call when user performs a search.
 */
export const trackSearch = (params: {
  query: string;
  category?: string;
  resultsCount: number;
}): void => {
  trackEvent("search", params);
};

/**
 * Track search result click.
 * Call when user clicks on a search result.
 */
export const trackSearchResultClicked = (params: {
  query: string;
  resultId: string;
  resultPosition: number;
}): void => {
  trackEvent("search_result_clicked", params);
};

// ============================================================================
// Error Events
// ============================================================================

/**
 * Track user-facing error.
 * Call when an error is shown to the user.
 */
export const trackError = (params: {
  errorCode: string;
  errorMessage: string;
  context?: string;
}): void => {
  trackEvent("error_shown", params);
};

// ============================================================================
// Onboarding Events
// ============================================================================

/**
 * Track onboarding step completion.
 * Call when user completes an onboarding step.
 */
export const trackOnboardingStep = (params: {
  stepNumber: number;
  stepName: string;
  totalSteps: number;
}): void => {
  trackEvent("onboarding_step_completed", params);
};

/**
 * Track onboarding completion.
 * Call when user finishes the entire onboarding flow.
 */
export const trackOnboardingCompleted = (params?: {
  totalDuration?: number;
  skippedSteps?: string[];
}): void => {
  trackEvent("onboarding_completed", params);
};

/**
 * Track onboarding skip.
 * Call when user skips onboarding.
 */
export const trackOnboardingSkipped = (params: {
  atStep: number;
  stepName: string;
}): void => {
  trackEvent("onboarding_skipped", params);
};
