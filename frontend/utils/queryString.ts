/**
 * Query string utilities for building API URLs and cache keys
 *
 * REQUIRES: npm install qs @types/qs
 */
import { stringify } from "qs";

/**
 * Builds a query string for API URLs
 * Returns string with ? prefix, e.g., "?page=1&limit=10&where[status]=active"
 *
 * @example
 * buildQueryString({ page: 1, limit: 10, where: { status: "active" } })
 * // Returns: "?page=1&limit=10&where[status]=active"
 */
export const buildQueryString = (params: Record<string, unknown>): string => {
  return stringify(params, {
    addQueryPrefix: true,
    skipNulls: true,
    encode: false,
  });
};

/**
 * Builds a query string for cache keys (no ? prefix)
 * Returns string without prefix, e.g., "page=1&limit=10"
 *
 * @example
 * buildCacheKey({ page: 1, limit: 10, sort: "-createdAt" })
 * // Returns: "page=1&limit=10&sort=-createdAt"
 */
export const buildCacheKey = (params: Record<string, unknown>): string => {
  return stringify(params, {
    addQueryPrefix: false,
    skipNulls: true,
    allowDots: true,
  });
};

/**
 * Appends sort parameter to existing query string
 * Sort can be a single field or array of fields
 *
 * @example
 * appendSort("?page=1", "-createdAt")
 * // Returns: "?page=1&sort=-createdAt"
 *
 * appendSort("?page=1", ["-featured", "name"])
 * // Returns: "?page=1&sort=-featured,name"
 */
export const appendSort = (
  queryString: string,
  sort: string | string[] | undefined
): string => {
  if (!sort) return queryString;

  const sortValue = Array.isArray(sort) ? sort.join(",") : sort;
  return `${queryString}&sort=${sortValue}`;
};
