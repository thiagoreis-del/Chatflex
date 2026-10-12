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
}

/** CONTRATO PENDENTE: formato esperado de POST /auth/login. */
export interface LoginResponse {
  accessToken: string;
  user: AuthenticatedUser;
}

/** CONTRATO PENDENTE: formato esperado de POST /auth/refresh_token. */
export interface RefreshResponse {
  accessToken: string;
}

export type SessionStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

export interface SessionState {
  status: SessionStatus;
  user: AuthenticatedUser | null;
}
