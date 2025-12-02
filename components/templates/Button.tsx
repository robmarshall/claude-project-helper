/**
 * Button component with variants and loading state
 *
 * REQUIRES:
 * - npm install class-variance-authority clsx tailwind-merge
 * - classNames.ts utility from utils/classNames.ts
 *
 * @example
 * // Basic usage
 * <Button variant="primary" size="md">Click me</Button>
 *
 * @example
 * // With loading state
 * <Button loading>Saving...</Button>
 *
 * @example
 * // Secondary variant
 * <Button variant="secondary" size="sm">Cancel</Button>
 *
 * @example
 * // Danger variant with custom class
 * <Button variant="danger" className="w-full">Delete Account</Button>
 *
 * @example
 * // As link (using asChild pattern with Slot from @radix-ui/react-slot)
 * <Button asChild>
 *   <a href="/dashboard">Go to Dashboard</a>
 * </Button>
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { classNames } from "~/utils/classNames";

// =============================================================================
// BUTTON VARIANTS (CVA)
// =============================================================================

const buttonVariants = cva(
  // Base classes
  [
    "inline-flex items-center justify-center gap-2",
    "rounded-md font-medium",
    "transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-blue-600 text-white",
          "hover:bg-blue-700",
          "focus-visible:ring-blue-500",
        ],
        secondary: [
          "bg-white text-gray-700",
          "border border-gray-300",
          "hover:bg-gray-50",
          "focus-visible:ring-gray-500",
        ],
        danger: [
          "bg-red-600 text-white",
          "hover:bg-red-700",
          "focus-visible:ring-red-500",
        ],
        ghost: [
          "bg-transparent text-gray-700",
          "hover:bg-gray-100",
          "focus-visible:ring-gray-500",
        ],
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

// =============================================================================
// SPINNER COMPONENT
// =============================================================================

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={classNames("animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// =============================================================================
// BUTTON COMPONENT
// =============================================================================

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading, disabled, children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={classNames(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner className="h-4 w-4" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

// Export variants for use with other elements (links, etc.)
export { buttonVariants };
