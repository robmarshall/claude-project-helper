import { ChevronDoubleUpIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/24/solid";

import Link from "~/atoms/Link";
import { classNames } from "~/utils/classNames";

export interface ColumnProps {
  path?: string;
  key?: string;
  label?: string;
  width?: string;
  hideLabel?: boolean;
  mobileVisible?: boolean;
  mobileOrder?: number;
  mobileLabel?: string;
  stack?: boolean;
}

export interface SortColumn {
  path: string;
  order: "asc" | "desc";
}

interface ColumnComponentProps {
  column: ColumnProps;
  sortColumn: SortColumn | null;
  onSort?: (sortColumn: SortColumn) => void;
  hideLabel?: boolean;
  id?: string;
}

const Column = ({
  column,
  sortColumn,
  hideLabel,
  id,
}: ColumnComponentProps) => {
  const { path, label, mobileVisible = false, mobileLabel } = column;
  const displayLabel = mobileLabel || label;

  const mobileClasses = mobileVisible ? "" : "hidden md:table-cell";

  if (hideLabel) {
    return (
      <th id={id} scope="col" className="relative py-3.5 pr-4 pl-3 sm:pr-4">
        <span className="sr-only">{displayLabel}</span>
      </th>
    );
  }

  if (path !== sortColumn?.path) {
    return (
      <th
        id={id}
        scope="col"
        className={classNames(
          "py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-4",
          mobileClasses
        )}
      >
        {displayLabel}
      </th>
    );
  }

  return (
    <th
      id={id}
      scope="col"
      className={classNames(
        "py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-4",
        mobileClasses
      )}
    >
      <Link href="#" className="group inline-flex">
        {displayLabel}
        <span
          className={classNames(
            "ml-2 flex-none rounded-sm bg-gray-100 text-gray-900 group-hover:bg-gray-200",
            sortColumn?.order === "asc" && "rotate-180"
          )}
        >
          <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
        </span>
      </Link>
    </th>
  );
};

interface TableHeaderProps {
  accordionToggle?: () => void;
  accordionState?: "open" | "closed";
  columns: ColumnProps[];
  sortColumn?: SortColumn;
  onSort?: (sortColumn: SortColumn) => void;
  selected?: boolean;
  selectAll?: boolean;
  onSelectAll?: (selected: boolean) => void;
}

/**
 * Table header with column definitions, sorting, and selection controls.
 *
 * @example
 * // Basic header
 * <TableHeader columns={columns} />
 *
 * @example
 * // With sorting
 * <TableHeader
 *   columns={columns}
 *   sortColumn={sortColumn}
 *   onSort={handleSort}
 * />
 *
 * @example
 * // With selection
 * <TableHeader
 *   columns={columns}
 *   selectAll
 *   selected={allSelected}
 *   onSelectAll={handleSelectAll}
 * />
 */
const TableHeader = ({
  accordionToggle,
  accordionState,
  columns,
  sortColumn,
  onSort,
  selected,
  selectAll,
  onSelectAll,
}: TableHeaderProps) => {
  const cleanColumns = columns.filter(Boolean);

  return (
    <>
      <colgroup>
        {selectAll && <col className="w-6 md:w-6" />}

        {accordionState && <col className="w-4 md:w-6" />}

        {cleanColumns.map((column) => {
          const mobileVisible = Boolean(column?.mobileVisible);
          const colClasses = mobileVisible
            ? `w-auto md:w-${column?.width || "auto"}`
            : `hidden md:table-column w-auto md:w-${column?.width || "auto"}`;

          return <col key={column.path || column.key} className={colClasses} />;
        })}
      </colgroup>
      <thead className="border-b border-gray-100">
        <tr>
          {(accordionState || accordionToggle) && (
            <th scope="col" className="relative gap-1 py-3.5 pr-0 md:pl-3">
              <button
                type="button"
                className="flex items-center gap-2 px-3 text-gray-500 hover:text-gray-900"
                onClick={accordionToggle}
              >
                <span className="sr-only">Toggle accordion</span>
                <ChevronDoubleUpIcon
                  className={classNames(
                    "h-5 w-5 transform transition-transform duration-300",
                    accordionState === "closed" && "rotate-180"
                  )}
                />
              </button>
            </th>
          )}

          {selectAll && (
            <th scope="col" className="relative py-3.5 pr-0 pl-3">
              <span className="sr-only">Select All</span>

              <input
                type="checkbox"
                className="mb-1 h-4 w-4 rounded-sm border-gray-300 text-blue-500 focus:ring-blue-500"
                onChange={() => onSelectAll && onSelectAll(!selected)}
                checked={selected}
              />
            </th>
          )}

          {cleanColumns.map((column) => (
            <Column
              key={column.path || column.key}
              id={column.path}
              column={column}
              sortColumn={sortColumn || null}
              onSort={onSort}
              hideLabel={column?.hideLabel}
            />
          ))}
        </tr>
      </thead>
    </>
  );
};

export default TableHeader;
