import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { companyKeys } from "@/shared/api/query-keys";
import { platformEndpoints as ep, withQuery } from "@/shared/config/endpoints";
import type { Paginated } from "@/shared/types/pagination";
import type { Company, CompanyFilters, CompanyInput, CompanyUsage, CreateCompanyRequest } from "./types";

export const companyContracts = {
  list: "GET /platform/companies",
  detail: "GET /platform/companies/:companyId",
  usage: "GET /platform/companies/:companyId/usage",
};

export const companiesQuery = (filters: CompanyFilters) =>
  queryOptions({
    queryKey: companyKeys.list(filters),
    queryFn: ({ signal }) => apiRequest<Paginated<Company>>(withQuery(ep.companies, filters), { signal }),
  });

export const companyQuery = (companyId: string) =>
  queryOptions({
    queryKey: companyKeys.detail(companyId),
    queryFn: ({ signal }) => apiRequest<Company>(ep.company(companyId), { signal }),
  });

export const companyUsageQuery = (companyId: string) =>
  queryOptions({
    queryKey: companyKeys.usage(companyId),
    queryFn: ({ signal }) => apiRequest<CompanyUsage>(ep.companyUsage(companyId), { signal }),
  });

export function createCompany(body: CreateCompanyRequest) {
  return apiRequest<Company>(ep.companies, { method: "POST", body });
}

export function updateCompany(companyId: string, body: Partial<CompanyInput> & { reason?: string; dueDate?: string }) {
  return apiRequest<Company>(ep.company(companyId), { method: "PATCH", body });
}

type StatusAction = "activate" | "suspend" | "reactivate" | "cancel" | "endTrial";
const statusPath: Record<StatusAction, (id: string) => string> = {
  activate: ep.companyActivate,
  suspend: ep.companySuspend,
  reactivate: ep.companyReactivate,
  cancel: ep.companyCancel,
  endTrial: ep.companyEndTrial,
};

export function runCompanyStatusAction(companyId: string, action: StatusAction, reason: string) {
  return apiRequest<Company>(statusPath[action](companyId), { method: "POST", body: { reason } });
}

export function updateCompanyLimits(
  companyId: string,
  body: { userLimit: number; connectionLimit: number; storageLimitMb: number; reason: string },
) {
  return apiRequest<Company>(ep.companyLimits(companyId), { method: "PATCH", body });
}
