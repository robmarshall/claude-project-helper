import { Fragment, useEffect } from "react";

import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from "@headlessui/react";
import { XCircleIcon } from "@heroicons/react/24/solid";

import Button from "~/atoms/buttons/Button";

import type { ColumnProps } from "./TableHeader";

interface TableDetailRowProps {
  label: string;
  children: React.ReactNode;
  stack?: boolean;
}

const TableDetailRow: React.FC<TableDetailRowProps> = ({
  label,
  children,
  stack,
}) => (
  <div
    className={
      stack
        ? "flex flex-col items-end gap-1 py-4"
        : "flex flex-row flex-wrap justify-between gap-5 py-4"
    }
  >
    <div
      className={
        stack
          ? "w-full text-left text-sm font-medium text-gray-600"
          : "flex-shrink-0 text-sm font-medium text-gray-600"
      }
    >
      {label}
    </div>
    <div
      className={
        stack
          ? "w-full min-w-0 flex-1 text-left text-sm font-medium break-words text-gray-900"
          : "flex min-w-0 flex-1 justify-end text-right text-sm font-medium break-words text-gray-900"
      }
    >
      {children}
    </div>
  </div>
);

interface TableDetailsPopoverProps {
  actionName?: string;
  columns: ColumnProps[];
  rowData: Record<string, React.ReactNode>;
  title?: string;
  triggerText?: string;
  className?: string;
  href?: string;
  onClick?: () => void;
}

/**
 * Mobile popover showing all column data in a bottom sheet.
 * Automatically handles body scroll lock when open.
 *
 * @example
 * <TableDetailsPopover
 *   columns={columns}
 *   rowData={{
 *     name: item.name,
 *     email: item.email,
 *     status: <Pill>{item.status}</Pill>
 *   }}
 *   title="Item Details"
 *   href={`/items/${item.id}`}
 * />
 *
 * @example
 * // With custom action
 * <TableDetailsPopover
 *   columns={columns}
 *   rowData={rowData}
 *   title="Details"
 *   actionName="Edit"
 *   onClick={() => handleEdit(item.id)}
 * />
 */
const TableDetailsPopover: React.FC<TableDetailsPopoverProps> = ({
  columns,
  title,
  rowData,
  triggerText = "Details",
  actionName = "View",
  className = "",
  href,
  onClick,
}) => {
  const detailsColumns = columns.filter(
    (col) => col.path && !col.hideLabel && col.path in rowData
  );

  return (
    <Popover className={`relative items-center ${className}`}>
      {({ open }) => (
        <PopoverBodyLock open={open}>
          <PopoverButton className="inline-flex items-center justify-center rounded-md py-2 text-xs font-medium text-blue-600 md:hidden">
            {triggerText}
          </PopoverButton>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-300"
            enterFrom="transform translate-y-full opacity-0"
            enterTo="transform translate-y-0 opacity-100"
            leave="transition ease-in duration-200"
            leaveFrom="transform translate-y-0 opacity-100"
            leaveTo="transform translate-y-full opacity-0"
          >
            <PopoverPanel className="shadow-xxl fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white ring-1 ring-gray-900/5 md:hidden">
              <div className="flex h-full max-h-[70vh] flex-col">
                {/* Header */}
                <div className="flex items-center justify-between rounded-t-lg border-gray-200 bg-gray-100 px-5 py-2 pr-2">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {title}
                  </h3>
                  <PopoverButton className="p-2 text-gray-900">
                    <span className="sr-only">Close</span>
                    <XCircleIcon className="h-6 w-6" aria-hidden="true" />
                  </PopoverButton>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-2">
                  {detailsColumns.map((column) => {
                    const key = column.path!;
                    const label = column.mobileLabel || column.label || key;
                    const content = rowData[key];
                    const isStacked = column.stack || false;

                    if (!content) return null;

                    return (
                      <TableDetailRow key={key} label={label} stack={isStacked}>
                        {content}
                      </TableDetailRow>
                    );
                  })}
                </div>

                {/* View Button */}
                {href && (
                  <div className="border-t border-gray-100 px-4 py-4">
                    <Button
                      href={href}
                      fullWidth
                      color="tertiary"
                      size="sm"
                      variant="outlined"
                    >
                      {actionName}
                    </Button>
                  </div>
                )}

                {/* Action Button */}
                {onClick && (
                  <div className="border-t border-gray-100 px-4 py-4">
                    <Button
                      onClick={onClick}
                      fullWidth
                      color="tertiary"
                      size="sm"
                      variant="outlined"
                    >
                      {actionName}
                    </Button>
                  </div>
                )}
              </div>
            </PopoverPanel>
          </Transition>
        </PopoverBodyLock>
      )}
    </Popover>
  );
};

// Helper component to handle body scroll lock via useEffect
const PopoverBodyLock: React.FC<{
  open: boolean;
  children: React.ReactNode;
}> = ({ open, children }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return <>{children}</>;
};

export default TableDetailsPopover;
