import { Fragment, type ReactNode } from "react";
import { Dialog, Transition, TransitionChild } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface DrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Callback when drawer should close */
  onClose: () => void;
  /** Content to display in the drawer */
  children: ReactNode;
  /** Optional title for the drawer header */
  title?: string;
  /** Width of the drawer. Defaults to "md" */
  size?: "sm" | "md" | "lg" | "xl" | "full";
  /** Side to open from. Defaults to "right" */
  side?: "left" | "right";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full",
};

/**
 * A side panel drawer with slide-in animation.
 * Simpler alternative to SlideUpDrawer for side panels.
 *
 * @example
 * <Drawer open={isOpen} onClose={handleClose} title="Settings">
 *   <SettingsForm />
 * </Drawer>
 */
const Drawer = ({
  open,
  onClose,
  children,
  title,
  size = "md",
  side = "right",
}: DrawerProps) => {
  const isRight = side === "right";

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <TransitionChild
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div
              className={`pointer-events-none fixed inset-y-0 flex max-w-full ${
                isRight ? "right-0 pl-10" : "left-0 pr-10"
              }`}
            >
              <TransitionChild
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom={isRight ? "translate-x-full" : "-translate-x-full"}
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-200"
                leaveFrom="translate-x-0"
                leaveTo={isRight ? "translate-x-full" : "-translate-x-full"}
              >
                <Dialog.Panel
                  className={`pointer-events-auto w-screen ${sizeClasses[size]}`}
                >
                  <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                    {/* Header */}
                    {title && (
                      <div className="border-b border-gray-200 px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <Dialog.Title className="text-lg font-semibold text-gray-900">
                            {title}
                          </Dialog.Title>
                          <button
                            type="button"
                            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            onClick={onClose}
                          >
                            <span className="sr-only">Close</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="relative flex-1 px-4 py-4 sm:px-6">
                      {children}
                    </div>
                  </div>
                </Dialog.Panel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default Drawer;

// =============================================================================
// EXAMPLE USAGE - BASIC
// =============================================================================
//
// import Drawer from "~/components/Drawer";
// import { useState } from "react";
//
// const MyComponent = () => {
//   const [isOpen, setIsOpen] = useState(false);
//
//   return (
//     <>
//       <button onClick={() => setIsOpen(true)}>
//         Open Drawer
//       </button>
//
//       <Drawer
//         open={isOpen}
//         onClose={() => setIsOpen(false)}
//         title="Settings"
//       >
//         <SettingsForm onSave={() => setIsOpen(false)} />
//       </Drawer>
//     </>
//   );
// };
//
// =============================================================================
// EXAMPLE USAGE - WITH URL STATE
// =============================================================================
//
// import Drawer from "~/components/Drawer";
// import useDrawers from "~/hooks/useDrawers";
//
// const MyComponent = () => {
//   const { openDrawer, closeDrawer, isDrawerOpen, getDrawerData } = useDrawers();
//
//   return (
//     <>
//       <button onClick={() => openDrawer({ name: "user-details", data: { userId: "123" } })}>
//         View User
//       </button>
//
//       <Drawer
//         open={isDrawerOpen("user-details")}
//         onClose={() => closeDrawer("user-details")}
//         title="User Details"
//         size="lg"
//       >
//         <UserDetails userId={getDrawerData("user-details").userId} />
//       </Drawer>
//     </>
//   );
// };
//
// =============================================================================
// EXAMPLE USAGE - LEFT SIDE
// =============================================================================
//
// <Drawer
//   open={isOpen}
//   onClose={handleClose}
//   title="Navigation"
//   side="left"
//   size="sm"
// >
//   <NavigationMenu />
// </Drawer>
//
// =============================================================================
// CUSTOMIZATION - WITHOUT HEADER
// =============================================================================
//
// // Omit the title prop for a headerless drawer
// <Drawer open={isOpen} onClose={handleClose}>
//   <div className="flex h-full flex-col">
//     {/* Custom header */}
//     <div className="flex items-center justify-between border-b p-4">
//       <h2>Custom Header</h2>
//       <button onClick={handleClose}>Close</button>
//     </div>
//
//     {/* Content */}
//     <div className="flex-1 overflow-y-auto p-4">
//       Content here
//     </div>
//
//     {/* Footer */}
//     <div className="border-t p-4">
//       <button>Save</button>
//     </div>
//   </div>
// </Drawer>
