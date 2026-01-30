# Tabs Component

Tab navigation with responsive mobile/desktop layouts and automatic current tab detection.

## Features

- Automatic current tab detection based on URL pathname matching
- Responsive design: select dropdown on mobile, tab bar on desktop
- Count badges with red notification styling (supports 99+ limit)
- Loading state with `GhostTabs` skeleton
- Accessible with proper ARIA attributes

## Components

| Component | Description |
|-----------|-------------|
| `Tabs` | Main component with automatic current detection |
| `PureTabs` | Pure component for manual current state |
| `GhostTabs` | Loading skeleton placeholder |
| `TabBody` | Content wrapper for tab panels |

## Dependencies

Requires `react-router` for navigation:

```bash
npm install react-router
```

## Basic Usage

```tsx
import Tabs, { TabBody } from "~/components/tabs";

const PropertyLayout = () => {
  const { propertyId } = useParams();

  const tabs = [
    { name: "Units", href: `/properties/${propertyId}` },
    { name: "Notes", href: `/properties/${propertyId}/notes` },
    { name: "Files", href: `/properties/${propertyId}/files` },
    { name: "Leases", href: `/properties/${propertyId}/leases` },
    { name: "Transactions", href: `/properties/${propertyId}/transactions` },
  ];

  return (
    <>
      <Tabs tabs={tabs} isLoading={isLoading} />
      <TabBody>
        <Outlet />
      </TabBody>
    </>
  );
};
```

## With Count Badges

Display notification counts on tabs:

```tsx
const tabs = [
  { name: "Inbox", href: "/inbox", count: 5 },
  { name: "Sent", href: "/sent" },
  { name: "Drafts", href: "/drafts", count: 2 },
  { name: "Spam", href: "/spam", count: 127 }, // Shows "99+"
];

<Tabs tabs={tabs} />
```

## Tab Interface

```tsx
interface Tab {
  name: string;       // Display label
  href: string;       // Navigation URL
  current?: boolean;  // Manually set current (used by PureTabs)
  count?: number;     // Optional badge count
}
```

## Manual Current State (PureTabs)

For cases where you need to control the current state manually:

```tsx
import { PureTabs } from "~/components/tabs";

const [activeTab, setActiveTab] = useState("overview");

const tabs = [
  { name: "Overview", href: "#overview", current: activeTab === "overview" },
  { name: "Settings", href: "#settings", current: activeTab === "settings" },
  { name: "Advanced", href: "#advanced", current: activeTab === "advanced" },
];

<PureTabs tabs={tabs} />
```

## Loading State

```tsx
// Shows skeleton placeholders while loading
<Tabs tabs={tabs} isLoading={true} />

// Or use GhostTabs directly
import { GhostTabs } from "~/components/tabs";

{isLoading ? <GhostTabs tabs={tabs} /> : <Tabs tabs={tabs} />}
```

## How Current Tab Detection Works

The `Tabs` component automatically determines the current tab by:

1. Normalizing the current pathname (removing trailing slashes)
2. Finding the tab whose `href` is the longest match that starts with the pathname
3. This allows nested routes to highlight the correct parent tab

Example: If the pathname is `/properties/123/notes/456`:
- `/properties/123` → Not current (shorter match)
- `/properties/123/notes` → **Current** (longest match)
- `/properties/123/files` → Not current (doesn't match)

## Responsive Behavior

**Mobile (< sm breakpoint):**
- Fixed position at bottom of screen
- Select dropdown for navigation
- Shows "Menu" label

**Desktop (≥ sm breakpoint):**
- Horizontal tab bar with underline indicator
- Hover effects on inactive tabs
- Blue underline and text for current tab

## Real-World Example

```tsx
import { Outlet, useParams } from "react-router";
import Tabs from "~/components/tabs";
import Breadcrumbs from "~/components/Breadcrumbs";
import PropertyHeader from "~/molecules/PropertyHeader";

const LayoutProperty = () => {
  const { propertyId } = useParams();
  const { data, isLoading } = useProperty(propertyId);

  const tabs = [
    { name: "Units", href: `/properties/${propertyId}` },
    { name: "Notes", href: `/properties/${propertyId}/notes` },
    { name: "Files", href: `/properties/${propertyId}/files` },
    { name: "Leases", href: `/properties/${propertyId}/leases` },
    { name: "Transactions", href: `/properties/${propertyId}/transactions` },
    { name: "Security Deposits", href: `/properties/${propertyId}/security-deposits` },
    { name: "Maintenance", href: `/properties/${propertyId}/maintenance` },
    { name: "Condition Reports", href: `/properties/${propertyId}/condition-reports` },
  ];

  return (
    <>
      <Breadcrumbs crumbs={breadcrumbs} isLoading={isLoading} />
      <PropertyHeader
        name={data?.name}
        image={data?.image}
        isLoading={isLoading}
      />
      <Tabs tabs={tabs} isLoading={isLoading} />
      <Outlet />
    </>
  );
};
```

## Styling Notes

- Current tab: `border-blue-600 text-blue-600`
- Inactive tab: `border-transparent text-gray-500`
- Hover (inactive): `hover:border-gray-300 hover:text-gray-700`
- Count badge: `bg-red-500 text-white rounded-full`
