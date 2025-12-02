import { type ReactNode } from "react";
import { ErrorMessage } from "./ErrorMessage";

interface InputWrapperProps {
  children: ReactNode;
  description?: string | ReactNode;
  descriptionPosition?: "top" | "bottom";
  disabled?: boolean;
  error?: string;
  hideLabel?: boolean;
  id: string;
  label: string;
  required?: boolean;
}

export function InputWrapper({
  children,
  description,
  descriptionPosition = "bottom",
  disabled,
  error,
  hideLabel,
  id,
  label,
  required,
}: InputWrapperProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={disabled ? "opacity-50" : undefined}>
      {/* Label */}
      <label
        htmlFor={id}
        className={
          hideLabel
            ? "sr-only"
            : "block text-sm font-medium leading-6 text-gray-900"
        }
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

      {/* Description (top position) */}
      {description && descriptionPosition === "top" && (
        <p id={descriptionId} className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      )}

      {/* Input slot */}
      <div className="mt-2">{children}</div>

      {/* Description (bottom position) */}
      {description && descriptionPosition === "bottom" && (
        <p id={descriptionId} className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      )}

      {/* Error message */}
      {error && <ErrorMessage id={errorId}>{error}</ErrorMessage>}
    </div>
  );
}

// =============================================================================
// EXAMPLE USAGE
// =============================================================================
//
// Wrap a custom input component:
// <InputWrapper
//   id="custom-date"
//   label="Date"
//   error={errors.date?.message}
//   required
// >
//   <DatePicker
//     id="custom-date"
//     value={date}
//     onChange={setDate}
//   />
// </InputWrapper>
//
// With description at top:
// <InputWrapper
//   id="password"
//   label="Password"
//   description="Must be at least 8 characters"
//   descriptionPosition="top"
// >
//   <PasswordInput {...register("password")} />
// </InputWrapper>
