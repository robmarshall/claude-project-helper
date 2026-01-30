# Table Components

Modular table component system with sorting, selection, responsive design, and mobile optimization.

## Component Overview

### Core Components

- **`TableWrapper`** - Container with responsive overflow and optional borders
- **`TableHeader`** - Header with column definitions, sorting, and selection controls
- **`TableRow`** - Row with hover states, highlighting, and child row styling
- **`TableCell`** - Flexible cell (static, link, or button) with mobile visibility
- **`TablePrimaryAction`** - Action cell with consistent blue styling

### Supporting Components

- **`TableSelect`** - Row selection checkbox with accessibility
- **`TableMenuPopover`** - Dropdown menu for multiple row actions
- **`TableAccordionArrow`** - Expandable row controls with animation
- **`SelectActionBar`** - Batch action controls with loading/error states
- **`TableDetailsPopover`** - Mobile bottom sheet showing all column data

## Dependencies

```bash
npm install @headlessui/react @heroicons/react motion
```

## Basic Usage

```tsx
import {
  TableWrapper,
  TableHeader,
  TableRow,
  TableCell,
  TablePrimaryAction,
} from "~/components/table";

const columns = [
  { path: "name", label: "Name", mobileVisible: true },
  { path: "email", label: "Email" },
  { path: "date", label: "Created", width: "150px" },
  { key: "actions", hideLabel: true, label: "View" },
];

const DataTable = ({ data }) => (
  <TableWrapper>
    <caption className="sr-only">List of {data.length} items</caption>
    <TableHeader columns={columns} />
    <tbody className="divide-y divide-gray-100 bg-white">
      {data.map((item) => (
        <TableRow key={item.id}>
          <TableCell href={`/items/${item.id}`} mobileVisible>
            {item.name}
          </TableCell>
          <TableCell href={`/items/${item.id}`}>{item.email}</TableCell>
          <TableCell href={`/items/${item.id}`}>{item.date}</TableCell>
          <TablePrimaryAction href={`/items/${item.id}`}>
            View
          </TablePrimaryAction>
        </TableRow>
      ))}
    </tbody>
  </TableWrapper>
);
```

## Column Configuration

```tsx
interface ColumnProps {
  path?: string;           // Data field path
  key?: string;            // Unique key when path doesn't match data
  label?: string;          // Display label in header
  width?: string;          // Fixed width (e.g., "150px")
  hideLabel?: boolean;     // Hide label for action columns
  mobileVisible?: boolean; // Show column on mobile (default: false)
  mobileOrder?: number;    // Order priority for mobile display
  mobileLabel?: string;    // Alternative label for mobile
  stack?: boolean;         // Stack label above content in details popover
}

const columns = [
  // Mobile-visible column
  { path: "name", label: "Customer Name", mobileVisible: true, mobileOrder: 1 },
  // Desktop-only column
  { path: "email", label: "Email Address" },
  // Fixed width column
  { path: "date", label: "Created", width: "150px" },
  // Action column (hidden label for accessibility)
  { key: "actions", hideLabel: true, label: "Actions" },
];
```

## With Sorting

```tsx
import { useState } from "react";
import type { SortColumn } from "~/components/table";

const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);

const handleSort = (newSort: SortColumn) => {
  if (sortColumn?.path === newSort.path) {
    setSortColumn({
      ...newSort,
      order: sortColumn.order === "asc" ? "desc" : "asc",
    });
  } else {
    setSortColumn(newSort);
  }
};

<TableHeader columns={columns} sortColumn={sortColumn} onSort={handleSort} />;
```

## With Row Selection

