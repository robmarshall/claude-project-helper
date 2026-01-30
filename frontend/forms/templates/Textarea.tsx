import { forwardRef, type TextareaHTMLAttributes, type ReactNode } from "react";
import { useFormContext, type RegisterOptions } from "react-hook-form";
import { InputWrapper } from "./InputWrapper";

interface TextareaProps {
  description?: string | ReactNode;
  descriptionPosition?: "top" | "bottom";
  disabled?: boolean;
  hideLabel?: boolean;
  id: string;
  inputProps?: TextareaHTMLAttributes<HTMLTextAreaElement>;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean | string;
  rows?: number;
  rules?: RegisterOptions;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    description,
    descriptionPosition,
    disabled,
    hideLabel,
    id,
    inputProps,
    label,
    name,
    placeholder,
    required,
    rows = 3,
    rules,
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
  const baseClasses =
    "block w-full rounded-md border-0 py-1.5 px-3 shadow-sm ring-1 ring-inset sm:text-sm sm:leading-6";

  // State-specific classes
  const stateClasses = error
    ? "text-red-900 ring-red-300 placeholder:text-red-300 focus:ring-2 focus:ring-inset focus:ring-red-500"
    : "text-gray-900 ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600";

  const disabledClasses = disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed resize-none" : "";

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
      <textarea
        id={id}
        rows={rows}
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
    </InputWrapper>
  );
});

// =============================================================================
// EXAMPLE USAGE
// =============================================================================
//
// Basic textarea:
// <Textarea
//   id="message"
//   name="message"
//   label="Message"
//   placeholder="Enter your message..."
//   required
// />
//
// With more rows:
// <Textarea
//   id="bio"
//   name="bio"
//   label="Bio"
//   rows={6}
//   description="Tell us about yourself"
// />
//
// With character count (in description):
// const value = watch("description");
// <Textarea
//   id="description"
//   name="description"
//   label="Description"
//   rows={4}
//   description={`${value?.length || 0}/500 characters`}
//   rules={{ maxLength: { value: 500, message: "Max 500 characters" } }}
// />
