# URL Params Patterns Guide

## URL State vs React State

### When to Use URL State

| Scenario | Use URL State? | Reason |
|----------|---------------|--------|
| Filter/search params | Yes | Shareable, bookmarkable |
| Pagination | Yes | Back button works as expected |
| Tab selection | Yes | Direct linking to tabs |
| Sort order | Yes | Persist user preference |
| Modal/drawer open | Maybe | Only if you want shareable links |
| Form input | No | Temporary until submit |
| Hover/focus state | No | Ephemeral UI state |
| Loading state | No | Not meaningful to share |

### Benefits of URL State

1. **Shareable URLs** - Copy/paste link shares exact app state
2. **Browser history** - Back/forward buttons work naturally
3. **Refresh survival** - State persists across page reloads
4. **Deep linking** - Link directly to filtered views
5. **SEO** - Search engines can index different states

## Query String Parsing with `qs`

### Why `qs` over URLSearchParams

```tsx
// URLSearchParams limitations:
// - No nested object support
// - Manual array handling
// - No automatic type conversion

// qs advantages:
// - Nested objects with dot notation
// - Array support
// - Configurable parsing
```

### Configuration

```tsx
import { parse, stringify } from "qs";

// Stringify with options
const queryString = stringify(params, {
  skipNulls: true,        // Remove null values
  addQueryPrefix: true,   // Add "?" prefix
  allowDots: true,        // Use dot notation for nested
  encode: false,          // Don't encode special chars
});

// Parse with options
const params = parse(queryString, {
  allowDots: true,        // Support dot notation
});
```

## Nested Object Support

### Writing Nested Objects

```tsx
setUrlParams({
  filters: {
    status: "active",
    dateRange: {
      start: "2024-01-01",
      end: "2024-12-31"
    }
  },
  sort: {
    field: "createdAt",
    direction: "desc"
  }
});

// Produces URL:
// ?filters.status=active&filters.dateRange.start=2024-01-01&filters.dateRange.end=2024-12-31&sort.field=createdAt&sort.direction=desc
```

### Reading Nested Objects

```tsx
const { params } = useUrlParams();

// Access nested values
const status = params.filters?.status;
const sortField = params.sort?.field || "createdAt";
const sortDir = params.sort?.direction || "asc";
```

## Change Detection

The `useUrlParams` hook includes smart change detection to prevent unnecessary navigations:

```tsx
const setUrlParams = useCallback((params: Params) => {
  const currentParams = parseParams(stringParams);

  // Deep comparison for objects
  const hasChanges = (() => {
    for (const key of Object.keys(params)) {
      if (typeof params[key] === "object" && params[key] !== null) {
        // Compare nested objects
        const newSubObj = params[key] as Record<string, unknown>;
        const currentSubObj = currentParams[key] || {};

        for (const subKey of Object.keys(newSubObj)) {
          if (newSubObj[subKey] !== currentSubObj[subKey]) {
            return true;
          }
        }
      } else {
        // Compare primitive values
        if (params[key] !== currentParams[key]) {
          return true;
        }
      }
    }
    return false;
  })();

  // Only navigate if there are actual changes
  if (!hasChanges) return;

  // Update URL...
}, [stringParams]);
```

## React Router v6 Integration

### Using with React Router

```tsx
import { useNavigate, useLocation, useSearchParams } from "react-router";

const useUrlParams = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const setUrlParams = useCallback((params: Params) => {
    const currentParams = parseParams(searchParams.toString());
    const newParams = { ...currentParams, ...params };

    // Remove empty values
    const cleanParams = removeEmptyKeys(newParams);

    setSearchParams(stringifyParams(cleanParams));
  }, [searchParams, setSearchParams]);

  const clearAllParams = useCallback(() => {
    navigate(pathname);
  }, [pathname, navigate]);

  return {
    params: parseParams(searchParams.toString()),
    setUrlParams,
    clearAllParams,
  };
};
```

### Preserving Pathname

```tsx
// When setting params, preserve the current pathname
const clearAllParams = useCallback(() => {
  const fullUrl = `${pathname}`; // No query string
  navigate(fullUrl);
}, [pathname, navigate]);
```

## Common Patterns

### Pagination with Filters

```tsx
const PaginatedList = () => {
  const { params, setUrlParams } = useUrlParams();

  const page = Number(params.page) || 1;
  const perPage = Number(params.perPage) || 20;
  const search = (params.search as string) || "";

  // Reset to page 1 when search changes
  const handleSearch = (value: string) => {
    setUrlParams({ search: value, page: 1 });
  };

  // Navigate pages
  const handlePageChange = (newPage: number) => {
    setUrlParams({ ...params, page: newPage });
  };

  // Fetch data with params
  const { data } = useQuery({
    queryKey: ["items", page, perPage, search],
    queryFn: () => fetchItems({ page, perPage, search }),
  });
};
```

### Tab Selection

```tsx
const TabbedView = () => {
  const { params, setUrlParams } = useUrlParams();
  const activeTab = (params.tab as string) || "overview";

  const tabs = ["overview", "details", "history"];

  return (
    <div>
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => setUrlParams({ tab })}
          className={activeTab === tab ? "active" : ""}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};
```

### Multi-Select Filters

```tsx
const MultiFilter = () => {
  const { params, setUrlParams } = useUrlParams();

  // Parse array from URL (qs handles this)
  const selectedCategories = Array.isArray(params.categories)
    ? params.categories
    : params.categories
      ? [params.categories]
      : [];

  const toggleCategory = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];

    setUrlParams({
      ...params,
      categories: newCategories.length > 0 ? newCategories : undefined
    });
  };
};
```

## Utility: Remove Empty Keys

```tsx
// util/removeEmptyObjectKeys.ts
const removeEmptyObjectKeys = <T extends Record<string, unknown>>(obj: T): T => {
  const result = {} as T;

  for (const key of Object.keys(obj)) {
    const value = obj[key];

    if (value === null || value === undefined || value === "") {
      continue;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      const nested = removeEmptyObjectKeys(value as Record<string, unknown>);
      if (Object.keys(nested).length > 0) {
        result[key as keyof T] = nested as T[keyof T];
      }
    } else {
      result[key as keyof T] = value as T[keyof T];
    }
  }

  return result;
};

export default removeEmptyObjectKeys;
```

## TypeScript Types

```tsx
type QueryParamValue =
  | string
  | number
  | boolean
  | object
  | null
  | undefined
  | QueryParamValue[]
  | { [key: string]: QueryParamValue };

interface Params {
  [key: string]: QueryParamValue;
}

interface UseUrlParamsReturn {
  params: Params;
  setUrlParams: (params: Params) => void;
  clearAllParams: () => void;
}
```

## Dependencies

```bash
npm install qs react-router-dom
npm install -D @types/qs
```
