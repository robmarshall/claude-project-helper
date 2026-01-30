import { useRef } from "react";

interface TableSelectProps {
  id: string;
  onSelectClick: (ref: HTMLInputElement | null) => void;
  selected?: boolean;
}

/**
 * Row selection checkbox with proper labeling and accessibility.
 *
 * @example
 * <TableSelect
 *   id={item.id}
 *   selected={selectedRows.has(item.id)}
 *   onSelectClick={(ref) => handleRowSelect(item.id, ref)}
 * />
 */
const TableSelect = ({ id, onSelectClick, selected }: TableSelectProps) => {
  const selectRef = useRef<HTMLInputElement>(null);

  return (
    <td className="py-4 pl-4 text-sm whitespace-nowrap text-gray-500">
      <label htmlFor={`select-${id}`} className="sr-only">
        Select
      </label>
      <input
        ref={selectRef}
        id={`select-${id}`}
        name={`select-${id}`}
        type="checkbox"
        className="mb-1 h-4 w-4 rounded-sm border-gray-300 text-blue-600 focus:ring-blue-500"
        onChange={() => onSelectClick(selectRef.current)}
        checked={selected}
      />
    </td>
  );
};

export default TableSelect;
