import { authStorage } from "./auth-storage";
import type { ApiErrorBody } from "./api-types";

const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:4000";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  constructor(status: number, body: ApiErrorBody["error"]) {
    super(body.message);
    this.status = status;
    this.code = body.code;
    this.details = body.details;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  /** Skip auth header even if a token exists. */
  anonymous?: boolean;
};

const onUnauthorized: Array<() => void> = [];

export function subscribeUnauthorized(handler: () => void) {
  onUnauthorized.push(handler);
  return () => {
    const i = onUnauthorized.indexOf(handler);
    if (i >= 0) onUnauthorized.splice(i, 1);
  };
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = new URL(path.startsWith("http") ? path : `${API_URL}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, signal, anonymous } = opts;
  const headers: Record<string, string> = {
    Accept: "application/json",
    // Bypass the ngrok-free interstitial when the API is tunneled through ngrok.
    // Harmless on non-ngrok hosts.
    "ngrok-skip-browser-warning": "true",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (!anonymous) {
    const token = authStorage.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
    credentials: "omit",
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const err = (data as ApiErrorBody | null)?.error ?? {
      code: "UNKNOWN",
      message: res.statusText || "Request failed",
    };
    if (res.status === 401) {
      for (const h of onUnauthorized) h();
    }
    throw new ApiError(res.status, err);
  }

  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const api = {
  get: <T>(path: string, query?: RequestOptions["query"], signal?: AbortSignal) =>
    apiRequest<T>(path, { method: "GET", query, signal }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};

export { API_URL };
