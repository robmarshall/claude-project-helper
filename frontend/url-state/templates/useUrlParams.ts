import { useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";

import { parseParams, stringifyParams } from "~/utils/queryString";

/**
 * Type for individual URL parameter values.
 */
type QueryParamValue =
  | string
  | number
  | boolean
  | object
  | null
  | undefined
  | QueryParamValue[]
  | { [key: string]: QueryParamValue };

/**
 * Interface for URL parameters object.
 */
interface Params {
  [key: string]: QueryParamValue;
}

/**
 * Removes empty/null/undefined values from an object recursively.
 */
const removeEmptyObjectKeys = <T extends Record<string, unknown>>(obj: T): T => {
  const result = {} as T;

  for (const key of Object.keys(obj)) {
    const value = obj[key];

    if (value === null || value === undefined || value === "") {
      continue;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      const nested = removeEmptyObjectKeys(value as Record<string, unknown>);
      if (Object.keys(nested).length > 0) {
        result[key as keyof T] = nested as T[keyof T];
      }
    } else {
      result[key as keyof T] = value as T[keyof T];
    }
  }

  return result;
};

/**
 * Custom hook for managing URL query parameters.
 *
 * Features:
 * - Get and set URL parameters
 * - Smart change detection (prevents unnecessary navigations)
 * - Nested object support
 * - Empty value cleanup
 *
 * @returns Object with params, setUrlParams, and clearAllParams
 */
const useUrlParams = (): {
  /** Current URL parameters as an object */
  params: Params;
  /** Set/merge URL parameters. Existing params are preserved unless overwritten. */
  setUrlParams: (params: Params) => void;
  /** Clear all URL parameters, keeping only the pathname */
  clearAllParams: () => void;
} => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const stringParams = searchParams.toString();

  /**
   * Set URL parameters. Merges with existing params.
   * Includes change detection to prevent unnecessary navigations.
   */
  const setUrlParams = useCallback(
    (params: Params) => {
      const currentParams = parseParams(stringParams);

      // Check if there are any actual differences
      const hasChanges = (() => {
        // Check all keys in new params
        for (const key of Object.keys(params)) {
          if (
            typeof params[key] === "object" &&
            params[key] !== null &&
            !Array.isArray(params[key])
          ) {
            // Handle nested objects
            const newSubObj = params[key] as Record<string, unknown>;
            const currentSubObj =
              currentParams[key] &&
              typeof currentParams[key] === "object" &&
              currentParams[key] !== null &&
              !Array.isArray(currentParams[key])
                ? (currentParams[key] as Record<string, unknown>)
                : {};

            for (const subKey of Object.keys(newSubObj)) {
              if (newSubObj[subKey] !== currentSubObj[subKey]) {
                return true;
              }
            }
          } else {
            // Handle primitive values
            if (params[key] !== currentParams[key]) {
              return true;
            }
          }
        }

        // Check if any keys were removed
        for (const key of Object.keys(currentParams)) {
          if (!(key in params)) {
            return true;
          }
        }

        return false;
      })();

      // If no changes, do nothing
      if (!hasChanges) {
        return;
      }

      // Merge new params with current
      let newParams = { ...currentParams, ...params };

      // Remove empty values
      newParams = removeEmptyObjectKeys(newParams);

      setSearchParams(stringifyParams(newParams).slice(1)); // Remove "?" prefix
    },
    [stringParams, setSearchParams]
  );

  /**
   * Clear all URL parameters, navigating to just the pathname.
   */
  const clearAllParams = useCallback(() => {
    navigate(pathname);
  }, [pathname, navigate]);

  const params: Params = parseParams(stringParams);

  return { params, setUrlParams, clearAllParams };
};

export default useUrlParams;

// =============================================================================
// EXAMPLE USAGE
// =============================================================================
//
// import useUrlParams from "~/hooks/useUrlParams";
//
// const FilteredList = () => {
//   const { params, setUrlParams, clearAllParams } = useUrlParams();
//
//   // Read params with defaults
//   const page = Number(params.page) || 1;
//   const search = (params.search as string) || "";
//   const status = (params.status as string) || "all";
//
//   // Update params (merges with existing)
//   const handleSearch = (value: string) => {
//     setUrlParams({ search: value, page: 1 }); // Reset to page 1 on search
//   };
//
//   const handleStatusChange = (status: string) => {
//     setUrlParams({ status, page: 1 });
//   };
//
//   const handlePageChange = (newPage: number) => {
//     setUrlParams({ ...params, page: newPage });
//   };
//
//   // Clear all filters
//   const handleReset = () => {
//     clearAllParams();
//   };
//
//   return (
//     <div>
//       <input
//         value={search}
//         onChange={(e) => handleSearch(e.target.value)}
//         placeholder="Search..."
//       />
//       <select
//         value={status}
//         onChange={(e) => handleStatusChange(e.target.value)}
//       >
//         <option value="all">All</option>
//         <option value="active">Active</option>
//         <option value="inactive">Inactive</option>
//       </select>
//       <button onClick={handleReset}>Reset Filters</button>
//     </div>
//   );
// };
//
// =============================================================================
// NESTED OBJECTS EXAMPLE
// =============================================================================
//
// setUrlParams({
//   filters: {
//     status: "active",
//     category: "electronics"
//   },
//   sort: {
//     field: "createdAt",
//     direction: "desc"
//   }
// });
// // URL: ?filters.status=active&filters.category=electronics&sort.field=createdAt&sort.direction=desc
