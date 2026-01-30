import type { ReactNode, Ref } from "react";

import { classNames } from "~/utils/classNames";

interface TableRowFooterProps {
  children: ReactNode;
  bgColor: string;
}

export const TableRowFooter = ({ children, bgColor }: TableRowFooterProps) => {
  return <tr className={`bg-${bgColor}`}>{children}</tr>;
};

interface TableRowProps {
  child?: boolean;
  children: ReactNode;
  highlight?: boolean;
  noHover?: boolean;
  ref?: Ref<HTMLTableRowElement>;
}

/**
 * Table row with hover states, highlighting, and child row styling.
 *
 * @example
 * // Standard row
 * <TableRow>
 *   <TableCell>Content</TableCell>
 * </TableRow>
 *
 * @example
 * // Child/nested row (gray background)
 * <TableRow child>
 *   <TableCell>Nested content</TableCell>
 * </TableRow>
 *
 * @example
 * // Highlighted row
 * <TableRow highlight>
 *   <TableCell>Important content</TableCell>
 * </TableRow>
 *
 * @example
 * // No hover effects
 * <TableRow noHover>
 *   <TableCell>Static content</TableCell>
 * </TableRow>
 */
function TableRow({ child, children, highlight, noHover, ref }: TableRowProps) {
  const classes = classNames(
    "duration-200 ease-in-out",
    child && "bg-gray-100",
    noHover
      ? ""
      : highlight
        ? child
          ? "bg-gray-100 hover:bg-gray-200 transition-colors"
          : "bg-gray-50 hover:bg-gray-100 transition-colors"
        : child
          ? "bg-gray-50 hover:bg-gray-100 transition-colors"
          : "hover:bg-gray-50"
  );

  return (
    <tr ref={ref} className={classes}>
      {children}
    </tr>
  );
}

TableRow.displayName = "TableRow";

export default TableRow;
