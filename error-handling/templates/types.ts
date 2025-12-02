import type { ReactNode } from "react";

/**
 * Extended error info with boundary context.
 */
export interface ErrorInfo {
  /** React component stack trace */
  componentStack: string;
  /** Name of the error boundary that caught the error */
  errorBoundary: string;
}

/**
 * Props for the ErrorBoundary component.
 */
export interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;

  /**
   * Name to identify this boundary in error reports.
   * Shows in error messages and is sent to error tracking services.
   * @example "PaymentForm", "UserDashboard", "DataChart"
   */
  boundaryName?: string;

  /**
   * Fallback UI mode when an error occurs.
   * - "minimal": Small inline error message
   * - "detailed": Error info with retry and navigation options
   * - "fullpage": Full-screen error page
   * @default "detailed"
   */
  fallbackMode?: "minimal" | "detailed" | "fullpage";

  /**
   * Custom fallback component to render instead of default ErrorFallback.
   * If provided, fallbackMode is ignored.
   */
  fallback?: ReactNode;

  /**
   * Whether to show a retry button in the fallback UI.
   * @default true
   */
  enableRetry?: boolean;

  /**
   * Callback fired when an error is caught.
   * Use for custom error reporting/logging.
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Internal state of the ErrorBoundary component.
 */
export interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error that was caught */
  error: Error | null;
  /** Additional error context */
  errorInfo: ErrorInfo | null;
}

/**
 * Props for the ErrorFallback component.
 */
export interface ErrorFallbackProps {
  /** The error that was caught */
  error: Error | null;
  /** Additional error context */
  errorInfo: ErrorInfo | null;
  /** Callback to retry/reset the error boundary */
  onRetry?: () => void;
  /**
   * Display mode for the fallback UI.
   * - "minimal": Inline error message
   * - "detailed": Error details with retry
   * - "fullpage": Full-screen error page
   */
  mode: "minimal" | "detailed" | "fullpage";
  /** Name of the boundary for display purposes */
  boundaryName?: string;
}
