# Error Boundary Patterns Guide

## What Error Boundaries Catch

Error boundaries catch JavaScript errors during:
- Rendering
- Lifecycle methods
- Constructors of the whole tree below them

### They Do NOT Catch

```tsx
// Event handlers - use try/catch
const handleClick = async () => {
  try {
    await riskyOperation();
  } catch (error) {
    setError(error);
  }
};

// Async code - use try/catch or error states
useEffect(() => {
  fetchData()
    .then(setData)
    .catch(setError); // Handle async errors
}, []);

// Server-side rendering
// Errors thrown in the boundary itself
```

## Boundary Placement Strategy

### Root Level

Catches catastrophic failures. Shows full-page error with recovery options.

```tsx
// In main.tsx or LayoutRoot
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ErrorBoundary boundaryName="ApplicationRoot" fallbackMode="fullpage">
      <RouterProvider router={router} />
    </ErrorBoundary>
  </QueryClientProvider>
);
```

### Layout Level

Isolates errors to specific sections. Allows other sections to continue working.

```tsx
// In LayoutPrivate
const LayoutPrivate = () => (
  <ErrorBoundary boundaryName="Private Area" fallbackMode="detailed">
    <Sidebar />
    <main>
      <Outlet />
    </main>
  </ErrorBoundary>
);
```

### Component Level

Protects against individual component failures. Shows inline error.

```tsx
// Around risky components
const Dashboard = () => (
  <div className="grid grid-cols-2 gap-4">
    <ErrorBoundary boundaryName="Analytics Chart" fallbackMode="minimal">
      <AnalyticsChart />
    </ErrorBoundary>

    <ErrorBoundary boundaryName="Recent Activity" fallbackMode="minimal">
      <RecentActivity />
    </ErrorBoundary>
  </div>
);
```

## Fallback Modes

### Minimal Mode

Small inline error for component-level failures:

```tsx
// Output:
// [!] Something went wrong [Try again]

<div className="flex items-center rounded-lg border border-red-200 bg-red-50 p-4">
  <ExclamationIcon className="h-5 w-5 text-red-500" />
  <span className="text-sm text-red-700">Something went wrong</span>
  <button className="text-sm text-red-600 underline">Try again</button>
</div>
```

### Detailed Mode

Shows error context with retry. Good for section-level errors:

```tsx
// Output:
// Something went wrong in [Boundary Name]
// We encountered an unexpected error...
// [Error Details (Dev Only)] - expandable
// [Try Again] [Go Back]
```

### Fullpage Mode

Full-screen takeover for catastrophic failures:

```tsx
// Output: Centered card on gray background
// [!] Application Error
// Something unexpected happened...
// [Try Again] [Go to Homepage]
```

## Error Reporting Integration

### Sentry Integration

```tsx
import * as Sentry from "@sentry/react";

componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  // Report to Sentry with context
  Sentry.withScope((scope) => {
    scope.setTag("errorBoundary", this.props.boundaryName || "unknown");
    scope.setContext("errorInfo", {
      componentStack: errorInfo.componentStack,
      boundaryName: this.props.boundaryName,
    });
    scope.setContext("location", {
      pathname: window.location.pathname,
      search: window.location.search,
    });
    Sentry.captureException(error);
  });
}
```

### Custom Error Handler

```tsx
<ErrorBoundary
  boundaryName="PaymentForm"
  onError={(error, errorInfo) => {
    // Send to your analytics
    analytics.track("error_caught", {
      boundary: errorInfo.errorBoundary,
      message: error.message,
      stack: error.stack,
    });

    // Notify team
    if (isProduction) {
      notifySlack(`Error in ${errorInfo.errorBoundary}: ${error.message}`);
    }
  }}
>
  <PaymentForm />
</ErrorBoundary>
```

## Retry Mechanism

### How It Works

```tsx
class ErrorBoundary extends Component {
  handleRetry = () => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // Component tree re-renders from scratch
  };
}
```

### When Retry Works

- Transient errors (race conditions, timing issues)
- Errors fixed by re-mounting (stale closures)
- Network-related rendering errors

### When Retry Doesn't Help

- Logic errors in code
- Missing required props
- Invalid data structures

### Disabling Retry

```tsx
<ErrorBoundary enableRetry={false}>
  {/* No retry button shown */}
</ErrorBoundary>
```

## Development vs Production

### Development Mode

```tsx
if (import.meta.env.DEV) {
  console.group("🚨 Error Boundary Caught Error");
  console.error("Error:", error);
  console.error("Error Info:", errorInfo);
  console.error("Boundary Name:", this.props.boundaryName);
  console.groupEnd();
}
```

Shows:
- Full error message
- Stack trace
- Component stack
- Expandable error details in UI

### Production Mode

- Clean user-friendly message
- No stack traces shown
- Error still reported to monitoring

## TypeScript Types

```tsx
interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Name for identifying this boundary in error reports */
  boundaryName?: string;
  /** Fallback UI mode */
  fallbackMode?: "minimal" | "detailed" | "fullpage";
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Whether to show retry button */
  enableRetry?: boolean;
  /** Custom error handler callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorInfo {
  componentStack: string;
  errorBoundary: string;
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onRetry?: () => void;
  mode: "minimal" | "detailed" | "fullpage";
  boundaryName?: string;
}
```

## Best Practices

### 1. Name Your Boundaries

```tsx
// Good - descriptive names
<ErrorBoundary boundaryName="UserProfile">
<ErrorBoundary boundaryName="PaymentFlow">
<ErrorBoundary boundaryName="DataVisualization">

// Bad - generic or missing
<ErrorBoundary>
<ErrorBoundary boundaryName="boundary1">
```

### 2. Don't Over-Boundary

```tsx
// Too granular - every component
<ErrorBoundary>
  <Avatar />
</ErrorBoundary>
<ErrorBoundary>
  <Username />
</ErrorBoundary>

// Better - logical groups
<ErrorBoundary boundaryName="UserCard">
  <Avatar />
  <Username />
  <UserStats />
</ErrorBoundary>
```

### 3. Handle Async Errors Separately

```tsx
const DataComponent = () => {
  const { data, error, isLoading } = useQuery(["data"], fetchData);

  // Async errors need explicit handling
  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  if (isLoading) {
    return <LoadingState />;
  }

  return <DataDisplay data={data} />;
};
```

### 4. Provide Recovery Actions

```tsx
// Good - clear actions
<ErrorFallback
  onRetry={handleRetry}
  onGoBack={() => history.back()}
  onGoHome={() => navigate("/")}
/>

// Bad - dead end
<div>Something went wrong</div>
```

## Dependencies

```bash
# For error reporting (optional)
npm install @sentry/react

# For icons (optional)
npm install @heroicons/react
```
