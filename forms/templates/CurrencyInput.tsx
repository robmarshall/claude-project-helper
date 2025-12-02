import { forwardRef, type ReactNode } from "react";
import { type RegisterOptions } from "react-hook-form";
import { Input } from "./Input";

interface CurrencyInputProps {
  description?: string | ReactNode;
  descriptionPosition?: "top" | "bottom";
  disabled?: boolean;
  hideLabel?: boolean;
  id: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean | string;
  rules?: RegisterOptions;
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  function CurrencyInput(
    {
      description,
      descriptionPosition,
      disabled,
      hideLabel,
      id,
      label,
      name,
      placeholder = "0.00",
      required,
      rules,
    },
    ref
  ) {
    return (
      <Input
        ref={ref}
        id={id}
        name={name}
        label={label}
        type="number"
        placeholder={placeholder}
        disabled={disabled}
        hideLabel={hideLabel}
        description={description}
        descriptionPosition={descriptionPosition}
        required={required}
        startAdornment={
          <span className="text-gray-500 sm:text-sm">$</span>
        }
        inputProps={{
          step: "0.01",
          min: "0",
        }}
        rules={{
          pattern: {
            value: /^-?\d*\.?\d{0,2}$/,
            message: "Please enter a valid amount",
          },
          ...rules,
        }}
      />
    );
  }
);

// =============================================================================
// EXAMPLE USAGE
// =============================================================================
//
// Basic currency input:
// <CurrencyInput
//   id="price"
//   name="price"
//   label="Price"
//   required
// />
//
// With description:
// <CurrencyInput
//   id="budget"
//   name="budget"
//   label="Monthly budget"
//   description="Enter your monthly spending limit"
// />
//
// With minimum value validation:
// <CurrencyInput
//   id="donation"
//   name="donation"
//   label="Donation amount"
//   rules={{ min: { value: 1, message: "Minimum donation is $1" } }}
// />
