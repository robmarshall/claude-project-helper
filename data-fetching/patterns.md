# Data Fetching Patterns

Advanced patterns for REST API + TanStack Query integration.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ Component Layer                                          │
│ Pages, templates consuming domain hooks                  │
├─────────────────────────────────────────────────────────┤
│ Domain Hooks Layer                                       │
│ useSingleUser(), useUserList(), useSingleOrder()         │
│ Business logic, transforms, related cache invalidation   │
├─────────────────────────────────────────────────────────┤
│ Base Hooks Layer                                         │
│ useResource(), usePaginatedResource()                    │
│ TanStack Query integration, generic CRUD                 │
├─────────────────────────────────────────────────────────┤
│ CRUD Layer                                               │
│ createItem(), getItem(), updateItem(), deleteItem()      │
│ Generic REST operations, error handling                  │
├─────────────────────────────────────────────────────────┤
│ API Layer                                                │
│ api(), fileApi(), publicApi()                            │
│ Fetch wrapper, auth, token refresh                       │
├─────────────────────────────────────────────────────────┤
│ Utils Layer                                              │
│ buildQueryString(), buildCacheKey(), appendSort()        │
│ Shared helpers used across layers                        │
└─────────────────────────────────────────────────────────┘
```

## Utilities (`~/utils/queryString.ts`)

Query string helpers centralize the `qs` library configuration. Located at project root `utils/` folder:

```tsx
import { buildQueryString, buildCacheKey, appendSort } from "~/utils/queryString";

// Build URL query string (with ? prefix)
const url = `/api/users${buildQueryString({ page: 1, limit: 10 })}`;
// Result: "/api/users?page=1&limit=10"

// Build cache key (no prefix)
const cacheKey = `users-${buildCacheKey({ page: 1, where: { active: true } })}`;
// Result: "users-page=1&where.active=true"

// Append sort to existing query string
const urlWithSort = appendSort("?page=1", ["-createdAt", "name"]);
// Result: "?page=1&sort=-createdAt,name"
```

**Why centralize?**
- Consistent `qs` options across the codebase
- Single place to modify query string behavior
- Reduces import noise in CRUD/hook files

## Domain Hook Pattern

Domain hooks wrap base hooks with business-specific logic:

```tsx
// hooks/users/useSingleUser.ts
import useResource from "~/lib/useResource";
import { invalidateResource } from "~/lib/cache";

