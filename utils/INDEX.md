# Utilities Quick Reference

## OVERVIEW

Shared utility functions used across multiple sections. These live at the project root `utils/` folder and are imported via path alias `~/utils/*`.

## UTILITIES

| File | Purpose | Dependencies |
|------|---------|--------------|
| classNames.ts | Tailwind class merging with conflict resolution | `clsx`, `tailwind-merge` |
| queryString.ts | Build API URLs and cache keys | `qs`, `@types/qs` |
| mergeRefs.ts | Combine multiple React refs (React 19 compatible) | None |

## classNames.ts

Merge Tailwind classes safely. Later classes override earlier ones with smart conflict resolution.

```tsx
import { classNames } from "~/utils/classNames";

// Basic merging - px-6 overrides px-4
classNames("px-4 py-2", "px-6")
// → "py-2 px-6"

// Conditional classes
classNames("bg-red-500", isActive && "bg-blue-500", className)

// Object syntax
classNames("base", { "active": isActive, "disabled": isDisabled })
```

**Install:** `npm install clsx tailwind-merge`

## queryString.ts

Build query strings for API calls and TanStack Query cache keys.

```tsx
import { buildQueryString, buildCacheKey, appendSort } from "~/utils/queryString";

// API URL (with ? prefix)
buildQueryString({ page: 1, where: { status: "active" } })
// → "?page=1&where[status]=active"

// Cache key (no prefix)
buildCacheKey({ page: 1, limit: 10 })
// → "page=1&limit=10"

// Add sort param
appendSort("?page=1", "-createdAt")
// → "?page=1&sort=-createdAt"
```

**Install:** `npm install qs && npm install -D @types/qs`

**Note:** There's also `url-state/templates/queryString.ts` with different functions (`parseParams`, `stringifyParams`) for client-side URL state management. This file (`utils/queryString.ts`) is for API/data-fetching layer.

## mergeRefs.ts

Combine multiple refs into one. Essential for React Hook Form components with forwarded refs.

```tsx
import { mergeRefs } from "~/utils/mergeRefs";

// React Hook Form + forwarded ref
function Input({ name, ref, ...props }: InputProps) {
  const { register } = useFormContext();
  const { ref: rhfRef, ...rhfRest } = register(name);

  return (
    <input
      {...rhfRest}
      {...props}
      ref={mergeRefs(rhfRef, ref)}
    />
  );
}

// Internal ref + forwarded ref
function FocusableInput({ ref }: { ref?: Ref<HTMLInputElement> }) {
  const internalRef = useRef<HTMLInputElement>(null);
  return <input ref={mergeRefs(internalRef, ref)} />;
}
```

**Install:** None - uses only React types

## RELATED SECTIONS

- Forms (uses classNames, mergeRefs) → ../forms/INDEX.md
- Components (uses classNames) → ../components/INDEX.md
- Data Fetching (uses queryString) → ../data-fetching/INDEX.md
- URL State (uses url-state/queryString) → ../url-state/INDEX.md