```tsx
import { useRef, useState } from "react";
import {
  TableWrapper,
  TableHeader,
  TableRow,
  TableCell,
  TableSelect,
  SelectActionBar,
} from "~/components/table";

const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
const [selectAll, setSelectAll] = useState(false);
const tableRef = useRef<HTMLTableElement>(null);

const handleSelectAll = (selected: boolean) => {
  if (selected) {
    setSelectedRows(new Set(data.map((item) => item.id)));
  } else {
    setSelectedRows(new Set());
  }
  setSelectAll(selected);
};

const handleRowSelect = (id: string, ref: HTMLInputElement | null) => {
  const newSelected = new Set(selectedRows);
  if (ref?.checked) {
    newSelected.add(id);
  } else {
    newSelected.delete(id);
  }
  setSelectedRows(newSelected);
  setSelectAll(newSelected.size === data.length);
};

<>
  <TableWrapper ref={tableRef}>
    <TableHeader
      columns={columns}
      selectAll
      selected={selectAll}
      onSelectAll={handleSelectAll}
    />
    <tbody>
      {data.map((item) => (
        <TableRow key={item.id}>
          <TableSelect
            id={item.id}
            selected={selectedRows.has(item.id)}
            onSelectClick={(ref) => handleRowSelect(item.id, ref)}
          />
          <TableCell>{item.name}</TableCell>
        </TableRow>
      ))}
    </tbody>
  </TableWrapper>

  <SelectActionBar
    active={selectedRows.size > 0}
    error={false}
    actions={[
      {
        id: "delete",
        label: "Delete Selected",
        onClick: async () => {
          await handleBulkDelete(Array.from(selectedRows));
          setSelectedRows(new Set());
        },
      },
    ]}
    onClose={() => setSelectedRows(new Set())}
    onErrorClose={() => {}}
    tableRef={tableRef}
  />
</>;
```

## With Mobile Details Popover

For mobile-responsive tables, use `TableDetailsPopover` to show full row data in a bottom sheet:

```tsx
import {
  TableWrapper,
  TableHeader,
  TableRow,
  TableCell,
  TableDetailsPopover,
} from "~/components/table";

const columns = [
  { path: "name", label: "Name", mobileVisible: true },
  { path: "description", label: "Description", stack: true },
  { key: "action", hideLabel: true, label: "View" },
];

const FileTable = ({ files }) => (
  <TableWrapper>
    <TableHeader columns={columns} />
    <tbody className="divide-y divide-gray-100 bg-white">
      {files.map((file) => {
        // Create row data object for the popover
        const rowData = {
          name: <div className="text-gray-900">{file.name}</div>,
          description: <div>{file.description}</div>,
        };

        return (
          <TableRow key={file.id}>
            <TableCell href={`/files/${file.id}`} mobileVisible>
              {rowData.name}
            </TableCell>
            <TableCell href={`/files/${file.id}`}>
              {rowData.description}
            </TableCell>
            <TableCell href={`/files/${file.id}`} fitTight removeFixedWidth>
              <ChevronRightIcon className="h-5 w-5 text-gray-500" />
            </TableCell>

            {/* Mobile Details Popover - Only visible on mobile */}
            <TableCell mobileVisible removeFixedWidth>
              <TableDetailsPopover
                columns={columns}
                rowData={rowData}
                triggerText="Details"
                title="File Details"
                href={`/files/${file.id}`}
              />
            </TableCell>
          </TableRow>
        );
      })}
    </tbody>
  </TableWrapper>
);
```

## With Expandable Rows (Accordion)

```tsx
import { useState } from "react";
import {
  TableWrapper,
  TableHeader,
  TableRow,
  TableCell,
  TableAccordionArrow,
} from "~/components/table";

const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

const toggleAccordion = (id: string) => {
  const newExpanded = new Set(expandedRows);
  if (newExpanded.has(id)) {
    newExpanded.delete(id);
  } else {
    newExpanded.add(id);
  }
  setExpandedRows(newExpanded);
};

const toggleAllAccordions = () => {
  if (expandedRows.size === data.length) {
    setExpandedRows(new Set());
  } else {
    setExpandedRows(new Set(data.map((item) => item.id)));
  }
};

<TableWrapper>
  <TableHeader
    columns={columns}
    accordionToggle={toggleAllAccordions}
    accordionState={expandedRows.size === data.length ? "open" : "closed"}
  />
  <tbody>
    {data.map((item) => (
      <>
        <TableRow key={item.id}>
          <TableAccordionArrow
            id={item.id}
            open={expandedRows.has(item.id)}
            onClick={toggleAccordion}
          />
          <TableCell>{item.name}</TableCell>
        </TableRow>

        {expandedRows.has(item.id) && (
          <TableRow child key={`${item.id}-details`}>
            <TableCell colSpan={columns.length + 1}>
              <div className="py-4">
                <h4 className="font-medium text-gray-900 mb-2">Details</h4>
                <p className="text-sm text-gray-600">{item.details}</p>
              </div>
            </TableCell>
          </TableRow>
        )}
      </>
    ))}
  </tbody>
</TableWrapper>;
```

## With Menu Popover (Multiple Actions)

