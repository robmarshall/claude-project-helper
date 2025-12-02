/**
 * Low-level API fetch wrapper with authentication and token refresh
 *
 * CONFIGURE: Set API_URL and REFRESH_URL for your backend
 */

import type { ApiOptions, FileApiOptions } from "./types";

// TODO: Configure these for your project
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const REFRESH_URL = `${API_URL}/users/refresh-token`;

/**
 * Makes an authenticated API request with automatic token refresh on 401
 */
export const api = async <T = unknown>(
  url: string,
  body: Record<string, unknown> | null = null,
  options: ApiOptions = {},
  retry = true
): Promise<T> => {
  const { method = "POST", auth = true, headers = {}, signal } = options;

  const res = await fetch(url, {
    method,
    ...(body && (method === "POST" || method === "PATCH" || method === "PUT")
      ? { body: JSON.stringify(body) }
      : {}),
    ...(auth ? { credentials: "include" as const } : {}),
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    signal,
  });

  // Auto-refresh token on 401 and retry once
  if (res.status === 401 && auth && retry) {
    const refreshRes = await fetch(REFRESH_URL, {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      return api<T>(url, body, options, false);
    }
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
};

/**
 * Makes an API request with file upload (FormData)
 */
export const fileApi = async <T = unknown>(
  url: string,
  data: Record<string, unknown>,
  options: FileApiOptions,
  retry = true
): Promise<T> => {
  const { method = "POST", auth = true, file, signal } = options;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("_payload", JSON.stringify(data));

  const res = await fetch(url, {
    method,
    body: formData,
    ...(auth ? { credentials: "include" as const } : {}),
    signal,
  });

  // Auto-refresh token on 401 and retry once
  if (res.status === 401 && auth && retry) {
    const refreshRes = await fetch(REFRESH_URL, {
      method: "POST",
      credentials: "include",
    });

    if (refreshRes.ok) {
      return fileApi<T>(url, data, options, false);
    }
    throw new Error("Session expired. Please log in again.");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
};

/**
 * Makes an unauthenticated (public) API request
 */
export const publicApi = async <T = unknown>(
  url: string,
  body: Record<string, unknown> | null = null,
  options: Omit<ApiOptions, "auth"> = {}
): Promise<T> => {
  return api<T>(url, body, { ...options, auth: false });
};
