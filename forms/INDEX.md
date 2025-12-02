# Forms Quick Reference

## BEFORE YOU START

Check user's project:
1. Does `FormProvider` or `FormWrapper` exist? → Skip to "Adding to Existing Form"
2. Does a Zod schema file exist? → Add to it, don't create new
3. What input components already exist? → Follow their patterns

## NEW FORM SETUP

Need: FormWrapper.tsx, InputWrapper.tsx, ErrorMessage.tsx, then specific inputs

1. Copy templates/FormWrapper.tsx → Sets up FormProvider + Zod resolver
2. Copy templates/InputWrapper.tsx → Label + error wrapper
3. Copy templates/ErrorMessage.tsx → Error display
4. Copy needed input templates (Input.tsx, Select.tsx, etc.)

## ADDING TO EXISTING FORM

1. Find the Zod schema → Add new field
2. Find the form JSX → Add input component
3. If input type doesn't exist → Copy just that template

## TEMPLATES

All templates are in the `templates/` subdirectory.

| File | Use for |
|------|---------|
| FormWrapper.tsx | New form with validation |
| Input.tsx | text, email, password, number, tel |
| Select.tsx | Dropdown |
| Checkbox.tsx | Single boolean |
| CheckboxGroup.tsx | Multiple options |
| Textarea.tsx | Multi-line |
| CurrencyInput.tsx | Money with $ |
| InputWrapper.tsx | Label wrapper (used by all inputs) |
| ErrorMessage.tsx | Error display (used by all inputs) |

## CORE RULES

1. Always use FormProvider wrapper (FormWrapper handles this)
2. Use useFormContext() in input components
3. Define Zod schema first, infer type: `type FormData = z.infer<typeof schema>`
4. register() for standard inputs, Controller for complex ones

## DEEP DIVE

- Complex validation → zod-validation.md
- Dynamic fields (useFieldArray) → react-hook-form.md
- Full component props → input-components.md
