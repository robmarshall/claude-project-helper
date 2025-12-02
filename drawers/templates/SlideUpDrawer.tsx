import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Dialog, Transition, TransitionChild } from "@headlessui/react";
import { AnimatePresence, motion } from "motion/react";

// =============================================================================
// SLIDE PAGE COMPONENT
// =============================================================================

interface SlidePageProps {
  /** Whether this page is currently active */
  active?: boolean;
  /** Content to display */
  children: ReactNode;
  /** Callback to set the content height for animations */
  setContentHeight: (height: number | null) => void;
  /** Unique identifier for this page */
  id: string;
}

/**
 * A page within a multi-step drawer.
 * Only renders when active, and reports its height for smooth animations.
 */
export const SlidePage = ({
  active,
  children,
  setContentHeight,
  id,
}: SlidePageProps) => {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active && typeof setContentHeight === "function") {
      setContentHeight(divRef.current?.clientHeight || null);
    }
  }, [active, setContentHeight]);

  if (!active) return null;

  return (
    <div id={id} ref={divRef}>
      {children}
    </div>
  );
};

// =============================================================================
// SECTION SLIDER COMPONENT
// =============================================================================

interface SectionSliderProps {
  /** Content to animate */
  children: ReactNode;
  /** Current height for smooth transitions */
  contentHeight: number | null;
  /** Current page ID for animation keying */
  currentId: string;
  /** Callback to update content height */
  setContentHeight: (height: number | null) => void;
}

/**
 * Animates content sliding between pages in a drawer.
 * Handles height transitions and horizontal slide animations.
 */
export const SectionSlider = ({
  children,
  contentHeight,
  currentId,
  setContentHeight,
}: SectionSliderProps) => {
  const drawerVariants = {
    hidden: { y: "100%" },
    visible: { y: 0 },
  };

  const contentVariants = {
    hidden: { opacity: 0, x: "100%" },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 1, x: "-100%" },
  };

  return (
    <motion.div
      layout
      className="w-full transform overflow-hidden rounded-t-lg bg-white text-left transition-all"
      variants={drawerVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      transition={{ duration: 0.3, ease: "easeInOut" }}
      style={{
        height: contentHeight || "auto",
      }}
      onAnimationComplete={() => setContentHeight(null)}
    >
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={currentId}
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

// =============================================================================
// SLIDE UP DRAWER COMPONENT
// =============================================================================

interface SlideUpDrawerProps {
  /** Whether the drawer is open */
  open: boolean;
  /** Content to display in the drawer */
  children: ReactNode;
  /** Callback when drawer should close */
  onClose: () => void;
}

/**
 * A bottom sheet drawer with slide-up animation.
 * Uses Headless UI Dialog for accessibility.
 *
 * @example
 * <SlideUpDrawer open={isOpen} onClose={handleClose}>
 *   <DrawerContent />
 * </SlideUpDrawer>
 */
const SlideUpDrawer = ({ open, children, onClose }: SlideUpDrawerProps) => (
  <Transition show={open} as={Fragment}>
    <Dialog
      as="div"
      className="fixed inset-0 bottom-0 z-50 overflow-y-auto"
      onClose={onClose}
      static
    >
      <div className="flex items-end justify-center">
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
          <div className="fixed inset-0 min-h-screen bg-gray-500/75 transition-opacity" />
        </TransitionChild>

        {/* Drawer panel */}
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="translate-y-full"
          enterTo="translate-y-0"
          leave="ease-in duration-200"
          leaveFrom="translate-y-0"
          leaveTo="translate-y-full"
        >
          <div className="fixed bottom-0 w-full">{children}</div>
        </TransitionChild>
      </div>
    </Dialog>
  </Transition>
);

export default SlideUpDrawer;

// =============================================================================
// EXAMPLE USAGE - BASIC
// =============================================================================
//
// import SlideUpDrawer from "~/components/SlideUpDrawer";
// import useDrawers from "~/hooks/useDrawers";
//
// const MyComponent = () => {
//   const { openDrawer, closeDrawer, isDrawerOpen } = useDrawers();
//
//   return (
//     <>
//       <button onClick={() => openDrawer("my-drawer")}>
//         Open Drawer
//       </button>
//
//       <SlideUpDrawer
//         open={isDrawerOpen("my-drawer")}
//         onClose={() => closeDrawer("my-drawer")}
//       >
//         <div className="rounded-t-lg bg-white p-6">
//           <h2 className="text-lg font-semibold">Drawer Title</h2>
//           <p>Drawer content goes here</p>
//         </div>
//       </SlideUpDrawer>
//     </>
//   );
// };
//
// =============================================================================
// EXAMPLE USAGE - MULTI-PAGE DRAWER
// =============================================================================
//
// const MultiPageDrawer = () => {
//   const [currentPage, setCurrentPage] = useState("step1");
//   const [contentHeight, setContentHeight] = useState<number | null>(null);
//   const { isDrawerOpen, closeDrawer } = useDrawers("wizard");
//
//   return (
//     <SlideUpDrawer
//       open={isDrawerOpen()}
//       onClose={closeDrawer}
//     >
//       <SectionSlider
//         contentHeight={contentHeight}
//         currentId={currentPage}
//         setContentHeight={setContentHeight}
//       >
//         <SlidePage
//           id="step1"
//           active={currentPage === "step1"}
//           setContentHeight={setContentHeight}
//         >
//           <div className="p-6">
//             <h2>Step 1</h2>
//             <button onClick={() => setCurrentPage("step2")}>Next</button>
//           </div>
//         </SlidePage>
//
//         <SlidePage
//           id="step2"
//           active={currentPage === "step2"}
//           setContentHeight={setContentHeight}
//         >
//           <div className="p-6">
//             <h2>Step 2</h2>
//             <button onClick={() => setCurrentPage("step1")}>Back</button>
//             <button onClick={closeDrawer}>Finish</button>
//           </div>
//         </SlidePage>
//       </SectionSlider>
//     </SlideUpDrawer>
//   );
// };
