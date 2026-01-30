import { cva, type VariantProps } from "class-variance-authority";
import type { MouseEvent, ReactNode, Ref } from "react";

import Link from "~/atoms/Link";
import { classNames } from "~/utils/classNames";

/**
 * Inner button content wrapper for adornments (icons)
 */
interface InnerButtonProps {
  children: ReactNode;
  endAdornment?: ReactNode;
  startAdornment?: ReactNode;
}

const InnerButton: React.FC<InnerButtonProps> = ({
  children,
  endAdornment,
  startAdornment,
}) => (
  <>
    {startAdornment && <div className="-ml-0.5 h-4 w-4">{startAdornment}</div>}
    {children}
    {endAdornment && <div className="-mr-0.5 h-4 w-4">{endAdornment}</div>}
  </>
);

// =============================================================================
// BUTTON VARIANTS (CVA)
// =============================================================================

const buttonVariants = cva(
  // Base styles
  [
    "font-semibold",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
    "flex justify-center items-center",
    "duration-200 ease-in-out",
    "disabled:bg-gray-300 disabled:cursor-not-allowed",
  ],
  {
    variants: {
      color: {
        primary: "",
        secondary: "",
        danger: "",
        tertiary: "",
      },
      variant: {
        solid: "",
        outlined: "ring-1 ring-inset bg-white hover:bg-gray-50",
        ghost: "bg-transparent hover:bg-gray-50 shadow-none focus-visible:outline-transparent",
      },
      size: {
        xs: "rounded-md px-2 py-1 text-xs",
        sm: "rounded-md px-3 py-2 text-sm",
        md: "rounded-md px-4 py-3 text-sm",
        lg: "rounded-md px-4 py-4 text-sm",
        xl: "rounded-md px-4 py-5 text-sm",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    compoundVariants: [
      // Primary solid
      {
        color: "primary",
        variant: "solid",
        className: "bg-blue-600 hover:bg-blue-500 text-white focus-visible:outline-blue-600 disabled:text-white/50",
      },
      // Primary outlined
      {
        color: "primary",
        variant: "outlined",
        className: "text-blue-600 ring-blue-600 disabled:text-gray-400 disabled:ring-gray-300 disabled:bg-white",
      },
      // Primary ghost
      {
        color: "primary",
        variant: "ghost",
        className: "text-blue-600 disabled:text-gray-500",
      },
      // Secondary solid
      {
        color: "secondary",
        variant: "solid",
        className: "bg-fuchsia-600 hover:bg-fuchsia-500 text-white focus-visible:outline-fuchsia-600 disabled:text-white/50",
      },
      // Secondary outlined
      {
        color: "secondary",
        variant: "outlined",
        className: "text-fuchsia-600 ring-fuchsia-600 disabled:text-gray-400 disabled:ring-gray-300 disabled:bg-white",
      },
      // Secondary ghost
      {
        color: "secondary",
        variant: "ghost",
        className: "text-fuchsia-600 disabled:text-gray-500",
      },
      // Danger solid
      {
        color: "danger",
        variant: "solid",
        className: "bg-red-600 hover:bg-red-500 text-white focus-visible:outline-red-600 disabled:text-white/50",
      },
      // Danger outlined
      {
        color: "danger",
        variant: "outlined",
        className: "text-red-600 ring-red-600 disabled:text-gray-400 disabled:ring-gray-300 disabled:bg-white",
      },
      // Danger ghost
      {
        color: "danger",
        variant: "ghost",
        className: "text-red-600 disabled:text-gray-500",
      },
      // Tertiary solid
      {
        color: "tertiary",
        variant: "solid",
        className: "bg-slate-600 hover:bg-slate-500 text-white focus-visible:outline-slate-600 disabled:text-white/50",
      },
      // Tertiary outlined
      {
        color: "tertiary",
        variant: "outlined",
        className: "text-slate-600 ring-slate-300 disabled:text-gray-400 disabled:ring-gray-300 disabled:bg-white",
      },
      // Tertiary ghost
      {
        color: "tertiary",
        variant: "ghost",
        className: "text-slate-600 disabled:text-gray-500",
      },
    ],
    defaultVariants: {
      color: "primary",
      variant: "solid",
      size: "md",
      fullWidth: false,
    },
  }
);

// =============================================================================
// TYPES
// =============================================================================

export type ButtonColor = "primary" | "secondary" | "danger" | "tertiary";
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";
export type ButtonType = "button" | "submit";
export type ButtonVariant = "solid" | "outlined" | "ghost";

/**
 * Button component with variants, sizes, and link support.
 *
 * @example
 * // Basic button
 * <Button color="primary" size="md">Click me</Button>
 *
 * @example
 * // Outlined variant
 * <Button color="primary" variant="outlined">Cancel</Button>
 *
 * @example
 * // As internal link (renders as react-router Link)
 * <Button href="/dashboard">Go to Dashboard</Button>
 *
 * @example
 * // As external link (renders as <a> with target="_blank")
 * <Button href="https://example.com">Visit Site</Button>
 *
 * @example
 * // With icons
 * <Button startAdornment={<PlusIcon />}>Add Item</Button>
 */
export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  download?: boolean;
  endAdornment?: ReactNode;
  href?: string;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  ref?: Ref<HTMLButtonElement>;
  startAdornment?: ReactNode;
  type?: ButtonType;
}

function Button({
  children,
  className,
  color = "primary",
  disabled = false,
  download = false,
  endAdornment = null,
  fullWidth = false,
  href = "",
  onClick = undefined,
  ref,
  size = "md",
  startAdornment = null,
  type = "button",
  variant = "solid",
  ...rest
}: ButtonProps) {
  const isGhost = variant === "ghost";
  const isExternalLink = /^https?:\/\//.test(href);
  const hasAdornment = startAdornment || endAdornment;

  const combinedClasses = classNames(
    buttonVariants({ color, variant, size, fullWidth }),
    hasAdornment && "gap-x-1.5",
    !isGhost && "shadow-xs",
    className
  );

  // Render as external anchor
  if (href !== "" && (isExternalLink || download)) {
    return (
      <a
        href={href}
        target={isExternalLink ? "_blank" : "_self"}
        rel={isExternalLink ? "noreferrer noopener" : undefined}
        className={combinedClasses}
        download={download}
      >
        <InnerButton endAdornment={endAdornment} startAdornment={startAdornment}>
          {children}
        </InnerButton>
      </a>
    );
  }

  // Render as internal Link
  if (href !== "") {
    return (
      <Link href={href} className={combinedClasses} {...rest}>
        <InnerButton endAdornment={endAdornment} startAdornment={startAdornment}>
          {children}
        </InnerButton>
      </Link>
    );
  }

  // Render as button
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={combinedClasses}
      ref={ref}
      {...rest}
    >
      <InnerButton endAdornment={endAdornment} startAdornment={startAdornment}>
        {children}
      </InnerButton>
    </button>
  );
}

export default Button;

// Export variants for external use
export { buttonVariants };
