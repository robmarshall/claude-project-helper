# Data Fetching Quick Reference

## BEFORE YOU START

Check user's project:
1. Is `@tanstack/react-query` installed? → `npm install @tanstack/react-query qs`
2. Is QueryClientProvider set up? → Wrap app in provider (see Setup below)
3. Is there an existing API client? → Follow its patterns instead
4. What's the API URL pattern? → Configure `API_URL` in api.ts and crud.ts

## SETUP

```tsx
// App.tsx or Layout.tsx
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "~/lib/cache";

export default function App({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

## TEMPLATES

All templates are in the `templates/` subdirectory.

| File | Purpose | When to use |
|------|---------|-------------|
| types.ts | Shared TypeScript types | Copy first, foundation for all |
| api.ts | Low-level fetch with auth + token refresh | Copy first, configure API_URL |
| cache.ts | TanStack Query client + cache utils | Copy first, provides queryClient |
| crud.ts | Generic CRUD operations | Copy after api.ts, requires utils/ |
| useResource.ts | Hook for single items | Copy after crud.ts + cache.ts |
| usePaginatedResource.ts | Hook for paginated lists | Copy after crud.ts, requires utils/ |

### Required: Utils Folder (at project root)

These templates depend on shared utilities from the root `utils/` folder:

```
your-project/
├── utils/
│   └── queryString.ts   # Copy from utils/queryString.ts
└── lib/
    ├── api.ts
    ├── crud.ts          # imports from ~/utils/queryString
    └── ...
```

See root `utils/` folder for:
- **queryString.ts** - Query string utilities (requires `qs` package)
  - `buildQueryString(params)` - Build URL query string with `?` prefix
  - `buildCacheKey(params)` - Build cache key string (no prefix)
  - `appendSort(queryString, sort)` - Append sort parameter to query string

## CORE PATTERN

```
┌──────────────────────────────────────────────────────┐
│ Component Layer                                       │
│ useSingleUser(), useUserList()                        │
├──────────────────────────────────────────────────────┤
│ Base Hooks Layer                                      │
│ useResource(), usePaginatedResource()                 │
├──────────────────────────────────────────────────────┤
│ CRUD Layer                                            │
│ createItem(), getItem(), updateItem(), deleteItem()   │
├──────────────────────────────────────────────────────┤
│ API Layer                                             │
│ api(), fileApi(), publicApi()                         │
└──────────────────────────────────────────────────────┘
```

## QUICK EXAMPLES

### Single Item Hook
```tsx
const { data: user, isLoading, updateItem } = useResource<UserInput, User>({
  resource: "users",
  id: userId,
});

// Update
await updateItem({ name: "New Name" });
```

### Paginated List Hook
```tsx
const { data: users, totalPages, isLoading } = usePaginatedResource<User>({
  resource: "users",
  page: currentPage,
  limit: 10,
  where: { status: { equals: "active" } },
  sort: "-createdAt",
});
```

### Domain-Specific Hook (wrap base hooks)
```tsx
const useSingleUser = (id?: string) => {
  const { data, ...rest } = useResource<UserInput, User>({
    resource: "users",
    id,
  });

  // Add domain logic (transform data, clear related caches, etc.)
  return { data, ...rest };
};
```

## ADDING NEW RESOURCE

1. Define types: `UserInput`, `User extends ResourceItem`
2. Create domain hook: `useSingleUser.ts` wrapping `useResource`
3. Create list hook: `useUserList.ts` wrapping `usePaginatedResource`
4. Add custom logic (transforms, related cache clearing)

## CACHE INVALIDATION

```tsx
import { invalidateResource, removeFromCache } from "~/lib/cache";

// After create/update - invalidate all items in resource
invalidateResource("users");

// After delete - remove specific item + invalidate list
removeFromCache("users", id);
invalidateResource("users");

// Related resources - clear dependent caches
invalidateResource("users");
invalidateResource("organizations"); // if users affect orgs
```

## SERIAL LOADING

When queries depend on each other, use the `serialLoading` pattern to prevent race conditions:

```tsx
// Child hook waits for parent data
const useProjectTasks = ({ projectId, serialLoading = false }) => {
  const { userId, isLoading: userLoading } = useCurrentUser();

  // Single boolean controls query execution
  const runQuery = Boolean(
    !serialLoading &&    // Not waiting for parent
    !userLoading &&      // Auth ready
    userId &&
    projectId
  );

  return usePaginatedResource({
    resource: "tasks",
    where: { project: { equals: projectId } },
    enabled: runQuery,
  });
};

// Parent passes its loading state
const ProjectDetails = ({ projectId }) => {
  const { data: project, isLoading } = useSingleProject(projectId);

  const { data: tasks } = useProjectTasks({
    projectId,
    serialLoading: isLoading, // Tasks wait for project
  });
};
```

See `patterns.md` → "Serial Loading Patterns" for:
- Multi-level dependency chains
- The `runQuery` flag pattern
- Preventing re-fetch after delete
- Best practices

## DEEP DIVE

See `patterns.md` for:
- Domain hook patterns (like useSingleOrder)
- Serial loading patterns (dependent queries)
- Optimistic updates
- Cross-resource cache dependencies
- File uploads
- Public vs authenticated endpoints
