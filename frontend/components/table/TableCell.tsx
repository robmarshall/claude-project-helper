import type { MouseEvent, ReactNode } from "react";

import ButtonBase from "~/atoms/buttons/ButtonBase";
import Link from "~/atoms/Link";
import { classNames } from "~/utils/classNames";

interface TableCellButtonProps {
  children: ReactNode;
  className: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

const TableCellButton: React.FC<TableCellButtonProps> = ({
  children,
  className,
  onClick,
}) => (
  <ButtonBase className={className} onClick={onClick}>
    {children}
  </ButtonBase>
);

interface TableCellLinkProps {
  children: ReactNode;
  className: string;
  href: string;
}

const TableCellLink: React.FC<TableCellLinkProps> = ({
  children,
  className,
  href,
}) => (
  <Link className={className} href={href}>
    {children}
  </Link>
);

interface TableCellWrapProps {
  children: ReactNode;
  className: string;
  headerId?: string;
  headers?: string;
  colSpan?: number;
}

const TableCellWrapper: React.FC<TableCellWrapProps> = ({
  children,
  className,
  headerId,
  headers,
  colSpan = 1,
}) => {
  if (headerId) {
    return (
      <th
        id={headerId}
        className={className}
        headers={headers}
        colSpan={colSpan}
      >
        {children}
      </th>
    );
  }

  return (
    <td className={className} headers={headers}>
      {children}
    </td>
  );
};

export interface TableCellProps {
  children: ReactNode;
  firstChild?: boolean;
  headerId?: string;
  headers?: string;
  href?: string | null;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  removeFixedWidth?: boolean;
  fitTight?: boolean;
  colSpan?: number;
  mobileVisible?: boolean;
  mobileAction?: boolean;
}

/**
 * Flexible table cell supporting static content, links, or buttons.
 *
 * @example
 * // Static content
 * <TableCell>{item.name}</TableCell>
 *
 * @example
 * // As a link (entire cell clickable)
 * <TableCell href={`/items/${item.id}`}>{item.name}</TableCell>
 *
 * @example
 * // As a button
 * <TableCell onClick={() => handleAction(item.id)}>{item.name}</TableCell>
 *
 * @example
 * // Right-aligned action cell
 * <TableCell removeFixedWidth fitTight>
 *   <Button size="sm">Edit</Button>
 * </TableCell>
 *
 * @example
 * // Mobile-visible cell
 * <TableCell mobileVisible>{item.name}</TableCell>
 */
const TableCell: React.FC<TableCellProps> = ({
  children,
  firstChild,
  headerId,
  headers,
  href,
  onClick,
  removeFixedWidth = false,
  fitTight = false,
  colSpan,
  mobileVisible = false,
  mobileAction = false,
}) => {
  const cellStyle = classNames(
    "whitespace-nowrap py-5 text-sm text-gray-500 inline-block w-full font-normal",
    !removeFixedWidth && !mobileAction && "md:min-w-[100px]",
    !fitTight && "text-left",
    fitTight && "px-6 text-right",
    firstChild && "pl-24",
    mobileAction && "pr-4 text-right",
    !mobileAction && "px-4"
  );

  const tableTag = classNames(
    !mobileVisible && !mobileAction && "hidden md:table-cell",
    fitTight && "whitespace-nowrap w-[1%]",
    mobileAction && "whitespace-nowrap w-[1%] md:hidden table-cell"
  );

  // If no href or onClick is provided, return a normal table cell.
  if (!href && !onClick) {
    return (
      <TableCellWrapper
        className={tableTag}
        headerId={headerId}
        headers={headers}
        colSpan={colSpan}
      >
        <div className={cellStyle}>{children}</div>
      </TableCellWrapper>
    );
  }

  // If href is provided, return a table cell with Link element.
  if (href) {
    return (
      <TableCellWrapper
        className={tableTag}
        headerId={headerId}
        headers={headers}
        colSpan={colSpan}
      >
        <TableCellLink href={href} className={cellStyle}>
          {children}
        </TableCellLink>
      </TableCellWrapper>
    );
  }

  // If onClick is provided, return a table cell with Button element.
  if (onClick) {
    return (
      <TableCellWrapper
        className={tableTag}
        headerId={headerId}
        headers={headers}
        colSpan={colSpan}
      >
        <TableCellButton onClick={onClick} className={cellStyle}>
          {children}
        </TableCellButton>
      </TableCellWrapper>
    );
  }

  return null;
};

export default TableCell;
