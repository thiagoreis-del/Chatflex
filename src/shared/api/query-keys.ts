/**
 * Chaves do TanStack Query centralizadas.
 * Dados de empresa SEMPRE incluem companyId na chave.
 */
export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    me: () => ["auth", "me"] as const,
  },
} as const;

export const platformKeys = {
  all: ["platform"] as const,
  dashboard: () => ["platform", "dashboard"] as const,
};

export const companyKeys = {
  all: ["platform", "companies"] as const,
  lists: () => ["platform", "companies", "list"] as const,
  list: (filters: object) => ["platform", "companies", "list", filters] as const,
  detail: (companyId: string) => ["platform", "companies", "detail", companyId] as const,
  usage: (companyId: string) => ["platform", "companies", "detail", companyId, "usage"] as const,
};

export const planKeys = {
  all: ["platform", "plans"] as const,
  lists: () => ["platform", "plans", "list"] as const,
  list: (filters: object = {}) => ["platform", "plans", "list", filters] as const,
  detail: (planId: string) => ["platform", "plans", "detail", planId] as const,
};

export const subscriptionKeys = {
  all: ["platform", "subscriptions"] as const,
  list: (filters: object) => ["platform", "subscriptions", "list", filters] as const,
};

export const invoiceKeys = {
  all: ["platform", "invoices"] as const,
  list: (filters: object) => ["platform", "invoices", "list", filters] as const,
};

export const auditKeys = {
  all: ["platform", "audit"] as const,
  list: (filters: object) => ["platform", "audit", "list", filters] as const,
};

/** Contatos pertencem à empresa da sessão; o backend filtra pelo token. */
export const contactKeys = {
  all: ["company", "contacts"] as const,
  list: (filters: object) => ["company", "contacts", "list", filters] as const,
};

/** Conexões pertencem à empresa da sessão; o backend filtra pelo token. */
export const whatsappKeys = {
  all: ["company", "whatsapp"] as const,
  list: () => ["company", "whatsapp", "list"] as const,
  detail: (id: number) => ["company", "whatsapp", "detail", id] as const,
};

/** Usuários e filas pertencem à empresa da sessão; o backend filtra pelo token. */
export const userKeys = {
  all: ["company", "users"] as const,
  list: (filters: object) => ["company", "users", "list", filters] as const,
};

export const queueKeys = {
  all: ["company", "queues"] as const,
  list: () => ["company", "queues", "list"] as const,
};

/** Atendimentos pertencem à empresa da sessão; o backend filtra pelo token. */
export const ticketKeys = {
  all: ["company", "tickets"] as const,
  operationalDashboard: () => ["company", "tickets", "operational-dashboard"] as const,
  list: (filters: object) => ["company", "tickets", "list", filters] as const,
  messages: (id: number) => ["company", "tickets", "messages", id] as const,
  tagOptions: ["company", "tickets", "tag-options"] as const,
};

/** Respostas rápidas pertencem à empresa da sessão; o backend filtra pelo token. */
export const quickMessageKeys = {
  all: ["company", "quick-messages"] as const,
  list: (companyId?: string) => ["company", "quick-messages", "list", companyId ?? ""] as const,
};

/** Chat interno pertence à empresa da sessão; o backend filtra pelo token. */
export const internalChatKeys = {
  all: ["company", "internal-chat"] as const,
  conversations: (companyId?: string) =>
    ["company", "internal-chat", "conversations", companyId ?? ""] as const,
  messages: (conversationId: number) =>
    ["company", "internal-chat", "messages", conversationId] as const,
};
