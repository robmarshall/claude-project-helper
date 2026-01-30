# Drawers Quick Reference

## BEFORE YOU START

Check user's project:
1. Does a drawer/modal system exist? → Follow their patterns
2. Should drawers be URL-synced? → Use useDrawers hook
3. Is @headlessui/react installed? → Use for accessible dialogs
4. Does the project use motion/framer-motion? → Use for animations

## URL-SYNCED VS LOCAL STATE

| Feature | URL-Synced | Local State |
|---------|------------|-------------|
| Back button closes | Yes | No |
| Shareable links | Yes | No |
| Multiple stacked | Easy | Manual |
| Pass data to drawer | Via URL | Via props |
| Complexity | Higher | Lower |

**Use URL-synced** for: Primary actions, forms, detail views
**Use local state** for: Confirmations, tooltips, simple modals

## TEMPLATES

All templates are in the `templates/` subdirectory.

| File | Use for |
|------|---------|
| useDrawers.ts | URL-synced drawer state management |
| SlideUpDrawer.tsx | Bottom sheet with animations |
| Drawer.tsx | Side panel (simpler alternative) |

## CORE PATTERNS

### 1. URL-Synced Drawer

```tsx
import useDrawers from "~/hooks/useDrawers";

const MyComponent = () => {
  const { openDrawer, closeDrawer, isDrawerOpen, getDrawerData } = useDrawers();

  // Open drawer
  const handleEdit = (item) => {
    openDrawer({ name: "edit-item", data: { itemId: item.id } });
  };

  // Check if open
  const isOpen = isDrawerOpen("edit-item");

  // Get attached data
  const { itemId } = getDrawerData("edit-item");

  return (
    <>
      <button onClick={() => handleEdit(item)}>Edit</button>

      <SlideUpDrawer
        open={isOpen}
        onClose={() => closeDrawer("edit-item")}
      >
        <EditForm itemId={itemId} />
      </SlideUpDrawer>
    </>
  );
};
```

### 2. Simple Local State Drawer

```tsx
import { useState } from "react";
import Drawer from "~/components/Drawer";

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>

      <Drawer open={isOpen} onClose={() => setIsOpen(false)}>
        <DrawerContent />
      </Drawer>
    </>
  );
};
```

### 3. Stacking Multiple Drawers

```tsx
// URL-synced drawers support stacking automatically
// URL: ?d[0][n]=drawer1&d[1][n]=drawer2

// Open first drawer
openDrawer("user-details");

// Open second drawer on top
openDrawer("edit-user");

// Close top drawer (back button also works)
closeDrawer("edit-user");
```

### 4. Passing Data to Drawers

```tsx
// Open with data
openDrawer({
  name: "invoice-details",
  data: {
    invoiceId: "123",
    mode: "edit",
  }
});

// Read data in drawer component
const InvoiceDrawer = () => {
  const { getDrawerData, isDrawerOpen } = useDrawers("invoice-details");

  if (!isDrawerOpen()) return null;

  const { invoiceId, mode } = getDrawerData();

  return <InvoiceForm id={invoiceId} mode={mode} />;
};
```

## CORE RULES

1. Use `useDrawers` hook for URL-synced state
2. Always provide `onClose` handler for accessibility
3. Drawer names should be unique and descriptive
4. Use kebab-case for drawer names: `"edit-user"`, `"invoice-details"`
5. Data passed to drawers is serialized in URL (keep it minimal)
6. Back button automatically closes the top drawer

## DEPENDENCIES

```bash
npm install @headlessui/react motion
```

Or for simpler drawers without animations:
```bash
npm install @headlessui/react
```

## DEEP DIVE

- Full patterns guide → drawer-patterns.md
- URL state management → ../url-state/INDEX.md
