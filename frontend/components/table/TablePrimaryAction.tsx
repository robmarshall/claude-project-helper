import type { ReactNode } from "react";

import { classNames } from "~/utils/classNames";

import type { TableCellProps } from "./TableCell";
import TableCell from "./TableCell";

interface TablePrimaryActionProps
  extends Omit<TableCellProps, "removeFixedWidth" | "fitTight"> {
  children: ReactNode;
  headers?: string;
  href?: string;
  onClick?: () => void | null;
}

/**
 * Primary action cell with consistent blue styling.
 * Typically used as the last column for "View", "Edit", etc.
 *
 * @example
 * // As a link
 * <TablePrimaryAction href={`/items/${item.id}`}>
 *   View
 * </TablePrimaryAction>
 *
 * @example
 * // As a button
 * <TablePrimaryAction onClick={() => handleView(item.id)}>
 *   Open
 * </TablePrimaryAction>
 *
 * @example
 * // Disabled state (no href or onClick)
 * <TablePrimaryAction>
 *   Locked
 * </TablePrimaryAction>
 */
const TablePrimaryAction = ({
  children,
  headers,
  href,
  onClick,
  ...rest
}: TablePrimaryActionProps) => (
  <TableCell
    {...rest}
    href={href}
    onClick={onClick}
    removeFixedWidth
    fitTight
    headers={headers}
  >
    <span
      className={classNames(
        "text-blue-700 font-medium",
        !href && !onClick && "opacity-35"
      )}
    >
      {children}
    </span>
  </TableCell>
);

export default TablePrimaryAction;
