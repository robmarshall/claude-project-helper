import type { ReactNode, Ref } from "react";

import { classNames } from "~/utils/classNames";

interface TableWrapperProps {
  children: ReactNode;
  noBorder?: boolean;
  ref?: Ref<HTMLTableElement>;
}

/**
 * Table container with responsive overflow and optional border styling.
 *
 * @example
 * // Standard table with border
 * <TableWrapper>
 *   <TableHeader columns={columns} />
 *   <tbody>...</tbody>
 * </TableWrapper>
 *
 * @example
 * // Without border
 * <TableWrapper noBorder>
 *   <tbody>...</tbody>
 * </TableWrapper>
 */
function TableWrapper({ children, noBorder, ref }: TableWrapperProps) {
  const tableClasses = "min-w-full";

  const containerClasses = classNames(
    "min-w-full overflow-x-auto",
    "ring-1 ring-gray-100 sm:mx-0 sm:rounded-lg"
  );

  if (noBorder) {
    return (
      <table className={tableClasses} ref={ref}>
        {children}
      </table>
    );
  }

  return (
    <div className={containerClasses}>
      <table className={tableClasses} ref={ref}>
        {children}
      </table>
    </div>
  );
}

TableWrapper.displayName = "TableWrapper";

export default TableWrapper;
