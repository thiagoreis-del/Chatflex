export type CompanyStatus =
  "trial" | "active" | "overdue" | "suspended" | "cancelled" | "onboarding";
export const companyStatuses: CompanyStatus[] = [
  "onboarding",
  "trial",
  "active",
  "overdue",
  "suspended",
  "cancelled",
];

export interface Company {
  id: string;
  legalName: string;
  tradeName: string;
  document: string;
  email: string;
  phone: string;
  responsibleName: string;
  status: CompanyStatus;
  planId: string;
  trialEndsAt: string | null;
  dueDate: string | null;
  userLimit: number;
  connectionLimit: number;
  storageLimitMb: number;
  createdAt: string;
  updatedAt: string;
  /** CONTRATO PENDENTE: campos de listagem sugeridos. */
  planName?: string;
  usersCount?: number;
  connectionsCount?: number;
  internalNotes?: string;
}

export interface CompanyUsage {
  users: { used: number; limit: number };
  connections: { used: number; limit: number };
  storage: { usedMb: number; limitMb: number };
  /** CONTRATO PENDENTE */
  updatedAt?: string;
}

export interface CompanyFilters {
  page: number;
  pageSize: number;
  search?: string | undefined;
  status?: CompanyStatus | undefined;
  planId?: string | undefined;
}

/** Dados editáveis da empresa enviados ao backend. */
export interface CompanyInput {
  legalName: string;
  tradeName: string;
  document: string;
  email: string;
  phone: string;
  responsibleName: string;
  planId: string;
  trialDays: number;
  userLimit: number;
  connectionLimit: number;
  storageLimitMb: number;
  status: CompanyStatus;
  internalNotes: string;
}

/**
 * Criação em operação única no backend. O primeiro administrador recebe apenas
 * nome, e-mail, telefone e senha inicial — perfil e permissões são definidos pelo backend.
 */
export interface CreateCompanyRequest extends CompanyInput {
  firstAdmin: { name: string; email: string; password: string; phone?: string | undefined };
}

export type CompanyAction =
  | "activate"
  | "suspend"
  | "reactivate"
  | "cancel"
  | "endTrial"
  | "changePlan"
  | "changeDueDate"
  | "extendLimits";
