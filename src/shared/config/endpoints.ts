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

/**
 * Conexões WhatsApp (empresa).
 * CONTRATO PENDENTE: caminhos observados no backend ZapPro/Whaticket; confirmar no backend do ChatFlex.
 */
export const whatsappEndpoints = {
  list: "/whatsapp",
  detail: (id: number) => `/whatsapp/${id}`,
  session: (id: number) => `/whatsappsession/${id}`,
} as const;

/**
 * Contatos da empresa.
 * CONTRATO PENDENTE: caminhos observados no backend ZapPro/Whaticket; confirmar no backend do ChatFlex.
 */
export const contactEndpoints = {
  list: "/contacts",
  detail: (id: number) => `/contacts/${id}`,
} as const;

export const contactContracts = [
  { method: "GET", path: "/contacts", confirmed: false },
  { method: "POST", path: "/contacts", confirmed: false },
  { method: "GET", path: "/contacts/:id", confirmed: false },
  { method: "PUT", path: "/contacts/:id", confirmed: false },
  { method: "DELETE", path: "/contacts/:id", confirmed: false },
] as const;

export const whatsappContracts = [
  { method: "GET", path: "/whatsapp", confirmed: false },
  { method: "POST", path: "/whatsapp", confirmed: false },
  { method: "GET", path: "/whatsapp/:id", confirmed: false },
  { method: "PUT", path: "/whatsapp/:id", confirmed: false },
  { method: "DELETE", path: "/whatsapp/:id", confirmed: false },
  { method: "POST", path: "/whatsappsession/:id", confirmed: false },
  { method: "PUT", path: "/whatsappsession/:id", confirmed: false },
  { method: "DELETE", path: "/whatsappsession/:id", confirmed: false },
] as const;

/**
 * Usuários (atendentes) e filas da empresa.
 * CONTRATO PENDENTE: caminhos observados no backend ZapPro/Whaticket; confirmar no backend do ChatFlex.
 */
export const userEndpoints = {
  list: "/users",
  detail: (id: number) => `/users/${id}`,
} as const;

export const queueEndpoints = {
  list: "/queue",
  detail: (id: number) => `/queue/${id}`,
} as const;

export const teamContracts = [
  { method: "GET", path: "/users", confirmed: false },
  { method: "POST", path: "/users", confirmed: false },
  { method: "PUT", path: "/users/:id", confirmed: false },
  { method: "DELETE", path: "/users/:id", confirmed: false },
  { method: "GET", path: "/queue", confirmed: false },
  { method: "POST", path: "/queue", confirmed: false },
  { method: "PUT", path: "/queue/:id", confirmed: false },
  { method: "DELETE", path: "/queue/:id", confirmed: false },
] as const;

/**
 * Atendimento (tickets e mensagens).
 * CONFIRMADO no código do backend ZapPro 15.0.2 (rotas/controllers); validar em execução na VPS.
 */
export const ticketEndpoints = {
  list: "/tickets",
  detail: (id: number) => `/tickets/${id}`,
  messages: (id: number) => `/messages/${id}`,
  tagOptions: "/tags/list",
  ticketTag: (id: number, tagId: number) => `/ticket-tags/${id}/${tagId}`,
  ticketTags: (id: number) => `/ticket-tags/${id}`,
} as const;

export const ticketContracts = [
  { method: "GET", path: "/tickets", confirmed: true },
  /** Também usado na transferência: { queueId, userId, status, msgTransfer, isTransfered }. */
  { method: "PUT", path: "/tickets/:id", confirmed: true },
  { method: "GET", path: "/tags/list", confirmed: true },
  { method: "PUT", path: "/ticket-tags/:ticketId/:tagId", confirmed: true },
  /** Remove TODAS as etiquetas do ticket. */
  { method: "DELETE", path: "/ticket-tags/:ticketId", confirmed: true },
  { method: "GET", path: "/messages/:ticketId", confirmed: true },
  /** Nota interna: { body, isPrivate: "true" } (string). */
  { method: "POST", path: "/messages/:ticketId", confirmed: true },
  /** Mesmo caminho, multipart/form-data: `medias` (arquivos) + `body` (legenda). */
  { method: "POST", path: "/messages/:ticketId (multipart)", confirmed: true },
] as const;

/**
 * Respostas rápidas.
 * CONTRATO PENDENTE: caminhos observados no backend ZapPro/Whaticket; confirmar no backend do ChatFlex.
 */
export const quickMessageEndpoints = {
  base: "/quick-messages",
  list: "/quick-messages/list",
  detail: (id: number) => `/quick-messages/${id}`,
} as const;

export const quickMessageContracts = [
  { method: "GET", path: "/quick-messages/list", confirmed: false },
  { method: "POST", path: "/quick-messages", confirmed: false },
  { method: "PUT", path: "/quick-messages/:id", confirmed: false },
  { method: "DELETE", path: "/quick-messages/:id", confirmed: false },
] as const;
