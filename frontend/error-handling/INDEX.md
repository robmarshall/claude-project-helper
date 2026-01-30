# Error Handling Quick Reference

## BEFORE YOU START

Check user's project:
1. Does an ErrorBoundary component exist? → Follow their patterns
2. Is error reporting set up (Sentry, etc.)? → Integrate with existing setup
3. What fallback UI patterns are used? → Match existing styles

## ERROR BOUNDARY PLACEMENT

| Level | Catches | Fallback Style |
|-------|---------|----------------|
| Root (LayoutRoot) | Entire app crashes | Fullpage error |
| Layout (LayoutPrivate) | Section crashes | Detailed error |
| Component | Single component | Minimal inline |

**Rule**: Place boundaries at natural "containment" points where errors can be isolated.

## TEMPLATES

All templates are in the `templates/` subdirectory.

| File | Use for |
|------|---------|
| types.ts | TypeScript types for error handling |
| ErrorBoundary.tsx | Class component that catches errors |
| ErrorFallback.tsx | UI components for error states |

## CORE PATTERNS

### 1. Basic Error Boundary

```tsx
import ErrorBoundary from "~/components/ErrorBoundary";

// In a layout
const LayoutRoot = () => (
  <ErrorBoundary boundaryName="ApplicationRoot" fallbackMode="fullpage">
    <Outlet />
  </ErrorBoundary>
);

// Around a risky component
<ErrorBoundary boundaryName="DataChart" fallbackMode="minimal">
  <DataChart data={data} />
</ErrorBoundary>
```

### 2. Fallback Modes

```tsx
// Fullpage - covers entire screen (for root errors)
<ErrorBoundary fallbackMode="fullpage" />

// Detailed - shows error info with retry (for sections)
<ErrorBoundary fallbackMode="detailed" />

// Minimal - inline error message (for components)
<ErrorBoundary fallbackMode="minimal" />
```

### 3. With Error Reporting

```tsx
<ErrorBoundary
  boundaryName="PaymentFlow"
  onError={(error, errorInfo) => {
    // Custom error handling
    console.error("Payment error:", error);
    analytics.track("payment_error", { error: error.message });
  }}
>
  <PaymentForm />
</ErrorBoundary>
```

### 4. Custom Fallback

```tsx
<ErrorBoundary
  boundaryName="Dashboard"
  fallback={<DashboardErrorState />}
>
  <Dashboard />
</ErrorBoundary>
```

### 5. Retry Mechanism

```tsx
// ErrorBoundary includes retry by default
// User clicks "Try Again" → component re-renders

// Disable retry
<ErrorBoundary enableRetry={false} />
```

## CORE RULES

1. Every app needs at least one root-level ErrorBoundary
2. Use `boundaryName` for easier debugging and error tracking
3. Match fallback style to error scope (fullpage for root, minimal for components)
4. Error boundaries only catch errors in child components, not in:
   - Event handlers (use try/catch)
   - Async code (use try/catch or error states)
   - Server-side rendering
   - Errors in the boundary itself
5. Show stack traces only in development

## PLACEMENT STRATEGY

```tsx
// Recommended boundary placement
<QueryClientProvider>
  <ErrorBoundary boundaryName="Root" fallbackMode="fullpage">
    {/* Root level - catches everything */}

    <ErrorBoundary boundaryName="AuthSection" fallbackMode="detailed">
      {/* Auth section - isolates auth errors */}
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </ErrorBoundary>

    <ErrorBoundary boundaryName="DataSection" fallbackMode="detailed">
      {/* Data section - isolates data errors */}
      <DataProvider>
        <Dashboard />
      </DataProvider>
    </ErrorBoundary>

  </ErrorBoundary>
</QueryClientProvider>
```

## DEPENDENCIES

```bash
# Optional - for error reporting
npm install @sentry/react
```

## DEEP DIVE

- Full patterns guide → error-boundary-patterns.md
- React error boundary docs → https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
