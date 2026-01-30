# Atomic Design Pattern Guide

## Quick Reference Rules

1. **Atoms** - Single-purpose, no business logic (Button, Input, Icon)
2. **Molecules** - Composed of atoms, minimal logic (FormField, SearchBar, Card)
3. **Organisms** - Complex components with business logic (Header, Sidebar, DataTable)
4. **Templates** - Page layouts without data (DashboardTemplate, AuthTemplate)
5. **Pages** - Templates with real data (DashboardPage, LoginPage)

---

## Folder Structure

```
src/
├── atoms/           # Basic building blocks
│   ├── Button/
│   │   └── index.tsx
│   ├── Input/
│   │   └── index.tsx
│   ├── Icon/
│   │   └── index.tsx
│   └── Badge/
│       └── index.tsx
│
├── molecules/       # Composed components
│   ├── FormField/
│   │   └── index.tsx
│   ├── SearchBar/
│   │   └── index.tsx
│   ├── Card/
│   │   └── index.tsx
│   └── Modal/
│       └── index.tsx
│
├── organisms/       # Complex business components
│   ├── Header/
│   │   └── index.tsx
│   ├── Sidebar/
│   │   └── index.tsx
│   ├── DataTable/
│   │   └── index.tsx
│   └── LoginForm/
│       └── index.tsx
│
├── templates/       # Page layouts
│   ├── DashboardTemplate/
│   │   └── index.tsx
│   ├── AuthTemplate/
│   │   └── index.tsx
│   └── SettingsTemplate/
│       └── index.tsx
│
└── pages/           # File-based routing
    ├── dashboard/
    │   └── index.tsx
    ├── auth/
    │   └── login.tsx
    └── settings/
        └── index.tsx
```

---

## Level Definitions

### Atoms

**Purpose:** Smallest, reusable UI elements. No business logic.

**Characteristics:**
- Single responsibility
- Highly reusable
- No external dependencies (no API calls, no context)
- Props-driven styling variants
- Accessible by default

**Examples:**
```
Button, Input, Textarea, Select, Checkbox, Radio
Icon, Avatar, Badge, Spinner, Tooltip
Label, Text, Heading, Link
```

**Example Atom:**

```tsx
// atoms/Button/index.tsx
interface ButtonProps {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export function Button({
  children,
  disabled,
  loading,
  onClick,
  size = "md",
  type = "button",
  variant = "primary",
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={getButtonClasses(variant, size, disabled, loading)}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
```

---

### Molecules

**Purpose:** Groups of atoms working together as a unit.

**Characteristics:**
- Composed of 2+ atoms
- Single, focused purpose
- Minimal internal state (UI state only)
- Reusable across different contexts

**Examples:**
```
FormField (Label + Input + ErrorMessage)
SearchBar (Input + Button)
Card (Container + Heading + Text + Actions)
MenuItem (Icon + Text + Badge)
Pagination (Buttons + Text)
```

**Example Molecule:**

```tsx
// molecules/FormField/index.tsx
interface FormFieldProps {
  children: ReactNode;  // The input element
  description?: string;
  error?: string;
  label: string;
  required?: boolean;
}

export function FormField({
  children,
  description,
  error,
  label,
  required,
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <Label required={required}>{label}</Label>
      {description && <Text size="sm" color="muted">{description}</Text>}
      {children}
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  );
}
```

---

### Organisms

**Purpose:** Complex, self-contained sections with business logic.

**Characteristics:**
- Composed of atoms and molecules
- Contains business logic
- May fetch data or use context
- Specific to application domain
- Less reusable, more specialized

**Examples:**
```
Header (Logo + Navigation + UserMenu)
Sidebar (Logo + NavItems + Footer)
LoginForm (FormFields + Button + Links)
DataTable (Table + Pagination + Filters)
CommentSection (Comments + CommentForm)
```

**Example Organism:**

```tsx
// organisms/LoginForm/index.tsx
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "~/atoms/Input";
import { Button } from "~/atoms/Button";
import { useAuth } from "~/providers/AuthProvider";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const { login, isLoading } = useAuth();
  const methods = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await login(data.email, data.password);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
        <Input name="email" label="Email" type="email" required />
        <Input name="password" label="Password" type="password" required />
        <Button type="submit" loading={isLoading} className="w-full">
          Sign In
        </Button>
      </form>
    </FormProvider>
  );
}
```

---

### Templates

**Purpose:** Page-level layouts defining structure without real data.

**Characteristics:**
- Define page structure and layout
- Use placeholder/slot pattern for content
- No data fetching
- Reusable across similar pages

**Examples:**
```
DashboardTemplate (Sidebar + Header + MainContent slot)
AuthTemplate (Logo + Card slot)
SettingsTemplate (Tabs + Content slot)
ListPageTemplate (Header + Filters + Table slot)
```

**Example Template:**

```tsx
// templates/DashboardTemplate/index.tsx
interface DashboardTemplateProps {
  children: ReactNode;
  title: string;
  actions?: ReactNode;
}

export function DashboardTemplate({
  children,
  title,
  actions,
}: DashboardTemplateProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <Heading level={1}>{title}</Heading>
            {actions && <div>{actions}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
```

---

### Pages

**Purpose:** Templates with real data and route handling.

**Characteristics:**
- Fetch real data
- Handle routing/navigation
- Connect to state management
- Minimal logic (delegate to organisms)

**Example Page:**

```tsx
// pages/dashboard/index.tsx
import { DashboardTemplate } from "~/templates/DashboardTemplate";
import { StatsGrid } from "~/organisms/StatsGrid";
import { RecentActivity } from "~/organisms/RecentActivity";
import { useDashboardData } from "~/hooks/useDashboardData";

export default function DashboardPage() {
  const { stats, activity, isLoading } = useDashboardData();

  if (isLoading) return <LoadingSpinner />;

  return (
    <DashboardTemplate title="Dashboard">
      <StatsGrid stats={stats} />
      <RecentActivity items={activity} />
    </DashboardTemplate>
  );
}
```

---

## Decision Flow

```
Is it a single HTML element with styling?
  → ATOM (Button, Input, Icon)

Is it a group of atoms working together?
  → MOLECULE (FormField, SearchBar, Card)

Does it have business logic or data fetching?
  → ORGANISM (LoginForm, DataTable, Header)

Is it a page layout structure?
  → TEMPLATE (DashboardTemplate, AuthTemplate)

Is it connected to a route with real data?
  → PAGE (DashboardPage, LoginPage)
```

---

## Naming Conventions

| Level | Convention | Examples |
|-------|------------|----------|
| Atom | Descriptive noun | `Button`, `Input`, `Badge` |
| Molecule | Compound noun | `FormField`, `SearchBar`, `NavItem` |
| Organism | Domain + Component | `LoginForm`, `UserMenu`, `ProductCard` |
| Template | Domain + Template | `DashboardTemplate`, `AuthTemplate` |
| Page | Domain + Page | `DashboardPage`, `LoginPage` |

---

## Import Conventions

Use path aliases for clean imports:

```tsx
// tsconfig.json / vite.config.ts
{
  "paths": {
    "~/*": ["./src/*"]
  }
}

// Usage
import { Button } from "~/atoms/Button";
import { FormField } from "~/molecules/FormField";
import { LoginForm } from "~/organisms/LoginForm";
import { DashboardTemplate } from "~/templates/DashboardTemplate";
```

---

## See Also

- [Forms Guide](../forms/react-hook-form.md) - Form patterns
- [Providers](../providers/context-pattern.md) - State management
- [Styling](../styling/tailwind-patterns.md) - CSS patterns
