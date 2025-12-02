/**
 * Generic CRUD operations for REST resources
 *
 * CONFIGURE: Set API_URL for your backend
 */

import { api, fileApi, publicApi } from "./api";
// NOTE: Import from your project's utils location (e.g., ~/utils/queryString)
import { buildQueryString, appendSort } from "~/utils/queryString";
import type {
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  FileApiOptions,
} from "./types";

// TODO: Configure this for your project
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

/**
 * Creates a new item in the resource
 */
export const createItem = async <T>(
  resource: string,
  data: Record<string, unknown>,
  options?: { file?: File; signal?: AbortSignal }
): Promise<ApiResponse<T>> => {
  try {
    const url = `${API_URL}/${resource}`;

    let result: { doc: T };

    if (options?.file) {
      result = await fileApi<{ doc: T }>(url, data, {
        method: "POST",
        file: options.file,
        signal: options.signal,
      });
    } else {
      result = await api<{ doc: T }>(url, data, { method: "POST" });
    }

    return { success: true, data: result.doc };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Create failed",
    };
  }
};

/**
 * Gets a single item by ID
 */
export const getItem = async <T>(
  resource: string,
  id: string
): Promise<ApiResponse<T>> => {
  try {
    const url = `${API_URL}/${resource}/${id}`;
    const data = await api<T>(url, null, { method: "GET" });
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Get failed",
    };
  }
};

/**
 * Updates an existing item by ID
 */
export const updateItem = async <T>(
  resource: string,
  id: string,
  data: Record<string, unknown>,
  options?: { file?: File; signal?: AbortSignal }
): Promise<ApiResponse<T>> => {
  try {
    const url = `${API_URL}/${resource}/${id}`;

    let result: { doc: T };

    if (options?.file) {
      result = await fileApi<{ doc: T }>(url, data, {
        method: "PATCH",
        file: options.file,
        signal: options.signal,
      });
    } else {
      result = await api<{ doc: T }>(url, data, { method: "PATCH" });
    }

    return { success: true, data: result.doc };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Update failed",
    };
  }
};

/**
 * Deletes an item by ID
 */
export const deleteItem = async <T>(
  resource: string,
  id: string
): Promise<ApiResponse<T>> => {
  try {
    const url = `${API_URL}/${resource}/${id}`;
    const data = await api<{ doc: T }>(url, null, { method: "DELETE" });
    return { success: true, data: data.doc };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Delete failed",
    };
  }
};

/**
 * Gets a paginated collection of items
 */
export const getCollection = async <T>(
  resource: string,
  params: PaginationParams = {}
): Promise<PaginatedResponse<T> | ApiResponse<never>> => {
  try {
    const { page = 1, limit = 10, sort, where } = params;

    const queryString = appendSort(
      buildQueryString({ page, limit, where }),
      sort
    );

    const url = `${API_URL}/${resource}${queryString}`;
    const data = await api<PaginatedResponse<T>>(url, null, { method: "GET" });

    return data;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Get collection failed",
    };
  }
};

// ============ PUBLIC (unauthenticated) variants ============

/**
 * Gets a single item by ID (public endpoint)
 */
export const getPublicItem = async <T>(
  resource: string,
  id: string
): Promise<ApiResponse<T>> => {
  try {
    const url = `${API_URL}/${resource}/${id}`;
    const data = await publicApi<T>(url, null, { method: "GET" });
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Get failed",
    };
  }
};

/**
 * Gets a paginated collection (public endpoint)
 */
export const getPublicCollection = async <T>(
  resource: string,
  params: PaginationParams = {}
): Promise<PaginatedResponse<T> | ApiResponse<never>> => {
  try {
    const { page = 1, limit = 10, sort, where } = params;

    const queryString = appendSort(
      buildQueryString({ page, limit, where }),
      sort
    );

    const url = `${API_URL}/${resource}${queryString}`;
    const data = await publicApi<PaginatedResponse<T>>(url, null, {
      method: "GET",
    });

    return data;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Get collection failed",
    };
  }
};
