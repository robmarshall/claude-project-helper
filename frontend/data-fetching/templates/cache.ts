/**
 * Cache utilities for TanStack Query
 *
 * REQUIRES: QueryClient to be initialized and accessible
 */

import { QueryClient } from "@tanstack/react-query";

// Create and export the query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity, // Data doesn't auto-stale; use manual invalidation
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Creates a cache key for a resource
 * Pattern: {resource} or {resource}-{id}
 */
export const createCacheKey = (resource: string, id?: string): string => {
  return id ? `${resource}-${id}` : resource;
};

/**
 * Invalidates all cache entries for a resource
 * Use after create/update/delete operations
 */
export const invalidateResource = (resource: string): void => {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey[0];
      return typeof key === "string" && key.startsWith(resource);
    },
  });
};

/**
 * Removes a specific item from cache
 * Use after deleting an item
 */
export const removeFromCache = (resource: string, id: string): void => {
  const key = createCacheKey(resource, id);
  queryClient.removeQueries({ queryKey: [key] });
};

/**
 * Clears all cache
 * Use sparingly - prefer targeted invalidation
 */
export const clearAllCache = (): void => {
  queryClient.clear();
};
