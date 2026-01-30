/**
 * Hook for fetching and mutating a single resource item
 *
 * Usage:
 *   const { data, isLoading, updateItem } = useResource<UserInput, User>({
 *     resource: "users",
 *     id: userId,
 *   });
 */

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createItem, getItem, updateItem, deleteItem } from "./crud";
import { createCacheKey, invalidateResource, removeFromCache } from "./cache";
import type { ApiResponse, ResourceItem, UseResourceReturn } from "./types";

interface UseResourceParams {
  resource: string;
  id?: string | null;
  enabled?: boolean;
}

export default function useResource<
  TInput = Record<string, unknown>,
  TOutput extends ResourceItem = ResourceItem,
>({
  resource,
  id,
  enabled = true,
}: UseResourceParams): UseResourceReturn<TInput, TOutput> {
  const queryClient = useQueryClient();
  const [isDeleted, setIsDeleted] = useState(false);

  const cacheKey = createCacheKey(resource, id || undefined);
  const shouldFetch = enabled && Boolean(resource && id && !isDeleted);

  // Fetch single item
  const { data, isLoading, refetch } = useQuery({
    queryKey: [cacheKey],
    queryFn: () => getItem<TOutput>(resource, id!),
    enabled: shouldFetch,
    refetchOnWindowFocus: false,
  });

  // Create new item
  const create = async (
    item: Partial<TInput>
  ): Promise<ApiResponse<TOutput>> => {
    const { file, ...rest } = item as Record<string, unknown> & { file?: File };

    const result = await createItem<TOutput>(
      resource,
      rest as Record<string, unknown>,
      file ? { file } : undefined
    );

    if (result.success) {
      invalidateResource(resource);
    }

    return result;
  };

  // Update existing item
  const update = async (
    item: Partial<TOutput>
  ): Promise<ApiResponse<TOutput>> => {
    if (!id) {
      return { success: false, message: "No ID provided for update" };
    }

    const { file, ...rest } = item as Record<string, unknown> & { file?: File };

    const result = await updateItem<TOutput>(
      resource,
      id,
      rest as Record<string, unknown>,
      file ? { file } : undefined
    );

    if (result.success) {
      invalidateResource(resource);
    }

    return result;
  };

  // Delete item
  const remove = async (): Promise<boolean> => {
    if (!id) return false;

    const result = await deleteItem(resource, id);

    if (result.success) {
      setIsDeleted(true);
      removeFromCache(resource, id);
      invalidateResource(resource);
      return true;
    }

    return false;
  };

  return {
    data: data?.data,
    isLoading,
    createItem: create,
    updateItem: update,
    deleteItem: remove,
    refetch: () => {
      if (!isDeleted) refetch();
    },
  };
}

/**
 * Standalone hook for creating items without loading existing data
 */
export function useCreateResource<TInput, TOutput>(resource: string) {
  const create = async (item: TInput): Promise<ApiResponse<TOutput>> => {
    const { file, ...rest } = item as Record<string, unknown> & { file?: File };

    const result = await createItem<TOutput>(
      resource,
      rest as Record<string, unknown>,
      file ? { file } : undefined
    );

    if (result.success) {
      invalidateResource(resource);
    }

    return result;
  };

  return create;
}
