import { classNames } from "~/utils/classNames";

import type { ButtonProps } from "./Button";
import Button from "./Button";

/**
 * Spinner component for loading state
 */
interface SpinnerProps {
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ className }) => (
  <svg
    className={classNames("animate-spin h-5 w-5", className)}
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

/**
 * Button with loading state support.
 * Shows a spinner when loading and disables pointer events.
 *
 * @example
 * // Basic loading button
 * <ButtonLoading loading={isSubmitting}>Save</ButtonLoading>
 *
 * @example
 * // With custom color
 * <ButtonLoading loading={loading} color="danger">Delete</ButtonLoading>
 */
export interface ButtonLoadingProps extends ButtonProps {
  loading?: boolean;
}

const ButtonLoading: React.FC<ButtonLoadingProps> = ({
  children,
  className,
  loading = false,
  color = "primary",
  ...rest
}) => (
  <Button
    endAdornment={loading && <Spinner className="-m-0.5" />}
    className={classNames(loading && "pointer-events-none", className)}
    color={color}
    {...rest}
  >
    {children}
  </Button>
);

export default ButtonLoading;