```tsx
import { TableMenuPopover } from "~/components/table";

const getMenuItems = (item) => [
  { id: "edit", label: "Edit", href: `/items/${item.id}/edit` },
  { id: "duplicate", label: "Duplicate", onClick: () => duplicate(item.id) },
  { id: "delete", label: "Delete", onClick: () => deleteItem(item.id) },
];

<TableRow>
  <TableCell>{item.name}</TableCell>
  <TableMenuPopover items={getMenuItems(item)} />
</TableRow>;
```

## TableCell Props Reference

```tsx
interface TableCellProps {
  children: ReactNode;
  firstChild?: boolean;      // Add left padding for first cell
  headerId?: string;         // Associated header ID for accessibility
  headers?: string;          // Space-separated header IDs
  href?: string | null;      // Make entire cell a link
  onClick?: Function;        // Make entire cell a button
  removeFixedWidth?: boolean; // Remove min-width constraint
  fitTight?: boolean;        // Right-align and minimal width
  colSpan?: number;          // Column span for merged cells
  mobileVisible?: boolean;   // Show on mobile layouts
  mobileAction?: boolean;    // Mobile-only action cell
}
```

## TableRow Variants

```tsx
// Standard row with hover
<TableRow>{/* cells */}</TableRow>

// Child/nested row (gray background)
<TableRow child>{/* cells */}</TableRow>

// Highlighted row
<TableRow highlight>{/* cells */}</TableRow>

// No hover effects
<TableRow noHover>{/* cells */}</TableRow>

// Combined states
<TableRow child highlight>{/* cells */}</TableRow>
```

## Real-World Example: Notification Table with Selection

```tsx
import { useRef, useState } from "react";
import {
  TableWrapper,
  TableHeader,
  TableRow,
  TableCell,
  TableSelect,
  TableDetailsPopover,
  SelectActionBar,
} from "~/components/table";

const COLUMNS = [
  { path: "notification", label: "Notification", mobileVisible: true },
  { path: "description", label: "Description", stack: true },
  { key: "action", hideLabel: true, label: "View" },
];

const NotificationTable = ({ notifications, onMarkAsRead }) => {
  const tableRef = useRef<HTMLTableElement>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(false);

  return (
    <>
      <TableWrapper ref={tableRef}>
        <caption className="sr-only">Notifications</caption>
        <TableHeader
          columns={COLUMNS}
          selected={selected.length === notifications.length}
          selectAll
          onSelectAll={(isSelected) => {
            setSelected(isSelected ? notifications.map((n) => n.id) : []);
          }}
        />
        <tbody className="divide-y divide-gray-100 bg-white">
          {notifications.map((notification) => {
            const rowData = {
              notification: <Pill>{notification.type}</Pill>,
              description: (
                <div>
                  <span className="text-gray-900">{notification.message}</span>
                  <div className="mt-1 text-sm text-gray-500">
                    {notification.time}
                  </div>
                </div>
              ),
            };

            return (
              <TableRow key={notification.id}>
                <TableSelect
                  id={notification.id}
                  selected={selected.includes(notification.id)}
                  onSelectClick={() => {
                    if (selected.includes(notification.id)) {
                      setSelected(selected.filter((id) => id !== notification.id));
                    } else {
                      setSelected([...selected, notification.id]);
                    }
                  }}
                />
                <TableCell mobileVisible>{rowData.notification}</TableCell>
                <TableCell>{rowData.description}</TableCell>
                <TableCell>
                  <Button size="sm" onClick={() => onMarkAsRead(notification.id)}>
                    Mark Read
                  </Button>
                </TableCell>
                <TableCell mobileVisible removeFixedWidth>
                  <TableDetailsPopover
                    columns={COLUMNS}
                    rowData={rowData}
                    title="Notification Details"
                    onClick={() => onMarkAsRead(notification.id)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </tbody>
      </TableWrapper>

      <SelectActionBar
        active={selected.length > 0}
        error={error}
        actions={[
          {
            id: "mark-read",
            label: "Mark as Read",
            onClick: async () => {
              setIsUpdating(true);
              try {
                await onMarkAsRead(selected);
                setSelected([]);
              } catch {
                setError(true);
              } finally {
                setIsUpdating(false);
              }
            },
            isLoading: isUpdating,
          },
        ]}
        onClose={() => setSelected([])}
        onErrorClose={() => setError(false)}
        tableRef={tableRef}
      />
    </>
  );
};
```

## Accessibility

- Always include `<caption className="sr-only">` with descriptive text
- Use `hideLabel: true` for action columns but include proper `label` text
- Connect cells to headers with `headers` attribute
- Accordion controls include `aria-expanded` and `aria-controls`
- Selection checkboxes have proper labels
