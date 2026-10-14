import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { companyKeys } from "@/shared/api/query-keys";
import { env } from "@/shared/config/env";
import { platformEndpoints as ep, withQuery } from "@/shared/config/endpoints";
import type { Paginated } from "@/shared/types/pagination";
import type { WhatsAppConnection } from "@/modules/whatsapp/types";
import type {
  Company,
  CompanyFilters,
  CompanyInput,
  CompanyUsage,
  CreateCompanyRequest,
} from "./types";

/**
 * CONFIRMADO no código ZapPro/Whaticket: GET/POST /companies, GET/PUT /companies/:id.
 * Com mocks ativos, mantém os caminhos de demonstração /platform/companies.
 * Uso, limites por empresa e encerramento de teste NÃO existem no backend atual.
 */
export const companyContracts = {
  list: "GET /companies",
  detail: "GET /companies/:id",
  usage: "indisponível no backend atual",
};

interface BackendCompany {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  document?: string | null;
  status?: boolean | null;
  planId?: number | null;
  dueDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
  plan?: { id: number; name: string; users?: number; connections?: number } | null;
}

function fromBackendCompany(c: BackendCompany): Company {
  const overdue = !!c.dueDate && new Date(c.dueDate).getTime() < Date.now();
  return {
    id: String(c.id),
    legalName: c.name,
    tradeName: c.name,
    document: c.document ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    responsibleName: "",
    status: c.status === false ? "suspended" : overdue ? "overdue" : "active",
    planId: c.planId != null ? String(c.planId) : "",
    trialEndsAt: null,
    dueDate: c.dueDate ?? null,
    userLimit: c.plan?.users ?? 0,
    connectionLimit: c.plan?.connections ?? 0,
    storageLimitMb: 0,
    createdAt: c.createdAt ?? "",
    updatedAt: c.updatedAt ?? "",
    ...(c.plan?.name && { planName: c.plan.name }),
  };
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + Math.max(days, 0));
  return d.toISOString().slice(0, 10);
}

const realPath = (id: string) => `/companies/${encodeURIComponent(id)}`;

export const companiesQuery = (filters: CompanyFilters) =>
  queryOptions({
    queryKey: companyKeys.list(filters),
    queryFn: async ({ signal }): Promise<Paginated<Company>> => {
      if (env.useMocks)
        return apiRequest<Paginated<Company>>(withQuery(ep.companies, filters), { signal });
      const res = await apiRequest<{ companies: BackendCompany[]; count: number }>(
        withQuery("/companies", { searchParam: filters.search, pageNumber: filters.page }),
        { signal },
      );
      let data = res.companies.map(fromBackendCompany);
      // Oculta a empresa dona da plataforma (Notasflex): a lista mostra apenas clientes.
      data = data.filter(
        (c) =>
          !c.legalName.toLowerCase().includes("notasflex") &&
          !c.tradeName.toLowerCase().includes("notasflex"),
      );
      if (filters.status) data = data.filter((c) => c.status === filters.status);
      if (filters.planId) data = data.filter((c) => c.planId === filters.planId);
      return { data, page: filters.page, pageSize: 20, total: res.count };
    },
  });

export const companyQuery = (companyId: string) =>
  queryOptions({
    queryKey: companyKeys.detail(companyId),
    queryFn: async ({ signal }) => {
      if (env.useMocks) return apiRequest<Company>(ep.company(companyId), { signal });
      return fromBackendCompany(await apiRequest<BackendCompany>(realPath(companyId), { signal }));
    },
  });

export const companyUsageQuery = (companyId: string) =>
  queryOptions({
    queryKey: companyKeys.usage(companyId),
    queryFn: ({ signal }) => {
      if (env.useMocks) return apiRequest<CompanyUsage>(ep.companyUsage(companyId), { signal });
      // Backend atual não expõe consumo: usa os limites do plano da empresa.
      return apiRequest<BackendCompany>(realPath(companyId), { signal }).then(async (c) => {
        let users = c.plan?.users ?? 0;
        let connections = c.plan?.connections ?? 0;
        if ((!users || !connections) && c.planId) {
          const p = await apiRequest<{ users?: number; connections?: number }>(
            `/plans/${c.planId}`,
            { signal },
          ).catch(() => null);
          users ||= p?.users ?? 0;
          connections ||= p?.connections ?? 0;
        }
        return {
          users: { used: -1, limit: users },
          connections: { used: -1, limit: connections },
          storage: { usedMb: -1, limitMb: 0 },
        } as CompanyUsage;
      });
    },
    retry: false,
  });

interface BackendWhatsapp extends Partial<WhatsAppConnection> {
  id: number;
  name: string;
  companyId?: number;
  channel?: string;
}

/**
 * CONFIRMADO no backend ZapPro/Whaticket: GET /whatsapp/all lista as conexões
 * de TODAS as empresas (sem filtro no servidor). Uso exclusivo do superadmin:
 * filtramos pela empresa no cliente.
 */
