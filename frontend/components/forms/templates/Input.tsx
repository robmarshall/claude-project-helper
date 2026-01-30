import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { useFormContext, type RegisterOptions } from "react-hook-form";
import { InputWrapper } from "./InputWrapper";

interface InputProps {
  description?: string | ReactNode;
  descriptionPosition?: "top" | "bottom";
  disabled?: boolean;
  endAdornment?: ReactNode;
  hideLabel?: boolean;
  id: string;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean | string;
  rules?: RegisterOptions;
  startAdornment?: ReactNode;
  type?: "text" | "email" | "password" | "number" | "tel";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    description,
    descriptionPosition,
    disabled,
    endAdornment,
    hideLabel,
    id,
    inputProps,
    label,
    name,
    placeholder,
    required,
    rules,
    startAdornment,
    type = "text",
  },
  ref
) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;
  const descriptionId = description ? `${id}-description` : undefined;

  // Get required message
  const requiredMessage =
    typeof required === "string" ? required : required ? "This field is required" : undefined;

  // Register the field
  const { ref: rhfRef, ...rhfRest } = register(name, {
    required: requiredMessage,
    ...rules,
  });

  // Base classes
  const baseClasses = [
    "block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset sm:text-sm sm:leading-6",
    startAdornment ? "pl-10" : "pl-3",
    endAdornment ? "pr-10" : "pr-3",
  ].join(" ");

  // State-specific classes
  const stateClasses = error
    ? "text-red-900 ring-red-300 placeholder:text-red-300 focus:ring-2 focus:ring-inset focus:ring-red-500"
    : "text-gray-900 ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600";

  const disabledClasses = disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "";

  return (
    <InputWrapper
      id={id}
      label={label}
      description={description}
      descriptionPosition={descriptionPosition}
      error={error}
      required={!!required}
      disabled={disabled}
      hideLabel={hideLabel}
    >
      <div className="relative">
        {/* Start Adornment */}
        {startAdornment && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            {startAdornment}
          </div>
        )}

        {/* Input */}
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={!!error}
          aria-required={!!required}
          aria-describedby={descriptionId}
          className={`${baseClasses} ${stateClasses} ${disabledClasses}`}
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

        {/* End Adornment */}
        {endAdornment && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
            {endAdornment}
          </div>
        )}
      </div>
    </InputWrapper>
  );
});

// =============================================================================
// EXAMPLE USAGE
// =============================================================================
//
// Basic input:
// <Input id="email" name="email" label="Email" type="email" required />
//
// With description:
// <Input
//   id="phone"
//   name="phone"
//   label="Phone"
//   type="tel"
//   description="We'll only use this for account recovery"
// />
//
// With start adornment (icon):
// <Input
//   id="search"
//   name="search"
//   label="Search"
//   hideLabel
//   placeholder="Search..."
//   startAdornment={<SearchIcon className="h-5 w-5" />}
// />
//
// With end adornment (button):
// <Input
//   id="password"
//   name="password"
//   label="Password"
//   type="password"
//   endAdornment={
//     <button type="button" onClick={toggleVisibility}>
//       <EyeIcon className="h-5 w-5" />
//     </button>
//   }
// />
