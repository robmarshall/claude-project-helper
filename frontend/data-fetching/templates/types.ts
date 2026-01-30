/**
 * Shared types for the data fetching layer
 */

// API response wrapper - all API operations return this
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Paginated response from collection endpoints
export interface PaginatedResponse<T> {
  data: T[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage?: number;
  prevPage?: number;
}

// Options for the base API function
export interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  auth?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

// Options for file uploads
export interface FileApiOptions extends ApiOptions {
  file: File;
}

// Pagination parameters for list queries
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string | string[];
  where?: Record<string, unknown>;
}

// Base item with ID (most resources have this)
export interface ResourceItem {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

// Hook return type for single resource operations
export interface UseResourceReturn<TInput, TOutput> {
  data: TOutput | undefined;
  isLoading: boolean;
  createItem: (item: Partial<TInput>) => Promise<ApiResponse<TOutput>>;
  updateItem: (item: Partial<TOutput>) => Promise<ApiResponse<TOutput>>;
  deleteItem: () => Promise<boolean>;
  refetch: () => void;
}

// Hook return type for paginated resource operations
export interface UsePaginatedResourceReturn<T> {
  data: T[];
  totalPages: number | undefined;
  totalItems: number | undefined;
  currentPage: number;
  isLoading: boolean;
}