export const companyConnectionsQuery = (companyId: string) =>
  queryOptions({
    queryKey: [...companyKeys.usage(companyId), "connections"],
    queryFn: async ({ signal }): Promise<WhatsAppConnection[]> => {
      if (env.useMocks) return [];
      const all = await apiRequest<BackendWhatsapp[]>("/whatsapp/all?session=0", { signal });
      return all
        .filter((w) => String(w.companyId) === companyId)
        .map((w) => ({
          id: w.id,
          name: w.name,
          status: w.status ?? "DISCONNECTED",
          isDefault: !!w.isDefault,
          number: w.number ?? null,
          ...(w.updatedAt && { updatedAt: w.updatedAt }),
        }));
    },
    retry: false,
  });

interface BackendSimpleUser {
  id: number;
  name: string;
  email: string;
  queues?: { id: number; name: string }[];
}

export interface CompanyMember {
  id: string;
  name: string;
  email: string;
  queues: string[];
}

/**
 * CONFIRMADO no backend ZapPro/Whaticket: GET /users/list?companyId=X
 * retorna os usuários da empresa informada (SimpleListService). Uso exclusivo
 * do superadmin para inspecionar empresas clientes.
 */
export const companyUsersQuery = (companyId: string) =>
  queryOptions({
    queryKey: [...companyKeys.usage(companyId), "users"],
    queryFn: async ({ signal }): Promise<CompanyMember[]> => {
      if (env.useMocks) return [];
      const res = await apiRequest<
        (BackendSimpleUser & { companyId?: number })[] | { users?: (BackendSimpleUser & { companyId?: number })[] }
      >(`/users/list?companyId=${encodeURIComponent(companyId)}`, { signal });
      const all = Array.isArray(res) ? res : (res?.users ?? []);
      return all
        // Defesa extra: se o backend devolver companyId, descarta registros de outra empresa.
        .filter((u) => u.companyId == null || String(u.companyId) === companyId)
        .map((u) => ({
          id: String(u.id),
          name: u.name,
          email: u.email,
          queues: (u.queues ?? []).map((q) => q.name),
        }));
    },
    retry: false,
  });

export async function createCompany(body: CreateCompanyRequest) {
  if (env.useMocks) return apiRequest<Company>(ep.companies, { method: "POST", body });
  // O backend cria o primeiro administrador com o e-mail da empresa e senha padrão "mudar123".
  const raw = await apiRequest<BackendCompany>("/companies", {
    method: "POST",
    body: {
      name: body.tradeName || body.legalName,
      email: body.firstAdmin.email || body.email,
      phone: body.phone,
      document: body.document,
      status: true,
      planId: body.planId ? Number(body.planId) : undefined,
      dueDate: addDays(body.trialDays ?? 15),
      recurrence: "MENSAL",
      companyUserName: body.firstAdmin.name || body.responsibleName,
    },
  });
  return fromBackendCompany(raw);
}

export async function updateCompany(
  companyId: string,
  body: Partial<CompanyInput> & { reason?: string; dueDate?: string },
) {
  if (env.useMocks) return apiRequest<Company>(ep.company(companyId), { method: "PATCH", body });
  const raw = await apiRequest<BackendCompany>(realPath(companyId), {
    method: "PUT",
    body: {
      id: Number(companyId),
      ...((body.tradeName || body.legalName) && { name: body.tradeName || body.legalName }),
      ...(body.email !== undefined && { email: body.email }),
      ...(body.phone !== undefined && { phone: body.phone }),
      ...(body.document !== undefined && { document: body.document }),
      ...(body.planId && { planId: Number(body.planId) }),
      ...(body.dueDate && { dueDate: body.dueDate }),
      ...(body.status && { status: body.status !== "suspended" && body.status !== "cancelled" }),
    },
  });
  return fromBackendCompany(raw);
}

type StatusAction = "activate" | "suspend" | "reactivate" | "cancel" | "endTrial";
const statusPath: Record<StatusAction, (id: string) => string> = {
  activate: ep.companyActivate,
  suspend: ep.companySuspend,
  reactivate: ep.companyReactivate,
  cancel: ep.companyCancel,
  endTrial: ep.companyEndTrial,
};

export async function runCompanyStatusAction(
  companyId: string,
  action: StatusAction,
  reason: string,
) {
  if (env.useMocks)
    return apiRequest<Company>(statusPath[action](companyId), { method: "POST", body: { reason } });
  if (action === "endTrial") {
    // Encerrar teste = vencimento hoje; o painel da empresa fica bloqueado até nova ativação.
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    return fromBackendCompany(
      await apiRequest<BackendCompany>(realPath(companyId), {
        method: "PUT",
        body: { id: Number(companyId), dueDate: yesterday },
      }),
    );
  }
  const active = action === "activate" || action === "reactivate";
  const raw = await apiRequest<BackendCompany>(realPath(companyId), {
    method: "PUT",
    body: { id: Number(companyId), status: active },
  });
  return fromBackendCompany(raw);
}

export function updateCompanyLimits(
  companyId: string,
  body: { userLimit: number; connectionLimit: number; storageLimitMb: number; reason: string },
) {
  if (env.useMocks) return apiRequest<Company>(ep.companyLimits(companyId), { method: "PATCH", body });
  return Promise.reject(
    new Error("No servidor atual os limites vêm do plano. Troque o plano da empresa."),
  );
}
