# URL State Quick Reference

## BEFORE YOU START

Check user's project:
1. Does `useUrlParams` or similar hook exist? → Follow their patterns
2. Is `qs` library installed? → Use existing query string utilities
3. Are URL params already used for filters/pagination? → Integrate with existing approach

## WHEN TO USE URL STATE

Use URL state instead of React state when:
- State should survive page refresh
- State should be shareable via URL
- State needs browser back/forward button support
- Filters, pagination, sort order, selected tabs

Use React state when:
- Temporary UI state (hover, focus)
- Form input before submission
- Modal open/close (unless you want URL-synced drawers)

## TEMPLATES

All templates are in the `templates/` subdirectory.

| File | Use for |
|------|---------|
| queryString.ts | Parse/stringify URL params (utility) |
| useUrlParams.ts | Get/set URL params (hook) |
| useModals.ts | URL-synced modal state (multiple modals, pass data) |

**Note:** There are two separate queryString.ts files:
- `url-state/templates/queryString.ts` - Client-side URL parsing (`parseParams`, `stringifyParams`)
- `utils/queryString.ts` - API/data-fetching layer (`buildQueryString`, `buildCacheKey`)

## CORE PATTERNS

### 1. Basic URL Params

```tsx
import useUrlParams from "~/hooks/useUrlParams";

const MyComponent = () => {
  const { params, setUrlParams, clearAllParams } = useUrlParams();

  // Read params
  const page = params.page || 1;
  const search = params.search || "";

  // Set params (merges with existing)
  const handleSearch = (value: string) => {
    setUrlParams({ search: value, page: 1 });
  };

  // Clear all params
  const handleReset = () => {
    clearAllParams();
  };
};
```

### 2. Query String Utilities

```tsx
import { parseParams, stringifyParams } from "~/utils/queryString";

// Parse: "?page=1&search=hello" → { page: "1", search: "hello" }
const params = parseParams(window.location.search);

// Stringify: { page: 1, search: "hello" } → "?page=1&search=hello"
const queryString = stringifyParams({ page: 1, search: "hello" });
```

### 3. Nested Objects

```tsx
// Supports nested objects with dot notation
setUrlParams({
  filters: {
    status: "active",
    category: "electronics"
  }
});
// URL: ?filters.status=active&filters.category=electronics
```

### 4. Filter Pattern

```tsx
const FilteredList = () => {
  const { params, setUrlParams } = useUrlParams();

  // Extract filter values with defaults
  const filters = {
    status: params.status || "all",
    sortBy: params.sortBy || "date",
    page: Number(params.page) || 1,
  };

  // Update single filter (preserves others)
  const setFilter = (key: string, value: string | number) => {
    setUrlParams({ ...params, [key]: value });
  };

  // Reset to defaults
  const resetFilters = () => {
    setUrlParams({ page: 1 }); // Keep only pagination
  };
};
```

## CORE RULES

1. Always provide defaults when reading params (they can be undefined)
2. Convert numeric params explicitly: `Number(params.page) || 1`
3. Use `setUrlParams` to merge - it won't remove existing params unless you explicitly set them to undefined
4. The hook includes change detection - identical updates won't cause navigation
5. Empty values are automatically removed from the URL

## DEPENDENCIES

```bash
npm install qs
npm install -D @types/qs
```

### 5. URL-Synced Modals (useModals)

For modals that need shareable URLs and support multiple open simultaneously:

```tsx
import useModals from "~/hooks/useModals";

const ProductPage = () => {
  const { openModal, closeModal, isModalOpen, getModalData } = useModals("edit-product");

  // Open modal (URL: ?m=[{n:"edit-product"}])
  const handleEdit = () => openModal();

  // Open with data (URL: ?m=[{n:"edit-product",d:{id:"123"}}])
  const handleEditWithData = (id: string) => {
    openModal({ name: "edit-product", data: { id } });
  };

  return (
    <>
      <button onClick={() => handleEditWithData("123")}>Edit</button>

      {isModalOpen() && (
        <Modal onClose={() => closeModal()}>
          <EditForm productId={getModalData().id} />
        </Modal>
      )}
    </>
  );
};
```

**Multiple modals open at once:**

```tsx
const editModal = useModals("edit");
const confirmModal = useModals("confirm");

// Both can be open (URL: ?m=[{n:"edit"},{n:"confirm"}])
editModal.openModal();
confirmModal.openModal({ data: { action: "delete" } });

// Check if any modal is open
const { areAnyModalsOpen } = useModals();
if (areAnyModalsOpen()) {
  // Show backdrop, disable scroll, etc.
}
```

**Public pages (no auth required):**

```tsx
import { usePublicModals } from "~/hooks/useModals";

const PublicPricingPage = () => {
  const { openModal, isModalOpen } = usePublicModals("feature-details");
  // Works without authentication context
};
```

## DEEP DIVE

- Full patterns guide → url-params-patterns.md
- URL-synced drawers → ../drawers/INDEX.md
- URL-synced modals → templates/useModals.ts
