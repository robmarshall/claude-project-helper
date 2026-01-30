/**
 * Base modal component using Headless UI
 *
 * REQUIRES:
 * - npm install @headlessui/react
 * - classNames.ts utility from ~/utils/classNames
 *
 * @example
 * // Basic modal with custom content
 * <Modal open={isOpen} onClose={() => setIsOpen(false)}>
 *   <div className="p-6">
 *     <h2 className="text-lg font-semibold">Modal Title</h2>
 *     <p className="mt-2">Modal content goes here.</p>
 *   </div>
 * </Modal>
 *
 * @example
 * // Modal with padding enabled
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} padding>
 *   <h2 className="text-lg font-semibold">Modal Title</h2>
 *   <p className="mt-2">Content with automatic padding.</p>
 * </Modal>
 *
 * @example
 * // Small modal
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} size="sm">
 *   <ConfirmationContent />
 * </Modal>
 */
import { Fragment, type ReactNode } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { classNames } from "~/utils/classNames";

interface ModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should close (backdrop click or escape key) */
  onClose: () => void;
  /** Content to display in the modal */
  children: ReactNode;
  /** Whether to add default padding to the modal content. Default: false */
  padding?: boolean;
  /** Size of the modal. Default: "md" */
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

export function Modal({
  open,
  onClose,
  children,
  padding = false,
  size = "md",
}: ModalProps) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
        </TransitionChild>

        {/* Modal container */}
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <DialogPanel
                className={classNames(
                  "relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all",
                  "w-full sm:my-8",
                  sizeClasses[size],
                  padding && "p-6"
                )}
              >
                {children}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default Modal;
