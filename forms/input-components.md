# Input Components Guide

## Overview

All input components follow these principles:
1. Use `useFormContext()` to access react-hook-form methods
2. Use `register()` for standard inputs, `Controller` for complex inputs
3. Display errors via `InputWrapper` component
4. Support accessibility attributes (aria-invalid, aria-required, aria-describedby)
5. Use Tailwind CSS for styling with error state variants

---

## Component Summary

| Component | Use Case | Integration | Template |
|-----------|----------|-------------|----------|
| Input | Text, email, password, number | `register()` | [Input.tsx](./templates/Input.tsx) |
| Select | Dropdown selection | `register()` | [Select.tsx](./templates/Select.tsx) |
| Checkbox | Single true/false | `register()` | [Checkbox.tsx](./templates/Checkbox.tsx) |
| CheckboxGroup | Multiple selections | `register()` + validate | [CheckboxGroup.tsx](./templates/CheckboxGroup.tsx) |
| Textarea | Multi-line text | `register()` | [Textarea.tsx](./templates/Textarea.tsx) |
| CurrencyInput | Money amounts | `register()` | [CurrencyInput.tsx](./templates/CurrencyInput.tsx) |

**Support Components:**
| Component | Purpose | Template |
|-----------|---------|----------|
| InputWrapper | Label, description, error display | [InputWrapper.tsx](./templates/InputWrapper.tsx) |
| ErrorMessage | Error text styling | [ErrorMessage.tsx](./templates/ErrorMessage.tsx) |
| FormWrapper | Form setup boilerplate | [FormWrapper.tsx](./templates/FormWrapper.tsx) |

---

## InputWrapper

Provides consistent label, description, and error display for all inputs.

### Props Interface

```tsx
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
```

### Usage

```tsx
<InputWrapper
  id="email"
  label="Email Address"
  description="We'll never share your email"
  descriptionPosition="bottom"
  error={errors.email?.message}
  required
>
  <input id="email" {...register("email")} />
</InputWrapper>
```

**Template:** [InputWrapper.tsx](./templates/InputWrapper.tsx)

---

## Input (TextField)

Basic text input supporting text, email, password, number, tel types.

### Props Interface

```tsx
interface InputProps {
  description?: string | ReactNode;
  descriptionPosition?: "top" | "bottom";
  disabled?: boolean;
  endAdornment?: ReactNode;
  hideLabel?: boolean;
  id: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean | string;
  rules?: RegisterOptions;
  startAdornment?: ReactNode;
  type?: "text" | "email" | "password" | "number" | "tel";
}
```

### Usage

```tsx
// Basic
<Input id="email" name="email" label="Email" type="email" required />

// With adornments
<Input
  id="search"
  name="search"
  label="Search"
  startAdornment={<SearchIcon />}
  endAdornment={<ClearButton />}
/>

// With validation rules
<Input
  id="username"
  name="username"
  label="Username"
  required="Username is required"
  rules={{
    minLength: { value: 3, message: "Min 3 characters" },
    maxLength: { value: 20, message: "Max 20 characters" },
  }}
/>
```

**Template:** [Input.tsx](./templates/Input.tsx)

---

## Select

Dropdown select with optional search/filter capability.

### Props Interface

```tsx
interface SelectProps {
  description?: string | ReactNode;
  disabled?: boolean;
  hideLabel?: boolean;
  id: string;
  label: string;
  loading?: boolean;
  name: string;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean | string;
  rules?: RegisterOptions;
}
```

### Usage

```tsx
<Select
  id="country"
  name="country"
  label="Country"
  required
  options={[
    { value: "us", label: "United States" },
    { value: "ca", label: "Canada" },
    { value: "mx", label: "Mexico" },
  ]}
  placeholder="Select a country"
/>
```

**Template:** [Select.tsx](./templates/Select.tsx)

---

## Checkbox

Single checkbox for boolean values.

### Props Interface

