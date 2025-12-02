import { forwardRef, type InputHTMLAttributes } from "react";
import { useFormContext, type RegisterOptions } from "react-hook-form";
import { ErrorMessage } from "./ErrorMessage";

interface CheckboxProps {
  description?: string;
  disabled?: boolean;
  id: string;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  label: string;
  name: string;
  required?: boolean | string;
  rules?: RegisterOptions;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { description, disabled, id, inputProps, label, name, required, rules },
  ref
) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  // Get required message
  const requiredMessage =
    typeof required === "string" ? required : required ? "This field is required" : undefined;

  // Register the field
  const { ref: rhfRef, ...rhfRest } = register(name, {
    required: requiredMessage,
    ...rules,
  });

  return (
    <div className={disabled ? "opacity-50" : undefined}>
      <div className="flex items-start">
        <div className="flex h-6 items-center">
          <input
            id={id}
            type="checkbox"
            disabled={disabled}
            aria-invalid={!!error}
            aria-required={!!required}
            aria-describedby={description ? `${id}-description` : undefined}
            className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 ${
              error ? "border-red-300" : ""
            } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            {...rhfRest}
            {...inputProps}
            ref={(e) => {
              rhfRef(e);
              if (typeof ref === "function") {
                ref(e);
              } else if (ref) {
                ref.current = e;
              }
            }}
          />
        </div>
        <div className="ml-3">
          <label
            htmlFor={id}
            className={`text-sm font-medium leading-6 text-gray-900 ${
              disabled ? "cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            {label}
            {required && (
              <>
                <span className="text-red-500" aria-hidden="true">
                  {" "}
                  *
                </span>
                <span className="sr-only">(Required)</span>
              </>
            )}
          </label>
          {description && (
            <p id={`${id}-description`} className="text-sm text-gray-500">
              {description}
            </p>
          )}
        </div>
      </div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  );
});

// =============================================================================
// EXAMPLE USAGE
// =============================================================================
//
// Basic checkbox:
// <Checkbox
//   id="terms"
//   name="terms"
//   label="I agree to the terms and conditions"
//   required="You must agree to continue"
// />
//
// With description:
// <Checkbox
//   id="newsletter"
//   name="newsletter"
//   label="Subscribe to newsletter"
//   description="Get weekly updates about new features"
// />
//
// Custom label content (use description for secondary text):
// <Checkbox
//   id="remember"
//   name="rememberMe"
//   label="Remember me"
//   description="Stay signed in for 30 days"
// />
