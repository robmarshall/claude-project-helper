/**
 * URL-synced modal state management hook.
 *
 * Modals are stored as an array in URL params, enabling:
 * - Multiple modals open simultaneously
 * - Shareable URLs that open specific modals
 * - Browser back/forward button support
 * - Data passed to modals via URL
 *
 * URL format: ?m=[{n:"modal-name",d:{id:"123"}}]
 * - 'm' = modals array
 * - 'n' = name (compressed)
 * - 'd' = data (compressed)
 */

import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { parseParams, stringifyParams } from "~/utils/queryString";

/**
 * External modal structure (stored in URL - compressed keys)
 */
interface ExternalModal {
  /** Modal name (compressed) */
  n?: string;
  /** Modal data (compressed) */
  d?: any;
}

/**
 * Internal modal structure (used in code - readable keys)
 */
interface InternalModal {
  /** Modal name */
  name?: string;
  /** Data to pass to the modal */
  data?: any;
}

/**
 * Find a modal in the array by name
 */
const findModal = (
  modals: ExternalModal[],
  modal: string | InternalModal
): ExternalModal | undefined => {
  const searchName = typeof modal === "string" ? modal : modal?.name;

  return modals?.find((m) => {
    if (typeof m === "string") {
      return m === searchName;
    }
    return m?.n === searchName;
  });
};

interface UseModalsReturn {
  /** Open a modal by name, optionally with data */
  openModal: (modal?: string | InternalModal) => void;
  /** Close a modal by name */
  closeModal: (modal?: string | InternalModal) => void;
  /** Check if a modal is currently open */
  isModalOpen: (modal?: string | InternalModal) => boolean;
  /** Get data passed to a modal */
  getModalData: (modal?: string | InternalModal) => any;
  /** Check if any modals are open */
  areAnyModalsOpen: () => boolean;
}

/**
 * Internal hook implementation shared between public and authenticated versions
 */
const useModalsInternal = ({
  preselectedName,
  isReady,
}: {
  preselectedName: string;
  isReady: boolean;
}): UseModalsReturn => {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const [searchParams] = useSearchParams();
  const query = parseParams(searchParams.toString());
  const modals: ExternalModal[] = useMemo(() => query?.m || [], [query]);

  /**
   * Open a modal
   */
  const openModal = useCallback(
    (modal: string | InternalModal = preselectedName) => {
      // Don't open if already open
      if (findModal(modals, modal)) return;

      const compressedData: string | ExternalModal =
        typeof modal === "string"
          ? modal
          : { n: preselectedName || modal?.name, d: modal?.data };

      const newQuery = { ...query, m: [...modals, compressedData] };
      navigate(pathname + stringifyParams(newQuery));
    },
    [modals, query, pathname, navigate, preselectedName]
  );

  /**
   * Close a modal
   */
  const closeModal = useCallback(
    (modal: string | InternalModal = preselectedName) => {
      // Don't close if not open
      if (!findModal(modals, modal)) return;

      const modalName = typeof modal === "string" ? modal : modal.name;

      const mutatedModals = modals.filter((m) =>
        typeof m === "string" ? m !== modalName : m?.n !== modalName
      );

      if (mutatedModals.length === 0) {
        // Remove 'm' param entirely when no modals
        const newQuery = { ...query };
        delete newQuery.m;
        navigate(pathname + stringifyParams(newQuery));
      } else {
        navigate(pathname + stringifyParams({ ...query, m: mutatedModals }));
      }
    },
    [modals, query, pathname, navigate, preselectedName]
  );

  /**
   * Check if a modal is open
   */
  const isModalOpen = useCallback(
    (modal: string | InternalModal = preselectedName): boolean => {
      if (!isReady) return false;
      return Boolean(findModal(modals, modal));
    },
    [modals, preselectedName, isReady]
  );

  /**
   * Get data passed to a modal
   */
  const getModalData = useCallback(
    (modal: string | InternalModal = preselectedName): any => {
      return findModal(modals, modal)?.d || {};
    },
    [modals, preselectedName]
  );

  /**
   * Check if any modals are open
   */
  const areAnyModalsOpen = useCallback((): boolean => {
    return modals.length > 0;
  }, [modals]);

  return { openModal, closeModal, isModalOpen, getModalData, areAnyModalsOpen };
};

/**
 * Hook for URL-synced modal state (authenticated routes)
 *
 * @param preselectedName - Default modal name for this instance
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { openModal, closeModal, isModalOpen } = useModals("edit-user");
 *
 * // Open modal
 * <button onClick={() => openModal()}>Edit</button>
 *
 * // Or open with data
 * <button onClick={() => openModal({ name: "edit-user", data: { userId: "123" } })}>
 *   Edit User
 * </button>
 *
 * // Check if open and render
 * {isModalOpen() && (
 *   <Modal onClose={() => closeModal()}>
 *     <EditUserForm userId={getModalData().userId} />
 *   </Modal>
 * )}
 * ```
 *
 * @example
 * ```tsx
 * // Multiple modals
 * const editModal = useModals("edit");
 * const deleteModal = useModals("delete");
 *
 * // Both can be open simultaneously
 * editModal.openModal();
 * deleteModal.openModal({ data: { itemId: "456" } });
 *
 * // URL: ?m=[{n:"edit"},{n:"delete",d:{itemId:"456"}}]
 * ```
 */
const useModals = (preselectedName?: string): UseModalsReturn => {
  // In a real app, you'd check authentication state here
  // const { isAuthenticated, isLoading } = useAuth();
  // const isReady = isAuthenticated && !isLoading;

  // For this template, assume ready when component mounts
  const isReady = true;

  return useModalsInternal({
    preselectedName: preselectedName || "",
    isReady,
  });
};

/**
 * Hook for URL-synced modal state (public/unauthenticated routes)
 *
 * Same as useModals but doesn't wait for authentication.
 * Use on public pages where modals should work without login.
 *
 * @example
 * ```tsx
 * // Public pricing page with feature modal
 * const { openModal, isModalOpen, closeModal } = usePublicModals("feature-details");
 *
 * // URL can be shared: /pricing?m=[{n:"feature-details",d:{feature:"api"}}]
 * ```
 */
export const usePublicModals = (preselectedName?: string): UseModalsReturn => {
  return useModalsInternal({
    preselectedName: preselectedName || "",
    isReady: true,
  });
};

export default useModals;
