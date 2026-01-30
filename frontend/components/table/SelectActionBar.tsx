import { useRef } from "react";

import { Transition } from "@headlessui/react";
import { ExclamationTriangleIcon, XMarkIcon, CheckIcon } from "@heroicons/react/24/solid";

import type { ButtonColor, ButtonVariant } from "~/atoms/buttons/Button";
import ButtonBase from "~/atoms/buttons/ButtonBase";

interface ActionButtonProps {
  id: string;
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
  color?: ButtonColor;
  isLoading?: boolean;
}

interface SelectActionBarProps {
  actions: ActionButtonProps[];
  active?: boolean;
  error?: boolean;
  onClose: () => void;
  onErrorClose: () => void;
  tableRef?: React.RefObject<HTMLTableElement | null>;
  selectToRefocus?: HTMLInputElement | null;
}

/**
 * Batch action controls with loading states and error handling.
 * Displays at the bottom of the screen when rows are selected.
 *
 * @example
 * const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
 * const [actionError, setActionError] = useState(false);
 * const [isActionLoading, setIsActionLoading] = useState(false);
 * const tableRef = useRef<HTMLTableElement>(null);
 *
 * const actions = [
 *   {
 *     id: "delete",
 *     label: "Delete Selected",
 *     onClick: async () => {
 *       setIsActionLoading(true);
 *       try {
 *         await handleBulkDelete(Array.from(selectedRows));
 *         setSelectedRows(new Set());
 *       } catch (error) {
 *         setActionError(true);
 *       } finally {
 *         setIsActionLoading(false);
 *       }
 *     },
 *     isLoading: isActionLoading,
 *   },
 * ];
 *
 * <SelectActionBar
 *   active={selectedRows.size > 0}
 *   error={actionError}
 *   actions={actions}
 *   onClose={() => setSelectedRows(new Set())}
 *   onErrorClose={() => setActionError(false)}
 *   tableRef={tableRef}
 * />
 */
const SelectActionBar: React.FC<SelectActionBarProps> = ({
  actions,
  active,
  error,
  onClose,
  onErrorClose,
  tableRef,
  selectToRefocus,
}) => {
  const actionBarCancelRef = useRef<HTMLButtonElement>(null);
  const errorBarCancelRef = useRef<HTMLButtonElement>(null);

  // Check if any of the actions are loading.
  const isActionLoading = actions?.some((action) => action.isLoading);

  const handleAfterMainEnter = () => {
    if (active && actionBarCancelRef.current) {
      actionBarCancelRef.current.focus();
    }
  };

  const handleAfterErrorEnter = () => {
    if (error && errorBarCancelRef.current) {
      errorBarCancelRef.current.focus();
    }
  };

  const handleActionOnClick = async (action: ActionButtonProps) => {
    await action.onClick();

    if (selectToRefocus) {
      selectToRefocus.focus();
    } else if (tableRef) {
      // Find the first input element in the table
      const firstInput = tableRef.current?.querySelector("input");

      if (firstInput) {
        firstInput.focus();
      } else {
        // Select the first header cell
        const firstHeaderCell = tableRef.current?.querySelector("th");

        if (firstHeaderCell) {
          firstHeaderCell.focus();
        }
      }
    }
  };

  const handleOnClose = () => {
    onClose();

    if (selectToRefocus) {
      selectToRefocus.focus();
    }
  };

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center lg:pl-72">
        <Transition
          show={active}
          enter="transition ease-out duration-200"
          enterFrom="transform translate-y-full opacity-0"
          enterTo="transform translate-y-0 opacity-100"
          leave="transition ease-in duration-150"
          leaveFrom="transform translate-y-0 opacity-100"
          leaveTo="transform translate-y-full opacity-0"
          afterEnter={handleAfterMainEnter}
        >
          <div className="w-full">
            <div className="mx-auto flex max-w-3xl items-center justify-between p-4 sm:px-6 lg:px-8">
              <div
                role="dialog"
                aria-label="Action selection"
                tabIndex={-1}
                className="relative flex w-full items-center justify-center rounded-lg border border-gray-200 bg-blue-600 py-2 shadow-2xl"
              >
                <ButtonBase
                  ref={actionBarCancelRef}
                  onClick={isActionLoading ? () => {} : handleOnClose}
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-transparent px-4 py-3 text-sm font-bold text-white shadow-none transition-colors duration-200 ease-in-out hover:bg-blue-700 focus-visible:outline-transparent disabled:text-gray-500"
                >
                  <XMarkIcon className="-ml-0.5 h-5 w-5" />
                  Cancel
                </ButtonBase>

                {actions?.length > 0 &&
                  actions.map((action) => {
                    return (
                      <ButtonBase
                        key={action.id}
                        onClick={() => handleActionOnClick(action)}
                        className="inline-flex items-center gap-x-1.5 rounded-md bg-transparent px-4 py-3 text-sm font-bold text-white shadow-none transition-colors duration-200 ease-in-out hover:bg-blue-700 focus-visible:outline-transparent disabled:text-gray-500"
                      >
                        <CheckIcon className="-ml-0.5 h-5 w-5" />
                        {action.label}
                      </ButtonBase>
                    );
                  })}

                <Transition
                  show={isActionLoading}
                  enter="transition ease-out duration-200"
                  enterFrom="transform opacity-0"
                  enterTo="transform opacity-100"
                  leave="transition ease-in duration-150"
                  leaveFrom="transform opacity-100"
                  leaveTo="transform opacity-0"
                >
                  <div className="absolute inset-0 flex items-center justify-center rounded-md bg-blue-600">
                    <svg
                      className="h-8 w-8 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <div className="fixed inset-x-0 bottom-0 flex justify-center lg:pl-72">
        <Transition
          show={error}
          enter="transition ease-out duration-200"
          enterFrom="transform translate-y-full opacity-0"
          enterTo="transform translate-y-0 opacity-100"
          leave="transition ease-in duration-150"
          leaveFrom="transform translate-y-0 opacity-100"
          leaveTo="transform translate-y-full opacity-0"
          afterEnter={handleAfterErrorEnter}
        >
          <div className="w-full">
            <div className="mx-auto flex max-w-3xl items-center justify-between p-4 sm:px-6 lg:px-8">
              <div
                role="alert"
                aria-live="assertive"
                tabIndex={-1}
                className="flex w-full items-center rounded-lg border border-gray-200 bg-red-600 p-5 shadow-2xl"
              >
                <ExclamationTriangleIcon
                  className="h-6 w-6 shrink-0 text-white"
                  aria-hidden="true"
                />

                <p className="mx-4 text-white">
                  Oops, looks like something went wrong. Please try again.
                </p>

                <ButtonBase
                  onClick={onErrorClose}
                  className="ml-auto shrink-0 text-white hover:text-gray-200"
                  ref={errorBarCancelRef}
                >
                  <XMarkIcon className="h-6 w-6" />
                  <span className="sr-only">Dismiss error message</span>
                </ButtonBase>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <Transition
        show={active}
        enter="transition ease-out duration-200"
        enterFrom="transform translate-y-0"
        enterTo="transform -translate-y-16"
        leave="transition ease-in duration-150"
        leaveFrom="transform -translate-y-16"
        leaveTo="transform translate-y-0"
      >
        <div className="h-20" />
      </Transition>
    </>
  );
};

export default SelectActionBar;
