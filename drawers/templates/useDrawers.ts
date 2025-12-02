import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";

import { parseParams, stringifyParams } from "~/utils/queryString";

/**
 * External drawer structure (URL format).
 * Uses compressed keys to minimize URL length.
 */
interface DrawerExternal {
  /** Drawer name (compressed key) */
  n: string;
  /** Drawer data (compressed key) */
  d: Record<string, unknown>;
}

/**
 * Internal drawer structure (developer-friendly format).
 */
interface DrawerInternal {
  /** Drawer name */
  name?: string;
  /** Data to pass to the drawer */
  data?: Record<string, unknown>;
}

/**
 * Find a drawer in the array by name.
 */
const findDrawer = (
  drawers: DrawerExternal[],
  drawer: string | DrawerInternal
): DrawerExternal | undefined => {
  const name = typeof drawer === "string" ? drawer : drawer?.name;

  return drawers?.find((d) => {
    if (typeof d === "string") {
      return d === name;
    }
    return d?.n === name;
  });
};

/**
 * Custom hook for managing URL-synced drawers.
 *
 * Features:
 * - Open/close drawers with URL persistence
 * - Stack multiple drawers
 * - Pass data to drawers
 * - Browser back button support
 *
 * @param preselectedName - Optional default drawer name for this hook instance
 * @returns Object with drawer management functions
 */
const useDrawers = (preselectedName?: string) => {
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const [searchParams] = useSearchParams();

  const queryString = searchParams.toString();
  const query = parseParams(queryString);

  // Parse drawers from URL (stored as 'd' param)
  const drawers: DrawerExternal[] = useMemo(() => {
    const d = query?.d;
    if (Array.isArray(d)) return d;
    if (d) return [d];
    return [];
  }, [query]);

  /**
   * Open a drawer.
   *
   * @param drawer - Drawer name or object with name and data
   *
   * @example
   * openDrawer("edit-user")
   * openDrawer({ name: "edit-user", data: { userId: "123" } })
   */
  const openDrawer = useCallback(
    (drawer: string | DrawerInternal = preselectedName || "") => {
      // Don't open if already open
      if (findDrawer(drawers, drawer)) return;

      let compressedData: string | DrawerExternal;

      if (typeof drawer === "string") {
        compressedData = { n: drawer, d: {} };
      } else {
        compressedData = {
          n: preselectedName || drawer?.name || "",
          d: drawer?.data || {},
        };
      }

      const newQuery = { ...query, d: [...drawers, compressedData] };
      navigate(pathname + stringifyParams(newQuery));
    },
    [drawers, navigate, pathname, preselectedName, query]
  );

  /**
   * Close a drawer.
   *
   * @param drawer - Drawer name or object to close
   */
  const closeDrawer = useCallback(
    (drawer: string | DrawerInternal = preselectedName || "") => {
      // Don't close if not open
      if (!findDrawer(drawers, drawer)) return;

      const name = typeof drawer === "string" ? drawer : drawer?.name;
      const mutatedDrawers = drawers.filter((d) => {
        if (typeof d === "string") return d !== name;
        return d?.n !== name;
      });

      if (mutatedDrawers.length === 0) {
        // Remove 'd' param entirely if no drawers
        const newQuery = { ...query };
        delete newQuery.d;
        navigate(pathname + stringifyParams(newQuery));
      } else {
        const newQuery = { ...query, d: mutatedDrawers };
        navigate(pathname + stringifyParams(newQuery));
      }
    },
    [drawers, navigate, pathname, query]
  );

  /**
   * Check if a drawer is currently open.
   *
   * @param drawer - Drawer name or object to check
   * @returns True if the drawer is open
   */
  const isDrawerOpen = useCallback(
    (drawer: string | DrawerInternal = preselectedName || ""): boolean => {
      return Boolean(findDrawer(drawers, drawer));
    },
    [drawers, preselectedName]
  );

  /**
   * Check if any drawers are currently open.
   */
  const areAnyDrawersOpen = useCallback((): boolean => {
    return drawers.length > 0;
  }, [drawers]);

  /**
   * Get the data associated with a drawer.
   *
   * @param drawer - Drawer name or object
   * @returns Data object passed when opening the drawer
   */
  const getDrawerData = useCallback(
    <T extends Record<string, unknown> = Record<string, unknown>>(
      drawer: string | DrawerInternal = preselectedName || ""
    ): T => {
      const drawerData = findDrawer(drawers, drawer);
      return (drawerData?.d || {}) as T;
    },
    [drawers, preselectedName]
  );

  return {
    openDrawer,
    closeDrawer,
    isDrawerOpen,
    areAnyDrawersOpen,
    getDrawerData,
  };
};

export default useDrawers;

// =============================================================================
// EXAMPLE USAGE
// =============================================================================
//
// Basic usage:
//
// const MyComponent = () => {
//   const { openDrawer, closeDrawer, isDrawerOpen } = useDrawers();
//
//   return (
//     <>
//       <button onClick={() => openDrawer("settings")}>
//         Open Settings
//       </button>
//
//       <Drawer
//         open={isDrawerOpen("settings")}
//         onClose={() => closeDrawer("settings")}
//       >
//         <SettingsContent />
//       </Drawer>
//     </>
//   );
// };
//
// =============================================================================
// WITH DATA
// =============================================================================
//
// const UserList = () => {
//   const { openDrawer, closeDrawer, isDrawerOpen, getDrawerData } = useDrawers();
//
//   const handleEditUser = (user) => {
//     openDrawer({
//       name: "edit-user",
//       data: { userId: user.id, initialTab: "profile" }
//     });
//   };
//
//   return (
//     <>
//       {users.map(user => (
//         <button key={user.id} onClick={() => handleEditUser(user)}>
//           Edit {user.name}
//         </button>
//       ))}
//
//       <Drawer
//         open={isDrawerOpen("edit-user")}
//         onClose={() => closeDrawer("edit-user")}
//       >
//         <EditUserForm {...getDrawerData<{ userId: string; initialTab: string }>("edit-user")} />
//       </Drawer>
//     </>
//   );
// };
//
// =============================================================================
// WITH PRESELECTED NAME
// =============================================================================
//
// // In a specific drawer component
// const EditUserDrawer = () => {
//   // All methods default to "edit-user" drawer
//   const { isDrawerOpen, closeDrawer, getDrawerData } = useDrawers("edit-user");
//
//   if (!isDrawerOpen()) return null;
//
//   const { userId } = getDrawerData<{ userId: string }>();
//
//   return (
//     <Drawer open onClose={closeDrawer}>
//       <EditUserForm userId={userId} />
//     </Drawer>
//   );
// };
