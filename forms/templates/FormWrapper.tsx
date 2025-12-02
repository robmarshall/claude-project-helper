import { type ReactNode } from "react";
import { useForm, FormProvider, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ZodSchema, type z } from "zod";

interface FormWrapperProps<T extends ZodSchema> {
  children: ReactNode;
  className?: string;
  defaultValues?: DefaultValues<z.infer<T>>;
  mode?: "onBlur" | "onChange" | "onSubmit" | "all";
  onSubmit: (data: z.infer<T>) => void | Promise<void>;
  schema: T;
}

export function FormWrapper<T extends ZodSchema>({
  children,
  className,
  defaultValues,
  mode = "onBlur",
  onSubmit,
  schema,
}: FormWrapperProps<T>) {
  const methods = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
    mode,
  });

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className={className}
        noValidate
      >
        {children}
      </form>
    </FormProvider>
  );
}

// =============================================================================
// EXAMPLE USAGE
// =============================================================================
//
// import { z } from "zod";
// import { FormWrapper } from "./FormWrapper";
// import { Input } from "./Input";
//
// const loginSchema = z.object({
//   email: z.string().email("Invalid email"),
//   password: z.string().min(8, "Password must be at least 8 characters"),
// });
//
// function LoginForm() {
//   const handleSubmit = async (data: z.infer<typeof loginSchema>) => {
//     console.log(data);
//     // Submit to API
//   };
//
//   return (
//     <FormWrapper
//       schema={loginSchema}
//       defaultValues={{ email: "", password: "" }}
//       onSubmit={handleSubmit}
//       className="space-y-4"
//     >
//       <Input id="email" name="email" label="Email" type="email" required />
//       <Input id="password" name="password" label="Password" type="password" required />
//       <button
//         type="submit"
//         className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
//       >
//         Sign In
//       </button>
//     </FormWrapper>
//   );
// }
