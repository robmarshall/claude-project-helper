# Zod Validation Patterns

## Quick Reference

1. **Define schema first**, then infer TypeScript type from it
2. **Use zodResolver** to connect schema to react-hook-form
3. **Custom error messages** go in the second argument of validators
4. **Optional fields** use `.optional()` or `.nullish()`
5. **Nested objects** use `z.object()` within `z.object()`

---

## Dependencies

```bash
npm install zod @hookform/resolvers
```

---

## Basic Field Schemas

### String Fields

```tsx
import { z } from "zod";

// Required string
const name = z.string().min(1, "Name is required");

// Email
const email = z.string().email("Invalid email address");

// Min/max length
const username = z.string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters");

// Regex pattern
const slug = z.string().regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens");

// URL
const website = z.string().url("Invalid URL");

// Optional string (can be undefined)
const nickname = z.string().optional();

// Nullable string (can be null)
const middleName = z.string().nullable();

// Optional OR nullable (can be undefined or null)
const suffix = z.string().nullish();

// Empty string to undefined (useful for optional text inputs)
const optionalField = z.string().transform(val => val === "" ? undefined : val).optional();
```

### Number Fields

```tsx
// Required number
const age = z.number({ message: "Age is required" });

// From string input (HTML inputs return strings)
const quantity = z.coerce.number().min(1, "Minimum quantity is 1");

// Positive number
const price = z.coerce.number().positive("Price must be positive");

// Integer only
const count = z.coerce.number().int("Must be a whole number");

// Range
const rating = z.coerce.number().min(1).max(5, "Rating must be 1-5");

// Optional number
const discount = z.coerce.number().optional();
```

### Boolean Fields

```tsx
// Required checkbox (must be true)
const acceptTerms = z.literal(true, {
  errorMap: () => ({ message: "You must accept the terms" }),
});

// Optional boolean
const subscribeNewsletter = z.boolean().optional();

// Default value
const receiveUpdates = z.boolean().default(false);
```

### Date Fields

```tsx
// Date object
const birthDate = z.date({ message: "Invalid date" });

// Date from string
const createdAt = z.coerce.date();

// Date range
const appointmentDate = z.date()
  .min(new Date(), "Date must be in the future")
  .max(new Date("2025-12-31"), "Date must be within this year");
```

### Select/Enum Fields

```tsx
// String enum
const role = z.enum(["admin", "user", "guest"], {
  message: "Please select a valid role",
});

// Native enum
enum Status {
  Active = "active",
  Inactive = "inactive",
}
const status = z.nativeEnum(Status);
```

---

## Form Schema Examples

### Login Form

```tsx
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;
```

### Registration Form with Password Confirmation

```tsx
const registrationSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // Error will appear on confirmPassword field
});

type RegistrationFormData = z.infer<typeof registrationSchema>;
```

### Contact Form with Phone Validation

```tsx
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string()
    .regex(phoneRegex, "Invalid phone number")
    .optional()
    .or(z.literal("")), // Allow empty string
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;
```

### Nested Object Schema

```tsx
const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "Use 2-letter state code"),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
});

const userSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email(),
  address: addressSchema,
  billingAddress: addressSchema.optional(),
});

type UserFormData = z.infer<typeof userSchema>;
```

### Array/Repeater Schema

```tsx
const lineItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().min(1, "Minimum quantity is 1"),
  price: z.coerce.number().positive("Price must be positive"),
});

const invoiceSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;
```

---

## Integration with React Hook Form

### Basic Setup

```tsx
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

function MyForm() {
  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {/* fields */}
      </form>
    </FormProvider>
  );
}
```

### Type-Safe Default Values

```tsx
// Ensure defaultValues match the schema type
const defaultValues: FormData = {
  email: "",
  password: "",
};

const methods = useForm<FormData>({
  resolver: zodResolver(schema),
  defaultValues,
});
```

---

## Common Validation Recipes

### Currency/Money

```tsx
const amountSchema = z.coerce
  .number()
  .positive("Amount must be positive")
  .multipleOf(0.01, "Amount can only have 2 decimal places");
```

### Phone Number (US)

```tsx
const usPhoneSchema = z.string()
  .regex(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/, "Invalid US phone number")
  .transform(val => val.replace(/\D/g, "")); // Strip non-digits
```

### Credit Card Number

```tsx
const creditCardSchema = z.string()
  .regex(/^\d{13,19}$/, "Invalid card number")
  .refine(val => luhnCheck(val), "Invalid card number");
```

### URL (Optional)

```tsx
const optionalUrlSchema = z.string()
  .url("Invalid URL")
  .optional()
  .or(z.literal("")); // Allow empty string
```

### File Upload

```tsx
const fileSchema = z.instanceof(File)
  .refine(file => file.size <= 5 * 1024 * 1024, "File must be less than 5MB")
  .refine(
    file => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
    "File must be JPEG, PNG, or WebP"
  );
```

### Conditional Required Field

```tsx
const schema = z.object({
  hasCompany: z.boolean(),
  companyName: z.string().optional(),
}).refine(
  data => !data.hasCompany || (data.hasCompany && data.companyName),
  {
    message: "Company name is required when 'Has Company' is checked",
    path: ["companyName"],
  }
);
```

---

## Error Message Customization

### Per-Field Messages

```tsx
const schema = z.object({
  email: z.string({
    required_error: "Email is required",
    invalid_type_error: "Email must be a string",
  }).email("Please enter a valid email address"),
});
```

### Global Error Map

```tsx
const customErrorMap: z.ZodErrorMap = (issue, ctx) => {
  if (issue.code === z.ZodIssueCode.too_small) {
    return { message: `Minimum ${issue.minimum} characters required` };
  }
  return { message: ctx.defaultError };
};

z.setErrorMap(customErrorMap);
```

---

## See Also

- [React Hook Form Guide](./react-hook-form.md) - Form setup patterns
- [Input Components](./input-components.md) - Component documentation