```tsx
interface CheckboxProps {
  description?: string;
  disabled?: boolean;
  id: string;
  label: string;
  name: string;
  required?: boolean | string;
  rules?: RegisterOptions;
}
```

### Usage

```tsx
// Simple
<Checkbox id="subscribe" name="subscribe" label="Subscribe to newsletter" />

// Required (must be checked)
<Checkbox
  id="terms"
  name="terms"
  label="I accept the terms and conditions"
  required="You must accept the terms"
/>
```

**Template:** [Checkbox.tsx](./templates/Checkbox.tsx)

---

## CheckboxGroup

Multiple checkboxes for selecting multiple options.

### Props Interface

```tsx
interface CheckboxGroupProps {
  description?: string;
  direction?: "horizontal" | "vertical";
  disabled?: boolean;
  id: string;
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean | string;
}
```

### Usage

```tsx
<CheckboxGroup
  id="interests"
  name="interests"
  label="Select your interests"
  direction="vertical"
  required="Select at least one interest"
  options={[
    { value: "tech", label: "Technology" },
    { value: "sports", label: "Sports" },
    { value: "music", label: "Music" },
    { value: "art", label: "Art" },
  ]}
/>
```

**Template:** [CheckboxGroup.tsx](./templates/CheckboxGroup.tsx)

---

## Textarea

Multi-line text input.

### Props Interface

```tsx
interface TextareaProps {
  description?: string;
  disabled?: boolean;
  id: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean | string;
  rows?: number;
  rules?: RegisterOptions;
}
```

### Usage

```tsx
<Textarea
  id="message"
  name="message"
  label="Message"
  placeholder="Enter your message..."
  rows={5}
  required="Message is required"
  rules={{ maxLength: { value: 500, message: "Max 500 characters" } }}
/>
```

**Template:** [Textarea.tsx](./templates/Textarea.tsx)

---

## CurrencyInput

Number input formatted for currency with $ prefix.

### Props Interface

```tsx
interface CurrencyInputProps {
  description?: string;
  disabled?: boolean;
  id: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean | string;
  rules?: RegisterOptions;
}
```

### Usage

```tsx
<CurrencyInput
  id="price"
  name="price"
  label="Price"
  required="Price is required"
  rules={{ min: { value: 0.01, message: "Price must be positive" } }}
/>
```

**Template:** [CurrencyInput.tsx](./templates/CurrencyInput.tsx)

---

## Styling Patterns

### Base Input Classes

```tsx
const baseInputClasses = `
  block w-full rounded-md border-0 py-1.5
  text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300
  placeholder:text-gray-400
  focus:ring-2 focus:ring-inset focus:ring-blue-600
  sm:text-sm sm:leading-6
`;
```

### Error State Classes

```tsx
const errorInputClasses = `
  text-red-900 ring-red-300
  placeholder:text-red-300
  focus:ring-red-500
`;
```

### Disabled State Classes

```tsx
const disabledClasses = `
  bg-gray-50 text-gray-500 cursor-not-allowed
`;
```

### Conditional Class Application

```tsx
const inputClasses = classNames(
  baseInputClasses,
  error && errorInputClasses,
  disabled && disabledClasses
);
```

---

## Accessibility Requirements

All inputs must include:

```tsx
<input
  id={id}                              // For label association
  aria-invalid={!!error}               // Indicates error state
  aria-required={!!required}           // Indicates required field
  aria-describedby={descriptionId}     // Links to description/error
/>
```

Labels must include:

```tsx
<label htmlFor={id}>
  {label}
  {required && <span className="text-red-500" aria-hidden="true"> *</span>}
  {required && <span className="sr-only">(Required)</span>}
</label>
```

Errors must include:

```tsx
<span role="alert" aria-live="polite">
  {errorMessage}
</span>
```

---

## See Also

- [React Hook Form Guide](./react-hook-form.md) - Form setup patterns
- [Zod Validation](./zod-validation.md) - Schema validation
