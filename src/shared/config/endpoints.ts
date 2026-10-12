/**
 * Caminhos da API centralizados.
 *
 * CONTRATO PENDENTE: nenhum destes caminhos foi confirmado pelo backend.
 * Ao confirmar, atualize `confirmed` e o formato em `src/shared/auth/types.ts`.
 */
export const endpoints = {
  auth: {
    login: "/auth/login",
    refresh: "/auth/refresh_token",
    logout: "/auth/logout",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    me: "/auth/me",
  },
} as const;

export interface ContractStatus {
  method: "GET" | "POST";
  path: string;
  confirmed: boolean;
}

export const authContracts: ContractStatus[] = [
  { method: "POST", path: endpoints.auth.login, confirmed: false },
  { method: "POST", path: endpoints.auth.refresh, confirmed: false },
  { method: "POST", path: endpoints.auth.logout, confirmed: false },
  { method: "POST", path: endpoints.auth.forgotPassword, confirmed: false },
  { method: "POST", path: endpoints.auth.resetPassword, confirmed: false },
  { method: "GET", path: endpoints.auth.me, confirmed: false },
];
