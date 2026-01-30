# Drawer Patterns Guide

## URL-Synced vs Local State Drawers

### URL-Synced Drawers

Store drawer state in URL query parameters:
- Browser back button closes drawers
- Links can open specific drawers
- State survives page refresh
- Easy to stack multiple drawers

```tsx
// URL structure: ?d[0][n]=drawer-name&d[0][d][key]=value
// d = drawers array
// n = name
// d = data
```

### Local State Drawers

Store drawer state in React state:
- Simpler implementation
- Better for ephemeral UI (confirmations, tooltips)
- No URL pollution
- Faster (no navigation)

## Stacking Multiple Drawers

URL-synced drawers naturally support stacking:

```tsx
// Initial state
// URL: /page

// Open first drawer
openDrawer("user-list");
// URL: /page?d[0][n]=user-list

// Open second drawer
openDrawer("user-details");
// URL: /page?d[0][n]=user-list&d[1][n]=user-details

// Close second (back button or closeDrawer)
closeDrawer("user-details");
// URL: /page?d[0][n]=user-list
```

### Implementation

```tsx
const useDrawers = () => {
  // drawers is an array: [{ n: "name", d: data }, ...]
  const drawers = useMemo(() => query?.d || [], [query]);

  const openDrawer = (drawer) => {
    // Add to end of array
    const newDrawers = [...drawers, compressedDrawer];
    navigate(pathname + stringifyParams({ ...query, d: newDrawers }));
  };

  const closeDrawer = (drawer) => {
    // Remove from array
    const filtered = drawers.filter(d => d.n !== drawerName);
    navigate(pathname + stringifyParams({ ...query, d: filtered }));
  };
};
```

## Passing Data to Drawers

### Minimal Data Approach

Only pass IDs and modes - fetch full data inside drawer:

```tsx
// Good: Pass only what's needed
openDrawer({
  name: "edit-item",
  data: { id: "123", mode: "edit" }
});

// Inside drawer - fetch full data
const EditDrawer = () => {
  const { id } = getDrawerData("edit-item");
  const { data: item } = useQuery(["item", id], () => fetchItem(id));
  // ...
};
```

### Why Minimal Data?

1. **URL length limits** - Browsers limit URL length (~2000 chars)
2. **Security** - Don't expose sensitive data in URLs
3. **Performance** - Large data slows down navigation
4. **Freshness** - Fetched data is always current

### Data Structure (Compressed)

```tsx
// External format (URL): { n: "name", d: { key: "value" } }
// Internal format (code): { name: "name", data: { key: "value" } }

interface DrawerExternal {
  n: string;  // name (compressed)
  d: any;     // data (compressed)
}

interface DrawerInternal {
  name: string;
  data: any;
}
```

## Back Button Support

URL-synced drawers get back button support for free:

```tsx
// User clicks: Open drawer A → Open drawer B → Back button
// Result: Drawer B closes, drawer A still open

// Implementation: Each openDrawer() is a navigation
// navigate() adds to browser history
// Back button pops from history, restoring previous URL state
```

## Animation Patterns

### Slide-Up (Bottom Sheet)

```tsx
// Using motion (framer-motion)
const drawerVariants = {
  hidden: { y: "100%" },
  visible: { y: 0 },
};

<motion.div
  variants={drawerVariants}
  initial="hidden"
  animate="visible"
  exit="hidden"
  transition={{ duration: 0.3, ease: "easeInOut" }}
>
  {children}
</motion.div>
```

### Slide-In (Side Panel)

```tsx
// Using Tailwind + Headless UI transitions
<TransitionChild
  enter="transform transition ease-in-out duration-300"
  enterFrom="translate-x-full"
  enterTo="translate-x-0"
  leave="transform transition ease-in-out duration-200"
  leaveFrom="translate-x-0"
  leaveTo="translate-x-full"
>
  <div className="fixed inset-y-0 right-0 w-96">
    {children}
  </div>
</TransitionChild>
```

### Backdrop Fade

```tsx
<TransitionChild
  enter="ease-out duration-300"
  enterFrom="opacity-0"
  enterTo="opacity-100"
  leave="ease-in duration-200"
  leaveFrom="opacity-100"
  leaveTo="opacity-0"
>
  <div className="fixed inset-0 bg-gray-500/75" />
</TransitionChild>
```

## Headless UI Dialog Integration

```tsx
import { Dialog, Transition, TransitionChild } from "@headlessui/react";
import { Fragment } from "react";

const Drawer = ({ open, onClose, children }) => (
  <Transition show={open} as={Fragment}>
    <Dialog
      as="div"
      className="fixed inset-0 z-50 overflow-hidden"
      onClose={onClose}
    >
      {/* Backdrop */}
      <TransitionChild
        as={Fragment}
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black/50" />
      </TransitionChild>

      {/* Drawer panel */}
      <TransitionChild
        as={Fragment}
        enter="transform transition ease-in-out duration-300"
        enterFrom="translate-x-full"
        enterTo="translate-x-0"
        leave="transform transition ease-in-out duration-200"
        leaveFrom="translate-x-0"
        leaveTo="translate-x-full"
      >
        <Dialog.Panel className="fixed inset-y-0 right-0 w-full max-w-md bg-white">
          {children}
        </Dialog.Panel>
      </TransitionChild>
    </Dialog>
  </Transition>
);
```

## Multi-Page Drawers

For drawers with multiple steps/pages:

```tsx
const [currentPage, setCurrentPage] = useState("step1");

<SlideUpDrawer open={isOpen} onClose={handleClose}>
  <SectionSlider currentId={currentPage}>
    <SlidePage id="step1" active={currentPage === "step1"}>
      <Step1 onNext={() => setCurrentPage("step2")} />
    </SlidePage>
    <SlidePage id="step2" active={currentPage === "step2"}>
      <Step2 onBack={() => setCurrentPage("step1")} />
    </SlidePage>
  </SectionSlider>
</SlideUpDrawer>
```

## Best Practices

### Drawer Naming

```tsx
// Good: Descriptive, action-based
"create-user"
"edit-invoice"
"view-transaction-details"
"confirm-delete"

// Bad: Generic, unclear
"modal1"
"drawer"
"popup"
```

### Loading States

```tsx
const DrawerContent = () => {
  const { id } = getDrawerData("item-details");
  const { data, isLoading } = useQuery(["item", id]);

  if (isLoading) {
    return <DrawerSkeleton />;
  }

  return <ItemDetails item={data} />;
};
```

### Error Handling

```tsx
const DrawerContent = () => {
  const { id } = getDrawerData("item-details");
  const { data, isLoading, error } = useQuery(["item", id]);

  if (error) {
    return (
      <DrawerError
        message="Failed to load item"
        onRetry={() => refetch()}
        onClose={() => closeDrawer("item-details")}
      />
    );
  }

  // ...
};
```

### Preventing Body Scroll

```tsx
// Headless UI Dialog handles this automatically
// For custom implementations:
useEffect(() => {
  if (open) {
    document.body.style.overflow = "hidden";
  }
  return () => {
    document.body.style.overflow = "";
  };
}, [open]);
```

## Dependencies

```bash
# Required
npm install @headlessui/react

# For animations (optional)
npm install motion
# or
npm install framer-motion
```
