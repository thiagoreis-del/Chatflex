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
