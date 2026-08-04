const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  meta: { page: number; per_page: number; total: number; total_pages: number } | null;
  error: { code: string; message: string; details?: Record<string, unknown> } | null;
}

export class ApiError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function doFetch<T>(path: string, init: RequestInit): Promise<{ status: number; envelope: ApiEnvelope<T> }> {
  const headers = new Headers(init.headers);
  // FormData bodies (file uploads) need the browser to set their own
  // multipart boundary — an explicit Content-Type here would break that.
  if (!(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, credentials: "include" });
  } catch {
    return {
      status: 0,
      envelope: {
        success: false,
        data: null,
        meta: null,
        error: {
          code: "NETWORK_ERROR",
          message: `Unable to connect to server at ${API_BASE_URL}. Ensure backend is running.`,
        },
      },
    };
  }

  let envelope: ApiEnvelope<T>;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    envelope = {
      success: false,
      data: null,
      meta: null,
      error: { code: "NETWORK_ERROR", message: "Couldn't reach the server." },
    };
  }

  return { status: response.status, envelope };
}

async function doRefreshRequest(): Promise<boolean> {
  const { status, envelope } = await doFetch<{ access_token: string }>("/api/v1/auth/refresh", {
    method: "POST",
  });
  if (status === 200 && envelope.data?.access_token) {
    setAccessToken(envelope.data.access_token);
    return true;
  }
  return false;
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * A single shared in-flight refresh so simultaneous 401s within this tab don't
 * fire N refresh calls. That alone isn't enough across *tabs*, though — the
 * refresh token rotates on every use, and two tabs racing to refresh at once
 * (each still holding the pre-rotation cookie value when they dispatch) trips
 * the backend's reuse detection and revokes every session for the user
 * (`auth_service.py`'s `refresh()`). The Web Locks API serializes the actual
 * network call across all tabs of this origin, so a losing tab only sends its
 * request after the winning tab's response has already rotated the cookie —
 * it then gets a legitimate fresh rotation instead of a stale, already-used
 * token. Falls back to the in-tab-only guard on browsers without Web Locks.
 */
export async function tryRefresh(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      if (typeof navigator !== "undefined" && "locks" in navigator) {
        return await navigator.locks.request("truzon-cms-auth-refresh", () => doRefreshRequest());
      }
      return await doRefreshRequest();
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

/**
 * Fetch wrapper for the admin API (`/api/v1/*`). Unwraps the response envelope
 * from API.md, retries once after a silent token refresh on a 401, and throws
 * ApiError so TanStack Query's error path handles failures uniformly.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  opts: { skipRefreshRetry?: boolean } = {}
): Promise<T> {
  let { status, envelope } = await doFetch<T>(path, init);

  if (!opts.skipRefreshRetry && status === 401 && path !== "/api/v1/auth/refresh") {
    const refreshed = await tryRefresh();
    if (refreshed) {
      ({ status, envelope } = await doFetch<T>(path, init));
    }
  }

  if (!envelope.success || envelope.error) {
    throw new ApiError(
      envelope.error?.code ?? "UNKNOWN_ERROR",
      envelope.error?.message ?? "Something went wrong.",
      envelope.error?.details
    );
  }

  return envelope.data as T;
}

/** For endpoints that return a raw file (CSV export) instead of the JSON
 * envelope — no envelope-unwrapping, just an authenticated blob fetch. */
export async function apiFetchBlob(path: string): Promise<Blob> {
  const headers = new Headers();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { headers, credentials: "include" });
  if (!response.ok) throw new ApiError("EXPORT_FAILED", "Couldn't export the file.");
  return response.blob();
}

export async function apiFetchPage<T>(
  path: string,
  init: RequestInit = {}
): Promise<{ data: T; meta: ApiEnvelope<T>["meta"] }> {
  let { status, envelope } = await doFetch<T>(path, init);

  if (status === 401 && path !== "/api/v1/auth/refresh") {
    const refreshed = await tryRefresh();
    if (refreshed) {
      ({ status, envelope } = await doFetch<T>(path, init));
    }
  }

  if (!envelope.success || envelope.error) {
    throw new ApiError(
      envelope.error?.code ?? "UNKNOWN_ERROR",
      envelope.error?.message ?? "Something went wrong.",
      envelope.error?.details
    );
  }

  return { data: envelope.data as T, meta: envelope.meta };
}
