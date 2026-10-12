import type { QueryClient } from "@tanstack/react-query";
import { apiRequest, refreshAccessToken, setUnauthorizedHandler } from "@/shared/api/client";
import { endpoints } from "@/shared/config/endpoints";
import { socketClient } from "@/shared/socket/socket-client";
import { clearSession, sessionStore, setSessionUser } from "./session-store";
import { tokenStore } from "./token-store";
import type { AuthenticatedUser, LoginResponse } from "./types";

setUnauthorizedHandler(() => {
  tokenStore.clear();
  socketClient.disconnect();
  clearSession();
});

export function fetchMe(signal?: AbortSignal) {
  return apiRequest<AuthenticatedUser>(endpoints.auth.me, { signal });
}

export async function login(email: string, password: string) {
  const res = await apiRequest<LoginResponse>(endpoints.auth.login, {
    method: "POST",
    body: { email, password },
    anonymous: true,
    skipRefresh: true,
  });
  tokenStore.set(res.accessToken);
  setSessionUser(res.user);
  socketClient.connect();
  return res.user;
}

let bootstrapPromise: Promise<boolean> | null = null;

/**
 * Restaura a sessão após recarregar a página (refresh via cookie HttpOnly + /auth/me).
 * Resolve true/false; lança ApiError("network"|"server") se o backend estiver indisponível.
 */
export function ensureSession(): Promise<boolean> {
  const current = sessionStore.get();
  if (current.status === "authenticated") return Promise.resolve(true);
  if (current.status === "unauthenticated" && !tokenStore.get()) {
    // Já tentamos e falhou nesta carga; uma nova tentativa só ocorre via login.
  }
  if (!bootstrapPromise) {
    sessionStore.set({ status: "loading", user: null });
    bootstrapPromise = (async () => {
      try {
        const renewed = await refreshAccessToken();
        if (!renewed) {
          clearSession();
          return false;
        }
        const user = await fetchMe();
        setSessionUser(user);
        socketClient.connect();
        return true;
      } catch (error) {
        clearSession();
        throw error;
      } finally {
        bootstrapPromise = null;
      }
    })();
  }
  return bootstrapPromise;
}

export async function logout(queryClient: QueryClient) {
  await queryClient.cancelQueries();
  try {
    await apiRequest(endpoints.auth.logout, { method: "POST", skipRefresh: true });
  } catch {
    // O estado local é limpo mesmo se o backend falhar.
  }
  socketClient.disconnect();
  tokenStore.clear();
  clearSession();
  queryClient.clear();
}

export function requestPasswordReset(email: string) {
  return apiRequest<void>(endpoints.auth.forgotPassword, {
    method: "POST",
    body: { email },
    anonymous: true,
    skipRefresh: true,
  });
}

export function resetPassword(token: string, password: string) {
  return apiRequest<void>(endpoints.auth.resetPassword, {
    method: "POST",
    body: { token, password },
    anonymous: true,
    skipRefresh: true,
  });
}
