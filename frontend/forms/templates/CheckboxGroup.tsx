import { useFormContext } from "react-hook-form";
import { ErrorMessage } from "./ErrorMessage";

interface Option {
  value: string;
  label: string;
}

interface CheckboxGroupProps {
  description?: string;
  direction?: "horizontal" | "vertical";
  disabled?: boolean;
  id: string;
  label: string;
  name: string;
  options: Option[];
  required?: boolean | string;
}

export function CheckboxGroup({
  description,
  direction = "vertical",
  disabled,
  id,
  label,
  name,
  options,
  required,
}: CheckboxGroupProps) {
  const {
    register,
    getValues,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  // Get required message
  const requiredMessage =
    typeof required === "string" ? required : required ? "Select at least one option" : undefined;

  // Custom validation for group (at least one must be selected)
  const validateGroup = required
    ? () => {
        const values = getValues(name) || [];
        const selectedCount = values.filter((v: string) => v).length;
        if (selectedCount === 0) {
          return requiredMessage;
        }
        return true;
      }
    : undefined;

  return (
    <fieldset className={disabled ? "opacity-50" : undefined}>
      {/* Legend/Label */}
      <legend className="text-sm font-medium leading-6 text-gray-900">
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
      </legend>

      {/* Description */}
      {description && (
        <p id={`${id}-description`} className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      )}

      {/* Checkboxes */}
      <div
        className={`mt-2 ${
          direction === "horizontal" ? "flex flex-wrap gap-4" : "space-y-2"
        }`}
        role="group"
        aria-labelledby={`${id}-legend`}
        aria-describedby={description ? `${id}-description` : undefined}
      >
        {options.map((option, index) => (
          <div key={option.value} className="flex items-center">
            <input
              id={`${id}-${option.value}`}
              type="checkbox"
              value={option.value}
              disabled={disabled}
              className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 ${
                error ? "border-red-300" : ""
              } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
              {...register(`${name}.${index}`, {
                validate: index === 0 ? validateGroup : undefined,
              })}
            />
            <label
              htmlFor={`${id}-${option.value}`}
              className={`ml-2 text-sm text-gray-700 ${
                disabled ? "cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {option.label}
            </label>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </fieldset>
  );
}

// =============================================================================
// EXAMPLE USAGE
// =============================================================================
//
// Vertical checkbox group (default):
// <CheckboxGroup
//   id="notifications"
//   name="notifications"
//   label="Notification preferences"
//   options={[
//     { value: "email", label: "Email notifications" },
//     { value: "sms", label: "SMS notifications" },
//     { value: "push", label: "Push notifications" },
//   ]}
// />
//
// Horizontal layout:
// <CheckboxGroup
//   id="features"
//   name="features"
//   label="Select features"
//   direction="horizontal"
//   options={[
//     { value: "dark_mode", label: "Dark mode" },
//     { value: "compact", label: "Compact view" },
//     { value: "sounds", label: "Sounds" },
//   ]}
// />
//
// Required group (at least one must be selected):
// <CheckboxGroup
//   id="interests"
//   name="interests"
//   label="Select your interests"
//   required="Please select at least one interest"
//   options={interests}
// />
