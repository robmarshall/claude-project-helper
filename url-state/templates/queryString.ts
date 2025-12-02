import { parse, stringify } from "qs";

/**
 * Type for individual URL parameter values.
 * Supports primitives, arrays, and nested objects.
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
 * Type for URL parameters object.
 */
type QueryParams = Record<string, QueryParamValue>;

/**
 * Converts an object to a URL query string.
 *
 * @param params - The parameters object to stringify
 * @returns Query string with "?" prefix (e.g., "?page=1&search=hello")
 *
 * @example
 * stringifyParams({ page: 1, search: "hello" })
 * // Returns: "?page=1&search=hello"
 *
 * @example
 * // Nested objects use dot notation
 * stringifyParams({ filters: { status: "active" } })
 * // Returns: "?filters.status=active"
 */
export const stringifyParams = (params: QueryParams): string =>
  stringify(params, {
    skipNulls: true, // Remove null values from output
    addQueryPrefix: true, // Add "?" prefix
    allowDots: true, // Use dot notation for nested objects
    encode: false, // Don't URL-encode values
  });

/**
 * Parses a URL query string into an object.
 *
 * @param queryString - The query string to parse (with or without "?" prefix)
 * @returns Parsed parameters object
 *
 * @example
 * parseParams("?page=1&search=hello")
 * // Returns: { page: "1", search: "hello" }
 *
 * @example
 * // Dot notation parsed as nested objects
 * parseParams("?filters.status=active")
 * // Returns: { filters: { status: "active" } }
 */
export const parseParams = (queryString: string): QueryParams =>
  parse(queryString, {
    allowDots: true, // Parse dot notation as nested objects
    ignoreQueryPrefix: true, // Handle strings with or without "?"
  }) as QueryParams;

// =============================================================================
// EXAMPLE USAGE
// =============================================================================
//
// Basic usage:
// import { parseParams, stringifyParams } from "~/util/queryString";
//
// // Parse current URL params
// const params = parseParams(window.location.search);
//
// // Build a new query string
// const qs = stringifyParams({ page: 1, search: "test" });
// // Result: "?page=1&search=test"
//
// // With nested objects
// const qs = stringifyParams({
//   filters: { status: "active", type: "premium" }
// });
// // Result: "?filters.status=active&filters.type=premium"
//
// =============================================================================
// ALTERNATIVE: Without "?" prefix (for cache keys, etc.)
// =============================================================================
//
// export const buildCacheKey = (params: QueryParams): string =>
//   stringify(params, {
//     skipNulls: true,
//     allowDots: true,
//     encode: false,
//     // No addQueryPrefix - returns "page=1&search=hello"
//   });
