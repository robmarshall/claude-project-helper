/**
 * CVA configuration for button variants
 * Standalone variant config - import into your Button component
 *
 * REQUIRES: npm install class-variance-authority
 *
 * @example
 * // In your Button.tsx:
 * import { buttonVariants } from "~/styles/buttonVariants";
 *
 * <button className={buttonVariants({ variant: "primary", size: "md" })}>
 *   Click me
 * </button>
 *
 * @example
 * // With classNames for additional classes:
 * import { classNames } from "~/utils/classNames";
 *
 * <button className={classNames(buttonVariants({ variant, size }), className)}>
 *   {children}
 * </button>
 */
import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  // Base classes applied to all buttons
  [
    "inline-flex items-center justify-center",
    "rounded-md font-medium",
    "transition-colors duration-150",
    "focus:outline-none focus:ring-2 focus:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-blue-600 text-white",
          "hover:bg-blue-700",
          "focus:ring-blue-500",
        ],
        secondary: [
          "bg-white text-gray-700",
          "border border-gray-300",
          "hover:bg-gray-50",
          "focus:ring-gray-500",
        ],
        danger: [
          "bg-red-600 text-white",
          "hover:bg-red-700",
          "focus:ring-red-500",
        ],
        ghost: [
          "bg-transparent text-gray-700",
          "hover:bg-gray-100",
          "focus:ring-gray-500",
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

export type ButtonVariants = VariantProps<typeof buttonVariants>;