interface UserInput {
  name: string;
  email: string;
  avatar?: File;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

const useSingleUser = (id?: string | null) => {
  const { createItem, updateItem, data, ...rest } = useResource<UserInput, User>({
    resource: "users",
    id,
  });

  // Custom create with side effects
  const createUser = async (input: UserInput) => {
    const result = await createItem(input);

    if (result.success) {
      // Clear related caches
      invalidateResource("organizations");
      invalidateResource("team-members");
    }

    return result;
  };

  // Custom update with transforms
  const updateUser = async (input: Partial<UserInput>) => {
    const result = await updateItem(input);

    if (result.success) {
      invalidateResource("team-members");
    }

    return result;
  };

  // Transform output data
  const transformedData = data
    ? {
        ...data,
        displayName: data.name || data.email.split("@")[0],
      }
    : undefined;

  return {
    createItem: createUser,
    updateItem: updateUser,
    data: transformedData,
    ...rest,
  };
};

export default useSingleUser;
```

## Currency/Number Transforms

Common pattern for storing integers, displaying decimals:

```tsx
// utils/currency.ts
export const toIntegerCurrency = (value: number): number => {
  return Math.round(value * 100);
};

export const toWholeCurrency = (value: number): number => {
  return value / 100;
};

// hooks/orders/useSingleOrder.ts
const useSingleOrder = (id?: string) => {
  const { createItem, data, ...rest } = useResource<OrderInput, Order>({
    resource: "orders",
    id,
  });

  const createOrder = async (input: OrderInput) => {
    // Transform before saving
    const transformed = {
      ...input,
      amount: toIntegerCurrency(input.amount),
      tax: toIntegerCurrency(input.tax),
    };
    return createItem(transformed);
  };

  // Transform for display
  const transformedData = data
    ? {
        ...data,
        amount: toWholeCurrency(data.amount),
        tax: toWholeCurrency(data.tax),
      }
    : undefined;

  return {
    createItem: createOrder,
    data: transformedData,
    ...rest,
  };
};
```

## Cross-Resource Cache Dependencies

When resources are related, clear dependent caches:

```tsx
// Common dependency patterns
const CACHE_DEPENDENCIES = {
  users: ["team-members", "organizations"],
  orders: ["invoices", "payments", "customers"],
  products: ["orders", "inventory"],
  projects: ["tasks", "comments", "team-members"],
};

// In domain hook
const updateItem = async (input) => {
  const result = await baseUpdateItem(input);

  if (result.success) {
    // Clear this resource
    invalidateResource("orders");

    // Clear dependent resources
    CACHE_DEPENDENCIES.orders?.forEach(invalidateResource);
  }

  return result;
};
```

## File Upload Pattern

Handle file uploads alongside regular data:

```tsx
const useSingleDocument = (id?: string) => {
  const { createItem, updateItem, ...rest } = useResource<DocumentInput, Document>({
    resource: "documents",
    id,
  });

  // File is automatically handled by useResource
  const uploadDocument = async (input: { title: string; file: File }) => {
    return createItem(input); // file property triggers fileApi
  };

  const replaceFile = async (file: File) => {
    return updateItem({ file }); // update with new file
  };

  return {
    uploadDocument,
    replaceFile,
    ...rest,
  };
};
```

## Conditional Fetching

Control when queries run:

```tsx
// Wait for parent data
const useUserOrders = (userId?: string) => {
  return usePaginatedResource<Order>({
    resource: "orders",
    where: { userId: { equals: userId } },
    enabled: Boolean(userId), // Don't fetch until userId exists
  });
};
```

## Serial Loading Patterns

Serial loading prevents race conditions when queries depend on each other. This is critical for avoiding:
- Queries running with undefined IDs
- Flickering UI from multiple loading states
- Wasted API calls

### Pattern 1: Simple Dependency Chain

```tsx
const useOrganizationData = () => {
  const { data: user, isLoading: userLoading } = useSingleUser(currentUserId);

  const { data: org, isLoading: orgLoading } = useResource({
    resource: "organizations",
    id: user?.organizationId,
    enabled: !userLoading && Boolean(user?.organizationId),
  });

  return {
    user,
    organization: org,
    isLoading: userLoading || orgLoading,
  };
};
```

### Pattern 2: The `runQuery` Flag

For complex dependencies, compute a single boolean:

```tsx
const useData = <T>({
  resource,
  id,
  serialLoading = false,
}: {
  resource: string;
  id?: string | null;
  serialLoading?: boolean;
}) => {
  const { userId, isLoading: userLoading } = useCurrentUser();
  const [isDeleted, setIsDeleted] = useState(false);

  // Single boolean that controls query execution
  const runQuery = Boolean(
    !serialLoading &&      // Not waiting for external data
    !userLoading &&        // User context is ready
    userId &&              // We have a user
    resource &&            // Resource type specified
    id &&                  // We have an ID to fetch
    !isDeleted             // Item hasn't been deleted
  );

  const { data, isLoading } = useQuery({
    queryKey: [resource, id, userId],
    queryFn: () => fetchItem(resource, id),
    enabled: runQuery,
  });

  return {
    data,
    isLoading: isLoading || userLoading || serialLoading,
  };
};
```

### Pattern 3: External Serial Loading Control

Pass `serialLoading` prop to wait for parent-controlled state:

```tsx
// Parent component controls when child can fetch
const ProjectDetails = ({ projectId }: { projectId: string }) => {
  const { data: project, isLoading: projectLoading } = useSingleProject(projectId);

  // Tasks wait for project to load first
  const { data: tasks } = useProjectTasks({
    projectId,
    serialLoading: projectLoading, // Pass parent loading state
  });

  // Comments also wait
  const { data: comments } = useProjectComments({
    projectId,
    serialLoading: projectLoading,
  });

  return (
    <div>
      <ProjectHeader project={project} />
      <TasksList tasks={tasks} />
      <CommentsList comments={comments} />
    </div>
  );
};

// Child hook respects serialLoading
const useProjectTasks = ({
  projectId,
  serialLoading = false,
}: {
  projectId: string;
  serialLoading?: boolean;
}) => {
  const { userId, isLoading: userLoading } = useCurrentUser();

  const runQuery = Boolean(
    !serialLoading &&
    !userLoading &&
    userId &&
    projectId
  );

  return usePaginatedResource({
    resource: "tasks",
    where: { project: { equals: projectId } },
    enabled: runQuery,
  });
};
```

### Pattern 4: Multi-Level Dependencies

For deep dependency chains, cascade the loading states:

```tsx
const useFullOrderContext = (orderId: string) => {
  // Level 1: Order
  const {
    data: order,
    isLoading: orderLoading
  } = useSingleOrder(orderId);

  // Level 2: Line Items (depends on order)
  const {
    data: lineItems,
    isLoading: itemsLoading
  } = useOrderLineItems({
    orderId,
    serialLoading: orderLoading,
  });

  // Level 3: Products (depends on line items)
  const {
    data: products,
    isLoading: productsLoading
  } = useProductsByIds({
    productIds: lineItems?.map(item => item.productId) || [],
    serialLoading: orderLoading || itemsLoading,
  });

  // Level 4: Inventory (depends on products)
  const {
    data: inventory,
    isLoading: inventoryLoading
  } = useProductInventory({
    productIds: products?.map(p => p.id) || [],
    serialLoading: orderLoading || itemsLoading || productsLoading,
  });

  return {
    order,
    lineItems,
    products,
    inventory,
    isLoading: orderLoading || itemsLoading || productsLoading || inventoryLoading,
  };
};
```

### Pattern 5: Prevent Re-fetch After Delete

Track deleted state to prevent queries from re-running:

```tsx
const useData = ({ resource, id }) => {
  const previousIdRef = useRef(id);
  const [isDeleted, setIsDeleted] = useState(false);

  // Reset deleted state when ID changes
  useEffect(() => {
    if (id !== previousIdRef.current) {
      setIsDeleted(false);
      previousIdRef.current = id;
    }
  }, [id]);

  const runQuery = Boolean(id && !isDeleted);

  const { data, isLoading, refetch } = useQuery({
    queryKey: [resource, id],
    queryFn: () => fetchItem(resource, id),
    enabled: runQuery,
  });

  const deleteItem = async () => {
    const result = await deleteFromApi(resource, id);

    if (result.success) {
      setIsDeleted(true); // Prevent refetch
      queryClient.removeQueries({ queryKey: [resource, id] });
      invalidateResource(resource);
    }

    return result;
  };

  // Safe refetch that respects deleted state
  const safeRefetch = () => {
    if (!isDeleted) {
      refetch();
    }
  };

  return {
    data,
    isLoading,
    deleteItem,
    refetch: safeRefetch,
    isDeleted,
  };
};
```

### Best Practices for Serial Loading

**Do:**
- Compute a single `runQuery` boolean for clarity
- Combine all loading states: `isLoading: loading1 || loading2 || loading3`
- Pass `serialLoading` prop for parent-controlled waiting
- Reset state when IDs change
- Track deleted state to prevent zombie fetches

**Don't:**
- Run queries with undefined/null IDs
- Forget to include `serialLoading` in composite loading state
- Create circular dependencies between hooks
- Ignore loading states from authentication context

## Query String Patterns

Building filter queries:

```tsx
// Simple equality
const { data } = usePaginatedResource({
  resource: "users",
  where: { status: { equals: "active" } },
});

// Multiple conditions
const { data } = usePaginatedResource({
  resource: "orders",
  where: {
    status: { in: ["pending", "processing"] },
    amount: { greater_than: 1000 },
    createdAt: { greater_than: "2024-01-01" },
  },
});

// Sorting
const { data } = usePaginatedResource({
  resource: "products",
  sort: "-createdAt", // descending
  // or multiple: sort: ["-featured", "name"]
});
```

## Error Handling in Components

```tsx
const UserProfile = ({ userId }: { userId: string }) => {
  const { data, isLoading, updateItem } = useSingleUser(userId);

  const handleUpdate = async (values: UserInput) => {
    const result = await updateItem(values);

    if (result.success) {
      toast.success("Profile updated");
    } else {
      toast.error(result.message || "Update failed");
    }
  };

  if (isLoading) return <Spinner />;
  if (!data) return <NotFound />;

  return <UserForm data={data} onSubmit={handleUpdate} />;
};
```

## Optimistic Updates (Advanced)

For better UX, update UI before server confirms:

```tsx
const useOptimisticUpdate = <T extends ResourceItem>(
  resource: string,
  id: string
) => {
  const queryClient = useQueryClient();
  const cacheKey = createCacheKey(resource, id);

  const optimisticUpdate = async (
    newData: Partial<T>,
    updateFn: () => Promise<ApiResponse<T>>
  ) => {
    // Snapshot previous value
    const previous = queryClient.getQueryData([cacheKey]);

    // Optimistically update
    queryClient.setQueryData([cacheKey], (old: ApiResponse<T> | undefined) => ({
      success: true,
      data: { ...old?.data, ...newData },
    }));

    try {
      const result = await updateFn();

      if (!result.success) {
        // Rollback on failure
        queryClient.setQueryData([cacheKey], previous);
      }

      return result;
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData([cacheKey], previous);
      throw error;
    }
  };

  return optimisticUpdate;
};
```

## Public vs Authenticated Endpoints

```tsx
// Public - no auth required
const usePublicProducts = () => {
  return usePaginatedResource<Product>({
    resource: "products",
    publicEndpoint: true,
  });
};

// Or use the dedicated hook
import { usePublicPaginatedResource } from "~/lib/usePaginatedResource";

const usePublicProducts = () => {
  return usePublicPaginatedResource<Product>({
    resource: "products",
  });
};
```

## Best Practices

### Do
- Create domain hooks for each resource type
- Use `invalidateResource()` after mutations
- Handle loading and error states in components
- Transform data in domain hooks, not components
- Use conditional `enabled` for dependent queries

### Don't
- Call API functions directly from components
- Forget to invalidate related caches
- Ignore error responses from mutations
- Create hooks that fetch everything at once
- Use `clearAllCache()` when targeted invalidation works
