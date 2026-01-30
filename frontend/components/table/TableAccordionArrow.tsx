import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { motion } from "motion/react";

interface TableAccordionArrowProps {
  id: string;
  onClick: (id: string) => void;
  open?: boolean;
}

/**
 * Expandable row control with smooth animation using Framer Motion.
 *
 * @example
 * const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
 *
 * const toggleAccordion = (id: string) => {
 *   const newExpanded = new Set(expandedRows);
 *   if (newExpanded.has(id)) {
 *     newExpanded.delete(id);
 *   } else {
 *     newExpanded.add(id);
 *   }
 *   setExpandedRows(newExpanded);
 * };
 *
 * <TableAccordionArrow
 *   id={item.id}
 *   open={expandedRows.has(item.id)}
 *   onClick={toggleAccordion}
 * />
 */
const TableAccordionArrow = ({
  id,
  onClick,
  open,
}: TableAccordionArrowProps) => {
  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    propertyId: string
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(propertyId);
    }
  };

  return (
    <td className="text-sm whitespace-nowrap text-gray-500 md:w-10 md:pl-4">
      <button
        onClick={() => onClick(id)}
        onKeyDown={(e) => handleKeyPress(e, id)}
        aria-expanded={open}
        aria-controls={`accordion-${id}`}
        className="flex items-center gap-2 rounded-md text-left hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
      >
        <motion.span
          animate={{ rotate: open ? -180 : 0 }}
          transition={{ duration: 0.2 }}
          className="p-3"
        >
          <ChevronDownIcon className="h-4 w-4" />
        </motion.span>
        <span className="sr-only">{open ? "Collapse" : "Expand"}</span>
      </button>
    </td>
  );
};

export default TableAccordionArrow;
