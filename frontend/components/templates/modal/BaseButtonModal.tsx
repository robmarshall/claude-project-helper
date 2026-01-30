/**
 * Pre-composed modal with icon, title, content, and action buttons
 *
 * REQUIRES:
 * - npm install @headlessui/react @heroicons/react
 * - Modal.tsx from this directory
 * - classNames.ts utility from ~/utils/classNames
 *
 * @example
 * // Primary confirmation modal
 * <BaseButtonModal
 *   open={isOpen}
 *   onCancel={() => setIsOpen(false)}
 *   onConfirm={handleSubmit}
 *   title="Save Changes"
 *   content="Are you sure you want to save these changes?"
 *   cancelText="Cancel"
 *   confirmText="Save"
 *   type="primary"
 * />
 *
 * @example
 * // Danger modal with loading state
 * <BaseButtonModal
 *   open={isOpen}
 *   onCancel={() => setIsOpen(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Account"
 *   content="This action cannot be undone. All your data will be permanently deleted."
 *   cancelText="Cancel"
 *   confirmText="Delete"
 *   type="danger"
 *   icon={TrashIcon}
 *   isLoading={isDeleting}
 * />
 *
 * @example
 * // Warning modal with custom content
 * <BaseButtonModal
 *   open={isOpen}
 *   onCancel={() => setIsOpen(false)}
 *   onConfirm={handleProceed}
 *   title="Unsaved Changes"
 *   content={
 *     <div>
 *       <p>You have unsaved changes in:</p>
 *       <ul className="mt-2 list-disc pl-5">
 *         <li>Profile settings</li>
 *         <li>Notification preferences</li>
 *       </ul>
 *     </div>
 *   }
 *   cancelText="Go Back"
 *   confirmText="Discard Changes"
 *   type="warning"
 * />
 */
import { type ComponentType, type ReactNode } from "react";
import { DialogTitle } from "@headlessui/react";
import { Modal } from "./Modal";
import { classNames } from "~/utils/classNames";

type ModalType = "primary" | "danger" | "warning";

interface BaseButtonModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when cancel button is clicked or modal is closed. Optional - if not provided, no cancel button is shown */
  onCancel?: () => void;
  /** Callback when confirm button is clicked */
  onConfirm: () => void;
  /** Title displayed in the modal */
  title: string;
  /** Content displayed below the title. Can be a string or custom JSX */
  content: string | ReactNode;
  /** Text for the cancel button. Only shown if onCancel is provided */
  cancelText?: string;
  /** Text for the confirm button */
  confirmText: string;
  /** Optional icon component to display. Receives className prop for sizing */
  icon?: ComponentType<{ className?: string }>;
  /** Type of modal affects button and icon colors. Default: "primary" */
  type?: ModalType;
  /** Whether the confirm button should show a loading state */
  isLoading?: boolean;
}

const iconContainerClasses: Record<ModalType, string> = {
  primary: "bg-blue-100",
  danger: "bg-red-100",
  warning: "bg-yellow-100",
};

const iconClasses: Record<ModalType, string> = {
  primary: "text-blue-600",
  danger: "text-red-600",
  warning: "text-yellow-600",
};

const confirmButtonClasses: Record<ModalType, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-500 focus-visible:outline-blue-600",
  danger:
    "bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600",
  warning:
    "bg-yellow-600 text-white hover:bg-yellow-500 focus-visible:outline-yellow-600",
};

export function BaseButtonModal({
  open,
  onCancel,
  onConfirm,
  title,
  content,
  cancelText = "Cancel",
  confirmText,
  icon: Icon,
  type = "primary",
  isLoading = false,
}: BaseButtonModalProps) {
  const handleClose = () => {
    if (onCancel && !isLoading) {
      onCancel();
    }
  };

  return (
    <Modal open={open} onClose={handleClose} size="sm">
      <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
        <div className="sm:flex sm:items-start">
          {/* Icon */}
          {Icon && (
            <div
              className={classNames(
                "mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full sm:mx-0 sm:h-10 sm:w-10",
                iconContainerClasses[type]
              )}
            >
              <Icon
                className={classNames("h-6 w-6", iconClasses[type])}
                aria-hidden="true"
              />
            </div>
          )}

          {/* Content */}
          <div
            className={classNames(
              "mt-3 text-center sm:mt-0 sm:text-left",
              Icon && "sm:ml-4"
            )}
          >
            <DialogTitle
              as="h3"
              className="text-base font-semibold leading-6 text-gray-900"
            >
              {title}
            </DialogTitle>
            <div className="mt-2">
              {typeof content === "string" ? (
                <p className="text-sm text-gray-500">{content}</p>
              ) : (
                <div className="text-sm text-gray-500">{content}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
        <button
          type="button"
          disabled={isLoading}
          onClick={onConfirm}
          className={classNames(
            "inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm sm:ml-3 sm:w-auto",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            confirmButtonClasses[type]
          )}
        >
          {isLoading ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
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
              {confirmText}
            </>
          ) : (
            confirmText
          )}
        </button>
        {onCancel && (
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className={classNames(
              "mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300",
              "hover:bg-gray-50 sm:mt-0 sm:w-auto",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {cancelText}
          </button>
        )}
      </div>
    </Modal>
  );
}

export default BaseButtonModal;
