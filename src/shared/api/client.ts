/**
 * Cliente HTTP central. Toda chamada à API passa por aqui.
 * - base URL de VITE_API_URL
 * - credentials: "include" (cookie HttpOnly de refresh)
 * - access token em memória
 * - 401 → uma única renovação compartilhada entre chamadas simultâneas
 */
import { env } from "@/shared/config/env";
import { endpoints } from "@/shared/config/endpoints";
import { tokenStore } from "@/shared/auth/token-store";
import type { RefreshResponse } from "@/shared/auth/types";
import { apiStatusStore } from "./api-status";
import { ApiError, kindFromStatus, type ApiErrorBody } from "./errors";

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  /** Não anexar access token. */
  anonymous?: boolean;
  /** Não tentar refresh em 401 (ex.: login, refresh). */
  skipRefresh?: boolean;
}

let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

async function rawRequest<T>(path: string, opts: RequestOptions): Promise<T> {
  if (env.useMocks) {
    const { mockRequest } = await import("@/mocks");
    return mockRequest<T>(path, opts);
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const token = tokenStore.get();
  if (token && !opts.anonymous) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      credentials: "include",
      signal: opts.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("aborted", 0);
    }
    apiStatusStore.set("offline");
    throw new ApiError("network", 0);
  }

  apiStatusStore.set(response.status >= 500 ? "offline" : "online");

  const text = await response.text();
  let data: unknown = undefined;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = undefined;
    }
  }

  if (!response.ok) {
    throw new ApiError(kindFromStatus(response.status), response.status, data as ApiErrorBody);
  }
  return data as T;
}

let refreshPromise: Promise<boolean> | null = null;

/**
 * Renova o access token via cookie HttpOnly.
 * Retorna false se a sessão não puder ser renovada; lança ApiError("network") se o backend estiver fora.
 */
export function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await rawRequest<RefreshResponse>(endpoints.auth.refresh, {
          method: "POST",
          anonymous: true,
        });
        if (!res?.accessToken) {
          tokenStore.clear();
          return false;
        }
        tokenStore.set(res.accessToken);
        return true;
      } catch (error) {
        tokenStore.clear();
        if (error instanceof ApiError && (error.kind === "network" || error.kind === "server")) {
          throw error;
        }
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  try {
    return await rawRequest<T>(path, opts);
  } catch (error) {
    if (error instanceof ApiError && error.kind === "unauthorized" && !opts.skipRefresh) {
      const renewed = await refreshAccessToken().catch(() => false);
      if (renewed) return rawRequest<T>(path, opts);
      unauthorizedHandler?.();
    }
    throw error;
  }
}
