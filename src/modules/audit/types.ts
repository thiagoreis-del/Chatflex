export type AuditResult = "success" | "failure" | "denied";
export const auditResults: AuditResult[] = ["success", "failure", "denied"];

/**
 * CONTRATO PENDENTE. Somente metadados: nunca senhas, tokens, cookies,
 * credenciais ou corpos completos de requisição.
 */
export interface AuditEvent {
  id: string;
  occurredAt: string;
  actorId: string;
  actorName: string;
  companyId: string | null;
  companyName: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  result: AuditResult;
  reason: string | null;
  origin: string;
}

export interface AuditFilters {
  page: number;
  pageSize: number;
  from?: string | undefined;
  to?: string | undefined;
  companyId?: string | undefined;
  userId?: string | undefined;
  action?: string | undefined;
  result?: AuditResult | undefined;
  resource?: string | undefined;
  resourceId?: string | undefined;
}
