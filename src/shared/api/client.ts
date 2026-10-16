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
  signal?: AbortSignal | undefined;
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

  const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData;
  const headers: Record<string, string> = { Accept: "application/json" };
  // FormData: o navegador define multipart/form-data com boundary.
  if (opts.body !== undefined && !isForm) headers["Content-Type"] = "application/json";
  const token = tokenStore.get();
  if (token && !opts.anonymous) headers["Authorization"] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${env.apiUrl}${path}`, {
      method: opts.method ?? "GET",
      headers,
      body:
        opts.body === undefined
          ? null
          : isForm
            ? (opts.body as FormData)
            : JSON.stringify(opts.body),
      credentials: "include",
      signal: opts.signal ?? null,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("aborted", 0);
    }
    apiStatusStore.set("offline");
    throw new ApiError("network", 0);
  }

  // Qualquer resposta HTTP prova que a API está no ar; "offline" só em falha de rede.
  // (Ex.: /auth/me responde 500 por cookie bloqueado e não deve marcar a API como fora.)
  apiStatusStore.set("online");

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
    const genAtStart = tokenStore.generation();
    refreshPromise = (async () => {
      try {
        const res = await rawRequest<RefreshResponse>(endpoints.auth.refresh, {
          method: "POST",
          anonymous: true,
        });
        const token = res?.accessToken ?? res?.token;
        if (!token) {
          if (tokenStore.generation() === genAtStart) tokenStore.clear();
          return false;
        }
        tokenStore.set(token);
        return true;
      } catch (error) {
        // Não apaga um token mais novo instalado por outra troca de sessão.
        if (tokenStore.generation() === genAtStart) tokenStore.clear();
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

/** O backend responde 403 (não 401) quando o access token expira. */
function isExpiredToken(error: ApiError): boolean {
  if (error.kind === "unauthorized") return true;
  if (error.kind !== "forbidden") return false;
  const body = error.body as { message?: string; error?: string } | undefined;
  const message = `${body?.message ?? ""} ${body?.error ?? ""}`;
  return /token|session|jwt/i.test(message);
}

export async function apiRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const gen = tokenStore.generation();
  try {
    return await rawRequest<T>(path, opts);
  } catch (error) {
    if (error instanceof ApiError && isExpiredToken(error) && !opts.skipRefresh) {
      if (tokenStore.generation() !== gen) {
        // Token já trocado (entrada/saída de empresa): refaz com o token atual
        // em vez de deslogar por uma falha do token antigo.
        return rawRequest<T>(path, opts);
      }
      const renewed = await refreshAccessToken().catch(() => false);
      if (renewed) return rawRequest<T>(path, opts);
      unauthorizedHandler?.();
    }
    throw error;
  }
}

export interface UploadOptions {
  method?: "POST" | "PUT";
  signal?: AbortSignal;
  /** Fração enviada, de 0 a 1. */
  onProgress?: (fraction: number) => void;
}

function rawUpload<T>(path: string, form: FormData, opts: UploadOptions): Promise<T> {
  if (env.useMocks) {
    return (async () => {
      for (let i = 1; i <= 5; i++) {
        if (opts.signal?.aborted) throw new ApiError("aborted", 0);
        await new Promise((r) => setTimeout(r, 120));
        opts.onProgress?.(i / 5);
      }
      const { mockRequest } = await import("@/mocks");
      return mockRequest<T>(path, { method: opts.method ?? "POST", body: form });
    })();
  }
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(opts.method ?? "POST", `${env.apiUrl}${path}`);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Accept", "application/json");
    const token = tokenStore.get();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) opts.onProgress?.(e.loaded / e.total);
    };
    const onAbort = () => xhr.abort();
    opts.signal?.addEventListener("abort", onAbort, { once: true });
    xhr.onabort = () => reject(new ApiError("aborted", 0));
    xhr.onerror = () => {
      apiStatusStore.set("offline");
      reject(new ApiError("network", 0));
    };
    xhr.onload = () => {
      opts.signal?.removeEventListener("abort", onAbort);
      apiStatusStore.set("online");
      let data: unknown;
      try {
        data = xhr.responseText ? JSON.parse(xhr.responseText) : undefined;
      } catch {
        data = undefined;
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data as T);
      else reject(new ApiError(kindFromStatus(xhr.status), xhr.status, data as ApiErrorBody));
    };
    xhr.send(form);
  });
}

/** Envio multipart com progresso e cancelamento; renova o token uma vez se expirado. */
export async function apiUpload<T>(path: string, form: FormData, opts: UploadOptions = {}) {
  const gen = tokenStore.generation();
  try {
    return await rawUpload<T>(path, form, opts);
  } catch (error) {
    if (error instanceof ApiError && isExpiredToken(error)) {
      if (tokenStore.generation() !== gen) return rawUpload<T>(path, form, opts);
      const renewed = await refreshAccessToken().catch(() => false);
      if (renewed) return rawUpload<T>(path, form, opts);
      unauthorizedHandler?.();
    }
    throw error;
  }
}

/** Baixa um arquivo autenticado (Blob). Renova o token uma vez se expirado. */
export async function apiDownload(path: string): Promise<{ blob: Blob; filename: string | null }> {
  if (env.useMocks) {
    return { blob: new Blob(["-- backup de demonstração\n"], { type: "application/sql" }), filename: "backup-demo.sql" };
  }
  const run = async () => {
    const headers: Record<string, string> = {};
    const token = tokenStore.get();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    let res: Response;
    try {
      res = await fetch(`${env.apiUrl}${path}`, { headers, credentials: "include" });
    } catch {
      apiStatusStore.set("offline");
      throw new ApiError("network", 0);
    }
    apiStatusStore.set("online");
    if (!res.ok) {
      let data: unknown;
      try { data = await res.json(); } catch { data = undefined; }
      throw new ApiError(kindFromStatus(res.status), res.status, data as ApiErrorBody);
    }
    const cd = res.headers.get("Content-Disposition") ?? "";
    const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
    return { blob: await res.blob(), filename: m?.[1] ? decodeURIComponent(m[1]) : null };
  };
  const gen = tokenStore.generation();
  try {
    return await run();
  } catch (error) {
    if (error instanceof ApiError && isExpiredToken(error)) {
      if (tokenStore.generation() !== gen) return run();
      const renewed = await refreshAccessToken().catch(() => false);
      if (renewed) return run();
      unauthorizedHandler?.();
    }
    throw error;
  }
}
