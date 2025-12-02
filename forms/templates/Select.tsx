import { forwardRef, type ReactNode } from "react";
import { useFormContext, type RegisterOptions } from "react-hook-form";
import { InputWrapper } from "./InputWrapper";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  description?: string | ReactNode;
  descriptionPosition?: "top" | "bottom";
  disabled?: boolean;
  hideLabel?: boolean;
  id: string;
  label: string;
  loading?: boolean;
  name: string;
  options: Option[];
  placeholder?: string;
  required?: boolean | string;
  rules?: RegisterOptions;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    description,
    descriptionPosition,
    disabled,
    hideLabel,
    id,
    label,
    loading,
    name,
    options,
    placeholder,
    required,
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
    "block w-full rounded-md border-0 py-1.5 pl-3 pr-10 shadow-sm ring-1 ring-inset sm:text-sm sm:leading-6";

  // State-specific classes
  const stateClasses = error
    ? "text-red-900 ring-red-300 focus:ring-2 focus:ring-inset focus:ring-red-500"
    : "text-gray-900 ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600";

  const disabledClasses = disabled || loading ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "";

  return (
    <InputWrapper
      id={id}
      label={label}
      description={description}
      descriptionPosition={descriptionPosition}
      error={error}
      required={!!required}
      disabled={disabled || loading}
      hideLabel={hideLabel}
    >
      <div className="relative">
        <select
          id={id}
          disabled={disabled || loading}
          aria-invalid={!!error}
          aria-required={!!required}
          aria-describedby={descriptionId}
          className={`${baseClasses} ${stateClasses} ${disabledClasses}`}
          {...rhfRest}
          ref={(e) => {
            rhfRef(e);
            if (typeof ref === "function") {
              ref(e);
            } else if (ref) {
              ref.current = e;
            }
          }}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Loading spinner */}
        {loading && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-8">
            <svg
              className="h-5 w-5 animate-spin text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
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
// Basic select:
// <Select
//   id="country"
//   name="country"
//   label="Country"
//   placeholder="Select a country"
//   options={[
//     { value: "us", label: "United States" },
//     { value: "ca", label: "Canada" },
//     { value: "uk", label: "United Kingdom" },
//   ]}
//   required
// />
//
// With loading state (e.g., fetching options from API):
// <Select
//   id="category"
//   name="category"
//   label="Category"
//   options={categories}
//   loading={isLoadingCategories}
// />
//
// Dynamic options from API:
// const { data: users, isLoading } = useUsers();
// <Select
//   id="assignee"
//   name="assignee"
//   label="Assign to"
//   options={users?.map(u => ({ value: u.id, label: u.name })) ?? []}
//   loading={isLoading}
//   placeholder="Select assignee"
// />
