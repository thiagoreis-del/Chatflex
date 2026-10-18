import type { QueryClient } from "@tanstack/react-query";
import { apiRequest, refreshAccessToken, setUnauthorizedHandler } from "@/shared/api/client";
import { endpoints } from "@/shared/config/endpoints";
import { socketClient } from "@/shared/socket/socket-client";
import { clearSession, sessionStore, setSessionUser } from "./session-store";
import { tokenStore } from "./token-store";
import type { AuthenticatedUser, LoginResponse } from "./types";
import { normalizeUser } from "./normalize-user";

const USER_KEY = "chatbotflex.user";

function saveUser(user: AuthenticatedUser) {
  try {
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Sem storage: segue só em memória.
  }
}

function loadUser(): AuthenticatedUser | null {
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthenticatedUser) : null;
  } catch {
    return null;
  }
}

function forgetUser() {
  try {
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // Ignora falhas de storage.
  }
}

setUnauthorizedHandler(() => {
  tokenStore.clear();
  forgetUser();
  socketClient.disconnect();
  clearSession();
});

export async function fetchMe(signal?: AbortSignal): Promise<AuthenticatedUser> {
  const raw = await apiRequest<unknown>(endpoints.auth.me, { signal });
  return normalizeUser(raw);
}

export async function login(email: string, password: string) {
  const res = await apiRequest<LoginResponse>(endpoints.auth.login, {
    method: "POST",
    body: { email, password },
    anonymous: true,
    skipRefresh: true,
  });
  const token = res.accessToken ?? res.token;
  if (!token) throw new Error("Token ausente na resposta de login");
  forgetPlatformSession();
  tokenStore.set(token);
  const user = normalizeUser(res.user);
  saveUser(user);
  setSessionUser(user);
  socketClient.connect();
  return user;
}

let bootstrapPromise: Promise<boolean> | null = null;

/**
 * Restaura a sessão após recarregar a página (refresh via cookie HttpOnly + /auth/me).
 * Resolve true/false; lança ApiError("network"|"server") se o backend estiver indisponível.
 */
export function ensureSession(): Promise<boolean> {
  const current = sessionStore.get();
  if (current.status === "authenticated") return Promise.resolve(true);
  if (!bootstrapPromise) {
    sessionStore.set({ status: "loading", user: null });
    bootstrapPromise = (async () => {
      try {
        // Se já existe token guardado (fallback de storage), tenta direto;
        // um 401 em fetchMe aciona o refresh via cookie automaticamente.
        if (!tokenStore.get()) {
          const renewed = await refreshAccessToken();
          if (!renewed) {
            clearSession();
            return false;
          }
        }
        // O /auth/me do backend depende do cookie de renovação, que o navegador
        // bloqueia entre domínios (responde 500). Usa o perfil salvo no login.
        const user = loadUser() ?? (await fetchMe());
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
  forgetPlatformSession();
  try {
    await apiRequest(endpoints.auth.logout, { method: "POST", skipRefresh: true });
  } catch {
    // O estado local é limpo mesmo se o backend falhar.
  }
  socketClient.disconnect();
  tokenStore.clear();
  forgetUser();
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

/**
 * Sessão original do superadmin na plataforma, guardada ao entrar em uma empresa.
 * Somente em memória: nunca persistir credenciais em storage do navegador.
 */
const PLATFORM_SESSION_KEY = "chatbotflex.platformSession";

interface PlatformSession {
  token: string;
  user: AuthenticatedUser;
}

let platformSession: PlatformSession | null = null;

function savePlatformSession() {
  if (loadPlatformSession()) return; // Já há um acesso delegado em andamento.
  const token = tokenStore.get();
  const user = sessionStore.get().user;
  if (!token || user?.role !== "superadmin" || user.impersonated) return;
  platformSession = { token, user };
}

function loadPlatformSession(): PlatformSession | null {
  return platformSession;
}

function forgetPlatformSession() {
  platformSession = null;
  try {
    window.sessionStorage.removeItem(PLATFORM_SESSION_KEY);
  } catch {
    // Ignora falhas de storage.
  }
}

// Remove credenciais legadas, mas nunca as lê nem as restaura de storage.
try { window.sessionStorage.removeItem(PLATFORM_SESSION_KEY); } catch { /* SSR / storage bloqueado */ }

/** Superadmin: troca o token pelo acesso delegado à empresa (auditado no servidor). */
export async function enterCompany(companyId: string) {
  savePlatformSession();
  const res = await apiRequest<LoginResponse>(endpoints.auth.enterCompany(companyId), {
    method: "POST",
  });
  await applyDelegatedSession(res);
}

/**
 * Encerra o acesso delegado e restaura o ambiente da plataforma.
 * Se o servidor não conseguir restaurar a sessão original, recupera a sessão
 * do superadmin guardada localmente — sem deslogar o usuário.
 */
export async function exitCompany() {
  try {
    const res = await apiRequest<LoginResponse>(endpoints.auth.exitCompany, { method: "POST", skipRefresh: true });
    const user = normalizeUser(res.user);
    if (user.role !== "superadmin" || user.impersonated) {
      throw new Error("Resposta não restaurou a sessão da plataforma");
    }
    await applyDelegatedSession(res);
    forgetPlatformSession();
  } catch (error) {
    if (!loadPlatformSession()) throw error;
    await restorePlatformSession();
  }
}

/** Restaura a sessão original da plataforma guardada ao entrar na empresa. */
export async function restorePlatformSession() {
  const saved = loadPlatformSession();
  if (!saved) throw new Error("Sessão da plataforma não disponível");
  forgetPlatformSession();
  socketClient.disconnect();
  tokenStore.set(saved.token);
  saveUser(saved.user);
  setSessionUser(saved.user);
  socketClient.connect();
}

async function applyDelegatedSession(res: LoginResponse) {
  const token = res.accessToken ?? res.token;
  if (!token) throw new Error("Token ausente na resposta");
  socketClient.disconnect();
  tokenStore.set(token);
  const user = normalizeUser(res.user);
  saveUser(user);
  setSessionUser(user);
  socketClient.connect();
}
