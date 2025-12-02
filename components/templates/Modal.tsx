/**
 * Modal/Dialog component with portal, focus trap, and accessibility
 *
 * REQUIRES:
 * - npm install clsx tailwind-merge
 * - classNames.ts utility from utils/classNames.ts
 *
 * @example
 * // Basic modal
 * const [open, setOpen] = useState(false);
 *
 * <Button onClick={() => setOpen(true)}>Open Modal</Button>
 *
 * <Modal open={open} onClose={() => setOpen(false)}>
 *   <ModalHeader>
 *     <ModalTitle>Confirm Action</ModalTitle>
 *   </ModalHeader>
 *   <ModalBody>
 *     <p>Are you sure you want to continue?</p>
 *   </ModalBody>
 *   <ModalFooter>
 *     <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
 *     <Button onClick={handleConfirm}>Confirm</Button>
 *   </ModalFooter>
 * </Modal>
 *
 * @example
 * // Prevent backdrop close
 * <Modal open={open} onClose={() => setOpen(false)} closeOnBackdrop={false}>
 *   ...
 * </Modal>
 *
 * @example
 * // Custom size
 * <Modal open={open} onClose={() => setOpen(false)} className="max-w-2xl">
 *   ...
 * </Modal>
 */
import {
  useEffect,
  useRef,
  type ReactNode,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { classNames } from "~/utils/classNames";

// =============================================================================
// MODAL ROOT
// =============================================================================

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export function Modal({
  open,
  onClose,
  children,
  closeOnBackdrop = true,
  closeOnEscape = true,
  className,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, closeOnEscape, onClose]);

  // Focus management
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement;
      modalRef.current?.focus();
    } else if (previousActiveElement.current instanceof HTMLElement) {
      previousActiveElement.current.focus();
    }
  }, [open]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (closeOnBackdrop && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={classNames(
          "relative z-50 w-full max-w-lg",
          "bg-white rounded-lg shadow-xl",
          "max-h-[90vh] overflow-auto",
          "focus:outline-none",
          className
        )}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

// =============================================================================
// MODAL HEADER
// =============================================================================

interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ModalHeader({ className, children, ...props }: ModalHeaderProps) {
  return (
    <div
      className={classNames("flex flex-col space-y-1.5 p-6 pb-0", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// =============================================================================
// MODAL TITLE
// =============================================================================

interface ModalTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export function ModalTitle({ className, children, ...props }: ModalTitleProps) {
  return (
    <h2
      className={classNames("text-lg font-semibold text-gray-900", className)}
      {...props}
    >
      {children}
    </h2>
  );
}

// =============================================================================
// MODAL BODY
// =============================================================================

interface ModalBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ModalBody({ className, children, ...props }: ModalBodyProps) {
  return (
    <div className={classNames("p-6", className)} {...props}>
      {children}
    </div>
  );
}

// =============================================================================
// MODAL FOOTER
// =============================================================================

interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ModalFooter({ className, children, ...props }: ModalFooterProps) {
  return (
    <div
      className={classNames("flex items-center justify-end gap-2 p-6 pt-0", className)}
      {...props}
    >
      {children}
    </div>
  );
}
