/**
 * Hook for fetching paginated resource collections
 *
 * Usage:
 *   const { data, totalPages, isLoading } = usePaginatedResource<User>({
 *     resource: "users",
 *     page: 1,
 *     limit: 10,
 *     where: { status: { equals: "active" } },
 *   });
 */

import { useQuery } from "@tanstack/react-query";
import { getCollection, getPublicCollection } from "./crud";
// NOTE: Import from your project's utils location (e.g., ~/utils/queryString)
import { buildCacheKey } from "~/utils/queryString";
import type {
  PaginatedResponse,
  PaginationParams,
  UsePaginatedResourceReturn,
} from "./types";

interface UsePaginatedResourceParams extends PaginationParams {
  resource: string;
  enabled?: boolean;
  publicEndpoint?: boolean;
}

/**
 * Creates a unique cache key for pagination queries
 */
const createPaginationKey = (
  resource: string,
  params: PaginationParams
): string => {
  return `${resource}-list-${buildCacheKey(params)}`;
};

export default function usePaginatedResource<T>({
  resource,
  page = 1,
  limit = 10,
  sort,
  where,
  enabled = true,
  publicEndpoint = false,
}: UsePaginatedResourceParams): UsePaginatedResourceReturn<T> {
  const cacheKey = createPaginationKey(resource, { page, limit, sort, where });

  const fetchFn = publicEndpoint ? getPublicCollection : getCollection;

  const { data, isLoading } = useQuery({
    queryKey: [cacheKey],
    queryFn: () => fetchFn<T>(resource, { page, limit, sort, where }),
    enabled: enabled && Boolean(resource),
    refetchOnWindowFocus: false,
  });

  // Handle error response vs paginated response
  const isPaginated = data && "docs" in data;

  return {
    data: isPaginated ? (data as PaginatedResponse<T>).data : [],
    totalPages: isPaginated ? (data as PaginatedResponse<T>).totalPages : undefined,
    totalItems: isPaginated ? (data as PaginatedResponse<T>).totalDocs : undefined,
    currentPage: page,
    isLoading,
  };
}

/**
 * Public variant for unauthenticated endpoints
 */
export function usePublicPaginatedResource<T>(
  params: Omit<UsePaginatedResourceParams, "publicEndpoint">
): UsePaginatedResourceReturn<T> {
  return usePaginatedResource<T>({ ...params, publicEndpoint: true });
}
