import type { FC } from "react";

import type { ErrorFallbackProps } from "./types";

/**
 * Error fallback UI component with multiple display modes.
 *
 * Modes:
 * - "minimal": Small inline error for component-level failures
 * - "detailed": Error info with retry, good for section-level errors
 * - "fullpage": Full-screen takeover for catastrophic failures
 */
const ErrorFallback: FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  onRetry,
  mode = "detailed",
  boundaryName,
}) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  // ===========================================================================
  // MINIMAL MODE - Inline error message
  // ===========================================================================
  if (mode === "minimal") {
    return (
      <div className="flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-4">
        <svg
          className="mr-2 h-5 w-5 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span className="text-sm text-red-700">Something went wrong</span>
        {onRetry && (
          <button
            onClick={handleRetry}
            className="ml-2 text-sm text-red-600 underline hover:text-red-800"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  // ===========================================================================
  // FULLPAGE MODE - Full-screen error page
  // ===========================================================================
  if (mode === "fullpage") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="mb-2 text-lg font-medium text-gray-900">
              Application Error
            </h1>
            <p className="mb-4 text-sm text-gray-600">
              Something unexpected happened. Please try refreshing the page or
              contact support if the problem persists.
            </p>
            <div className="flex justify-center space-x-2">
              {onRetry && (
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Try Again
                </button>
              )}
              <button
                onClick={() => (window.location.href = "/")}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // DETAILED MODE (default) - Error info with retry
  // ===========================================================================
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6">
      <div className="flex items-start">
        <svg
          className="mr-3 mt-1 h-6 w-6 flex-shrink-0 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div className="flex-1">
          <h3 className="mb-2 text-lg font-medium text-red-800">
            Something went wrong
            {boundaryName && ` in ${boundaryName}`}
          </h3>
          <p className="mb-4 text-sm text-red-700">
            We encountered an unexpected error. Please try again or contact
            support if the issue persists.
          </p>

          {/* Development-only error details */}
          {import.meta.env.DEV && error && (
            <details className="mb-4">
              <summary className="mb-2 cursor-pointer text-sm font-medium text-red-800">
                Error Details (Development Only)
              </summary>
              <div className="overflow-auto rounded bg-red-100 p-3 font-mono text-xs text-red-900">
                <div className="mb-2">
                  <strong>Error:</strong> {error.message}
                </div>
                {error.stack && (
                  <div className="mb-2">
                    <strong>Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="flex justify-center space-x-2">
            {onRetry && (
              <button
                onClick={handleRetry}
                className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Try Again
              </button>
            )}
            <button
              onClick={() => {
                window.history.back();
                setTimeout(() => window.location.reload(), 100);
              }}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;

// =============================================================================
// EXAMPLE USAGE
// =============================================================================
//
// The ErrorFallback is typically used internally by ErrorBoundary,
// but can also be used standalone for async error states:
//
// const DataComponent = () => {
//   const { data, error, isLoading, refetch } = useQuery(["data"], fetchData);
//
//   if (error) {
//     return (
//       <ErrorFallback
//         error={error}
//         errorInfo={null}
//         onRetry={refetch}
//         mode="detailed"
//         boundaryName="DataComponent"
//       />
//     );
//   }
//
//   return <DataDisplay data={data} />;
// };
