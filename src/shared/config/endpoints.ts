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
  method: "GET" | "POST" | "PATCH";
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

/**
 * Fase 2 — administração da plataforma.
 * CONTRATO PENDENTE: caminhos sugeridos; comparar com o backend real antes de integrar.
 */
const company = (id: string) => `/platform/companies/${encodeURIComponent(id)}`;
const plan = (id: string) => `/platform/plans/${encodeURIComponent(id)}`;

export const platformEndpoints = {
  dashboard: "/platform/dashboard",
  companies: "/platform/companies",
  company,
  companyActivate: (id: string) => `${company(id)}/activate`,
  companySuspend: (id: string) => `${company(id)}/suspend`,
  companyReactivate: (id: string) => `${company(id)}/reactivate`,
  companyCancel: (id: string) => `${company(id)}/cancel`,
  /** Sugestão adicional: não consta na lista original de contratos. */
  companyEndTrial: (id: string) => `${company(id)}/end-trial`,
  companyLimits: (id: string) => `${company(id)}/limits`,
  companyUsage: (id: string) => `${company(id)}/usage`,
  plans: "/platform/plans",
  plan,
  subscriptions: "/platform/subscriptions",
  invoices: "/platform/invoices",
  auditEvents: "/platform/audit-events",
} as const;

export const platformContracts: ContractStatus[] = [
  { method: "GET", path: "/platform/dashboard", confirmed: false },
  { method: "GET", path: "/platform/companies", confirmed: false },
  { method: "POST", path: "/platform/companies", confirmed: false },
  { method: "GET", path: "/platform/companies/:companyId", confirmed: false },
  { method: "PATCH", path: "/platform/companies/:companyId", confirmed: false },
  { method: "POST", path: "/platform/companies/:companyId/activate", confirmed: false },
  { method: "POST", path: "/platform/companies/:companyId/suspend", confirmed: false },
  { method: "POST", path: "/platform/companies/:companyId/reactivate", confirmed: false },
  { method: "POST", path: "/platform/companies/:companyId/cancel", confirmed: false },
  { method: "POST", path: "/platform/companies/:companyId/end-trial", confirmed: false },
  { method: "PATCH", path: "/platform/companies/:companyId/limits", confirmed: false },
  { method: "GET", path: "/platform/companies/:companyId/usage", confirmed: false },
  { method: "GET", path: "/platform/plans", confirmed: false },
  { method: "POST", path: "/platform/plans", confirmed: false },
  { method: "GET", path: "/platform/plans/:planId", confirmed: false },
  { method: "PATCH", path: "/platform/plans/:planId", confirmed: false },
  { method: "GET", path: "/platform/subscriptions", confirmed: false },
  { method: "GET", path: "/platform/invoices", confirmed: false },
  { method: "GET", path: "/platform/audit-events", confirmed: false },
];

/** Monta query string ignorando valores vazios. */
export function withQuery(path: string, params: object): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  }
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}
