# Atomic Design Pattern Guide

## Quick Reference Rules

1. **Atoms** - Single-purpose, no business logic (Button, Input, Icon, Link)
2. **Molecules** - Composed of atoms, minimal logic (FormField, SearchBar, Card)
3. **Organisms** - Complex components with business logic (Header, Sidebar, DataTable)
4. **Templates** - Page layouts without data (DashboardTemplate, AuthTemplate)
5. **Pages** - Templates with real data (DashboardPage, LoginPage)

---

## Folder Structure

This library provides atoms, molecules, and some component templates. Organisms, templates, and pages are patterns you implement in your project.

### What This Library Provides

```
frontend/
├── atoms/                    # Basic building blocks (PROVIDED)
│   ├── buttons/
│   │   ├── ButtonBase.tsx    # Minimal button wrapper
│   │   ├── Button.tsx        # Full-featured button with variants
│   │   ├── ButtonLoading.tsx # Loading state wrapper
│   │   └── index.ts          # Barrel exports
│   ├── Link/
│   │   └── Link.tsx          # Internal/external link handling
│   └── Image/
│       └── index.tsx         # Image component
│
├── molecules/                # Composed components (PROVIDED)
│   └── drawer/               # Drawer components (Headless UI)
│       ├── Drawer.tsx        # Side panel drawer
│       └── SlideUpDrawer.tsx # Bottom sheet drawer
│
├── hooks/                    # Shared hooks (PROVIDED)
│   └── useDrawers.ts         # URL-synced drawer state management
│
├── components/               # Component templates (PROVIDED)
│   ├── forms/templates/      # Form input components
│   │   ├── Input.tsx, Select.tsx, Checkbox.tsx, etc.
│   │   └── FormWrapper.tsx   # Form container with react-hook-form
│   └── templates/modal/      # Modal components (Headless UI)
│       ├── Modal.tsx         # Base modal
│       ├── BaseButtonModal.tsx # Pre-composed with buttons
│       └── DangerModal.tsx   # Danger confirmation modal
```

### What You Would Create (Pattern Examples)

```
src/
├── organisms/                # Complex business components (YOU CREATE)
│   ├── Header/
│   ├── Sidebar/
│   ├── DataTable/
│   └── LoginForm/
│
├── templates/                # Page layouts (YOU CREATE)
│   ├── DashboardTemplate/
│   ├── AuthTemplate/
│   └── SettingsTemplate/
│
└── pages/                    # Route pages (YOU CREATE)
    ├── dashboard/
    ├── auth/
    └── settings/
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
Button, ButtonLoading, ButtonBase, Link
Input, Textarea, Select, Checkbox, Radio
Icon, Avatar, Badge, Spinner, Tooltip
Label, Text, Heading
```

**Example Atom (Button):**

```tsx
// atoms/buttons/Button.tsx
import { Button, ButtonLoading } from "~/atoms/buttons";
import { Link } from "~/atoms/Link";

// Basic button
<Button color="primary" size="md">Click me</Button>

// Outlined variant
<Button color="primary" variant="outlined">Cancel</Button>

// As internal link (renders as react-router Link)
<Button href="/dashboard">Go to Dashboard</Button>

// As external link (renders as <a> with target="_blank")
<Button href="https://example.com">Visit Site</Button>

// With loading state
<ButtonLoading loading={isSubmitting}>Save</ButtonLoading>

// With icons
<Button startAdornment={<PlusIcon />}>Add Item</Button>
```

**Button Props:**
- `color`: `"primary"` | `"secondary"` | `"danger"` | `"tertiary"`
- `variant`: `"solid"` | `"outlined"` | `"ghost"`
- `size`: `"xs"` | `"sm"` | `"md"` | `"lg"` | `"xl"`
- `href`: Renders as Link (internal) or anchor (external)
- `fullWidth`: Makes button full width
- `startAdornment` / `endAdornment`: Icons or other content
- `customStyles`: Additional Tailwind classes (smart color override detection)

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
Drawer (Dialog + Button + Transitions)
```

> **Note:** Modal components are in `components/templates/modal/` using Headless UI.
> See: `Modal`, `BaseButtonModal`, `DangerModal`
>
> **Note:** Drawer components are in `molecules/drawer/` using Headless UI.
> See: `Drawer`, `SlideUpDrawer` (with `SlidePage`, `SectionSlider` for multi-step)
>
> **Note:** Form inputs are in `components/forms/templates/` with react-hook-form integration.
> See: `Input`, `Select`, `Checkbox`, `Textarea`, `FormWrapper`

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

> **Note:** Organisms are patterns you implement in your project. The example below shows the recommended structure.

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

**Example Organism (you would create):**

```tsx
// src/organisms/LoginForm/index.tsx
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "~/atoms/Input";
import { Button, ButtonLoading } from "~/atoms/buttons";
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
        <ButtonLoading type="submit" loading={isLoading} fullWidth>
          Sign In
        </ButtonLoading>
      </form>
    </FormProvider>
  );
}
```

---

### Templates

**Purpose:** Page-level layouts defining structure without real data.

> **Note:** Layout templates are patterns you implement in your project. The example below shows the recommended structure. (Modal templates are provided in `components/templates/modal/`.)

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

**Example Template (you would create):**

```tsx
// src/templates/DashboardTemplate/index.tsx
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

> **Note:** Pages are patterns you implement in your project. The example below shows the recommended structure.

**Characteristics:**
- Fetch real data
- Handle routing/navigation
- Connect to state management
- Minimal logic (delegate to organisms)

**Example Page (you would create):**

```tsx
// src/pages/dashboard/index.tsx
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
  → ATOM (Button, Input, Icon, Link)

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
| Atom | Descriptive noun | `Button`, `Input`, `Badge`, `Link` |
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

// Library components (provided)
import { Button, ButtonLoading } from "~/atoms/buttons";
import { Link } from "~/atoms/Link";
import Drawer from "~/molecules/drawer/Drawer";
import SlideUpDrawer from "~/molecules/drawer/SlideUpDrawer";
import useDrawers from "~/hooks/useDrawers";
import { Modal, BaseButtonModal, DangerModal } from "~/components/templates/modal";
import { Input, Select, Checkbox } from "~/components/forms/templates";
import { FormWrapper } from "~/components/forms/templates/FormWrapper";

// Your components (you create these)
import { FormField } from "~/molecules/FormField";
import { LoginForm } from "~/organisms/LoginForm";
import { DashboardTemplate } from "~/templates/DashboardTemplate";
```

---

## See Also

- [Forms Guide](./components/forms/react-hook-form.md) - Form patterns with react-hook-form
- [Drawers Guide](./drawers/INDEX.md) - Drawer and slide-up panel patterns
- [Providers](./providers/INDEX.md) - Context and state management patterns
- [Styling](./styling/INDEX.md) - Tailwind CSS patterns
