import { type ReactNode } from "react";

interface ErrorMessageProps {
  children: ReactNode;
  id?: string;
}

export function ErrorMessage({ children, id }: ErrorMessageProps) {
  if (!children) return null;

  return (
    <span
      className="mt-1 flex items-center text-xs font-medium tracking-wide text-red-500"
      role="alert"
      aria-live="polite"
      id={id}
    >
      {children}
    </span>
  );
}

// =============================================================================
// EXAMPLE USAGE
// =============================================================================
//
// Standalone error display:
// {submitError && <ErrorMessage>{submitError}</ErrorMessage>}
//
// With custom ID for aria-describedby:
// <ErrorMessage id="email-error">Invalid email address</ErrorMessage>
//
// Conditional rendering (built-in null check):
// <ErrorMessage>{errors.name?.message}</ErrorMessage>
