/**
 * Pre-configured danger modal for destructive actions
 *
 * REQUIRES:
 * - npm install @headlessui/react @heroicons/react
 * - BaseButtonModal.tsx from this directory
 *
 * @example
 * // Delete confirmation
 * <DangerModal
 *   open={isOpen}
 *   onCancel={() => setIsOpen(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Item"
 *   content="Are you sure you want to delete this item? This action cannot be undone."
 *   cancelText="Cancel"
 *   confirmText="Delete"
 *   isLoading={isDeleting}
 * />
 *
 * @example
 * // Account deactivation
 * <DangerModal
 *   open={showDeactivateModal}
 *   onCancel={() => setShowDeactivateModal(false)}
 *   onConfirm={handleDeactivate}
 *   title="Deactivate Account"
 *   content="Your account will be deactivated and you will be logged out. You can reactivate within 30 days."
 *   cancelText="Keep Account"
 *   confirmText="Deactivate"
 * />
 */
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { BaseButtonModal } from "./BaseButtonModal";

interface DangerModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when cancel button is clicked */
  onCancel: () => void;
  /** Callback when confirm button is clicked */
  onConfirm: () => void;
  /** Title displayed in the modal */
  title: string;
  /** Content/description displayed below the title */
  content: string;
  /** Text for the cancel button */
  cancelText: string;
  /** Text for the confirm button */
  confirmText: string;
  /** Whether the confirm button should show a loading state */
  isLoading?: boolean;
}

export function DangerModal({
  open,
  onCancel,
  onConfirm,
  title,
  content,
  cancelText,
  confirmText,
  isLoading,
}: DangerModalProps) {
  return (
    <BaseButtonModal
      open={open}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title={title}
      content={content}
      cancelText={cancelText}
      confirmText={confirmText}
      icon={ExclamationTriangleIcon}
      type="danger"
      isLoading={isLoading}
    />
  );
}

export default DangerModal;
