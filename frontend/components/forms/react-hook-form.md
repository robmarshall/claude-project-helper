# React Hook Form Guide

## Quick Reference Rules

1. **Always use FormProvider wrapper** at the form level
2. **Use useFormContext()** in nested components to access form methods
3. **Use register()** for standard HTML inputs (text, email, checkbox, select)
4. **Use Controller** for complex/third-party inputs (date pickers, rich text editors)
5. **Use useFieldArray** for dynamic repeatable fields
6. **Use Zod schemas** for type-safe validation (see [zod-validation.md](./zod-validation.md))

---

## Dependencies

```bash
npm install react-hook-form @hookform/resolvers zod
```

```json
{
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x",
  "zod": "^3.x"
}
```

---

## Form Setup Patterns

### Pattern 1: Basic Form with Zod Validation

```tsx
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// 1. Define schema
const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// 2. Infer TypeScript type from schema
type FormData = z.infer<typeof formSchema>;

// 3. Create form component
function MyForm() {
  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur", // Validate on blur (options: "onSubmit" | "onBlur" | "onChange" | "all")
  });

  const onSubmit = async (data: FormData) => {
    // data is fully typed and validated
    console.log(data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {/* Form fields go here */}
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}
```

### Pattern 2: Form with Loading State

```tsx
function MyForm() {
  const [isLoading, setIsLoading] = useState(false);
  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await submitToAPI(data);
      // Handle success
    } catch (error) {
      // Handle error
      methods.setError("root", { message: "Submission failed" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {methods.formState.errors.root && (
          <div className="text-red-500">{methods.formState.errors.root.message}</div>
        )}
        {/* Form fields */}
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </FormProvider>
  );
}
```

### Pattern 3: Form with Pre-filled Data

```tsx
function EditForm({ initialData }: { initialData: FormData }) {
  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData,
  });

  // Reset form when initialData changes (e.g., from API)
  useEffect(() => {
    methods.reset(initialData);
  }, [initialData, methods]);

  // ...
}
```

---

## Field Registration Patterns

### Pattern A: register() for Standard Inputs

Use `register()` for native HTML inputs. Access via `useFormContext()` in nested components.

```tsx
import { useFormContext } from "react-hook-form";

function EmailInput() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div>
      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        {...register("email")}
        aria-invalid={!!errors.email}
      />
      {errors.email && (
        <span className="text-red-500">{errors.email.message as string}</span>
      )}
    </div>
  );
}
```

### Pattern B: Controller for Complex Inputs

Use `Controller` when the input component doesn't expose a ref or needs controlled behavior.

```tsx
import { useFormContext, Controller } from "react-hook-form";
import DatePicker from "react-datepicker";

function DateField() {
  const { control, formState: { errors } } = useFormContext();

  return (
    <Controller
      name="birthDate"
      control={control}
      render={({ field }) => (
        <DatePicker
          selected={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
        />
      )}
    />
  );
}
```

### Pattern C: useFieldArray for Dynamic Lists

Use `useFieldArray` for repeatable field groups.

```tsx
import { useFormContext, useFieldArray } from "react-hook-form";

function LineItems() {
  const { control, register } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });

  return (
    <div>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`lineItems.${index}.name`)} placeholder="Item name" />
          <input {...register(`lineItems.${index}.amount`)} placeholder="Amount" type="number" />
          <button type="button" onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={() => append({ name: "", amount: 0 })}>
        Add Item
      </button>
    </div>
  );
}
```

---

## Error Handling

### Accessing Errors

```tsx
const { formState: { errors } } = useFormContext();

// Simple field error
errors.email?.message

// Nested field error (e.g., in useFieldArray)
errors.lineItems?.[0]?.name?.message

// Root/form-level error
errors.root?.message
```

### Setting Errors Programmatically

```tsx
const { setError, clearErrors } = useFormContext();

// Set a field error
setError("email", { type: "manual", message: "This email is already taken" });

// Set a root error
setError("root", { message: "Form submission failed" });

// Clear specific error
clearErrors("email");

// Clear all errors
clearErrors();
```

---

## Form State Helpers

```tsx
const { formState } = useFormContext();

formState.isDirty       // true if any field has been modified
formState.isValid       // true if form passes validation
formState.isSubmitting  // true during handleSubmit execution
formState.isSubmitted   // true after form has been submitted
formState.errors        // object containing all field errors
```

---

## Watch Values

```tsx
const { watch } = useFormContext();

// Watch a single field
const email = watch("email");

// Watch multiple fields
const [firstName, lastName] = watch(["firstName", "lastName"]);

// Watch all fields
const allValues = watch();

// Watch with callback (useful in useEffect)
useEffect(() => {
  const subscription = watch((value, { name, type }) => {
    console.log("Field changed:", name, value);
  });
  return () => subscription.unsubscribe();
}, [watch]);
```

---

## Template Files

- [FormWrapper.tsx](./templates/FormWrapper.tsx) - Complete form wrapper template
- [Input.tsx](./templates/Input.tsx) - Text input with error handling
- [Select.tsx](./templates/Select.tsx) - Dropdown select
- [Checkbox.tsx](./templates/Checkbox.tsx) - Single checkbox
- [CheckboxGroup.tsx](./templates/CheckboxGroup.tsx) - Multiple checkboxes
- [Textarea.tsx](./templates/Textarea.tsx) - Multi-line text
- [CurrencyInput.tsx](./templates/CurrencyInput.tsx) - Currency input with formatting

---

## See Also

- [Zod Validation Patterns](./zod-validation.md) - Schema validation recipes
- [Input Components](./input-components.md) - Component documentation
