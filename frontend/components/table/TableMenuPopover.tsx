import { Fragment } from "react";

import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/20/solid";

import { classNames } from "~/utils/classNames";

import type { TableCellProps } from "./TableCell";
import TableCell from "./TableCell";

interface MenuItemType {
  id: string;
  href?: string;
  label: string;
  onClick?: () => void;
}

interface TableMenuPopoverProps
  extends Omit<TableCellProps, "removeFixedWidth" | "fitTight"> {
  items: MenuItemType[];
}

/**
 * Dropdown menu for multiple row actions with keyboard navigation.
 *
 * @example
 * const menuItems = [
 *   { id: "edit", label: "Edit", href: `/items/${item.id}/edit` },
 *   { id: "duplicate", label: "Duplicate", onClick: () => duplicate(item.id) },
 *   { id: "delete", label: "Delete", onClick: () => deleteItem(item.id) },
 * ];
 *
 * <TableMenuPopover items={menuItems} />
 */
const TableMenuPopover: React.FC<TableMenuPopoverProps> = ({
  items,
  ...rest
}) => (
  <TableCell {...rest} removeFixedWidth fitTight>
    <Menu as="div" className="relative flex-none">
      <MenuButton className="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900">
        <span className="sr-only">Open options</span>
        <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
      </MenuButton>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="origin-left-left absolute right-5 bottom-0 z-10 mt-2 w-32 rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-hidden">
          {items.map(({ id, href, label, onClick }) => (
            <MenuItem key={id}>
              {({ focus }) =>
                !onClick ? (
                  <a
                    href={href}
                    className={classNames(
                      focus && "bg-gray-50",
                      "block w-full px-3 py-1 text-left text-sm leading-6 text-gray-900"
                    )}
                  >
                    {label}
                  </a>
                ) : (
                  <button
                    onClick={onClick}
                    className={classNames(
                      focus && "bg-gray-50",
                      "block w-full px-3 py-1 text-left text-sm leading-6 text-gray-900"
                    )}
                  >
                    {label}
                  </button>
                )
              }
            </MenuItem>
          ))}
        </MenuItems>
      </Transition>
    </Menu>
  </TableCell>
);

export default TableMenuPopover;
