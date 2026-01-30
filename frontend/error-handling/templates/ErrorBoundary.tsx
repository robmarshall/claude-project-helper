import { Component, type ReactNode } from "react";

// Optional: Uncomment for Sentry integration
// import * as Sentry from "@sentry/react";

import ErrorFallback from "./ErrorFallback";
import type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  ErrorInfo,
} from "./types";

/**
 * Error Boundary component that catches JavaScript errors in child components.
 *
 * Features:
 * - Multiple fallback UI modes (minimal, detailed, fullpage)
 * - Custom error handler callback
 * - Retry mechanism to reset error state
 * - Development logging
 * - Optional Sentry integration
 *
 * @example
 * // Root level boundary
 * <ErrorBoundary boundaryName="ApplicationRoot" fallbackMode="fullpage">
 *   <App />
 * </ErrorBoundary>
 *
 * @example
 * // Component level boundary
 * <ErrorBoundary boundaryName="DataChart" fallbackMode="minimal">
 *   <DataChart data={data} />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * Update state when an error is caught.
   * Called during the "render" phase.
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Log error and report to monitoring services.
   * Called during the "commit" phase.
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const enhancedErrorInfo: ErrorInfo = {
      componentStack: errorInfo.componentStack ?? "",
      errorBoundary: this.props.boundaryName || "Unknown",
    };

    this.setState({
      errorInfo: enhancedErrorInfo,
    });

    // ==========================================================================
    // SENTRY INTEGRATION (Optional)
    // Uncomment and configure if using Sentry for error reporting
    // ==========================================================================
    // Sentry.withScope((scope) => {
    //   scope.setTag("errorBoundary", this.props.boundaryName || "unknown");
    //   scope.setContext("errorInfo", {
    //     componentStack: errorInfo.componentStack,
    //     boundaryName: this.props.boundaryName,
    //   });
    //   scope.setContext("location", {
    //     pathname: window.location.pathname,
    //     search: window.location.search,
    //     hash: window.location.hash,
    //   });
    //   Sentry.captureException(error);
    // });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, enhancedErrorInfo);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.group("🚨 Error Boundary Caught Error");
      console.error("Error:", error);
      console.error("Error Info:", errorInfo);
      console.error("Boundary Name:", this.props.boundaryName || "Unknown");
      console.groupEnd();
    }
  }

  /**
   * Reset error state to allow retry.
   */
  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Use ErrorFallback component with specified mode
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={
            this.props.enableRetry !== false ? this.handleRetry : undefined
          }
          mode={this.props.fallbackMode || "detailed"}
          boundaryName={this.props.boundaryName}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// =============================================================================
// EXAMPLE USAGE
// =============================================================================
//
// Basic usage:
// import ErrorBoundary from "~/components/ErrorBoundary";
//
// // Root level - catches all errors
// <ErrorBoundary boundaryName="ApplicationRoot" fallbackMode="fullpage">
//   <App />
// </ErrorBoundary>
//
// // Section level - isolates errors to this section
// <ErrorBoundary boundaryName="Dashboard" fallbackMode="detailed">
//   <Dashboard />
// </ErrorBoundary>
//
// // Component level - minimal inline error
// <ErrorBoundary boundaryName="UserAvatar" fallbackMode="minimal">
//   <UserAvatar user={user} />
// </ErrorBoundary>
//
// =============================================================================
// WITH CUSTOM ERROR HANDLER
// =============================================================================
//
// <ErrorBoundary
//   boundaryName="PaymentForm"
//   onError={(error, errorInfo) => {
//     // Send to your analytics
//     analytics.track("error_caught", {
//       boundary: errorInfo.errorBoundary,
//       message: error.message,
//     });
//   }}
// >
//   <PaymentForm />
// </ErrorBoundary>
//
// =============================================================================
// WITH CUSTOM FALLBACK
// =============================================================================
//
// <ErrorBoundary
//   boundaryName="DataChart"
//   fallback={
//     <div className="p-4 text-center text-gray-500">
//       Unable to load chart. Please refresh the page.
//     </div>
//   }
// >
//   <DataChart data={data} />
// </ErrorBoundary>
