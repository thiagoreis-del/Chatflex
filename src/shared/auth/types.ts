/**
 * Dados de sessão servem apenas para APRESENTAÇÃO.
 * A autorização real é sempre do backend.
 */
export type UserRole = "superadmin" | "company_admin" | "agent";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  permissions: string[];
  /** Vencimento/teste da empresa (ZapPro: user.company.dueDate). */
  companyDueDate?: string | null;
  companyActive?: boolean;
  /** Filas do usuário; o backend só lista tickets das filas enviadas em `queueIds`. */
  queueIds?: number[];
}

/** POST /auth/login — backend ZapPro retorna `token`; `accessToken` aceito por compatibilidade. */
export interface LoginResponse {
  accessToken?: string;
  token?: string;
  user: unknown;
}

/** POST /auth/refresh_token — idem. */
export interface RefreshResponse {
  accessToken?: string;
  token?: string;
}

export type SessionStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

export interface SessionState {
  status: SessionStatus;
  user: AuthenticatedUser | null;
}
