import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { quickMessageKeys } from "@/shared/api/query-keys";
import { quickMessageEndpoints as ep } from "@/shared/config/endpoints";
import type { QuickMessage, QuickMessageInput } from "./types";

export const quickMessagesContract = "GET /quick-messages/list";

export const quickMessagesQuery = (companyId?: string) =>
  queryOptions({
    queryKey: quickMessageKeys.list(companyId),
    queryFn: async ({ signal }) => {
      const all: QuickMessage[] = [];
      for (let page = 1; page <= 50; page++) {
        const res = await apiRequest<unknown>(`${ep.base}?searchParam=&pageNumber=${page}`, {
          signal,
        });
        if (Array.isArray(res)) return filterByCompany(res as QuickMessage[], companyId);
        const r = (res ?? {}) as { records?: QuickMessage[]; hasMore?: boolean };
        all.push(...(r.records ?? []));
        if (!r.hasMore) break;
      }
      return filterByCompany(all, companyId);
    },
    staleTime: 60_000,
  });

/** Garante que respostas de outras empresas nunca apareçam, mesmo se o backend não filtrar. */
const filterByCompany = (list: QuickMessage[], companyId?: string) => {
  if (!companyId) return list;
  return list.filter((m) => m.companyId == null || String(m.companyId) === companyId);
};

export const createQuickMessage = (body: QuickMessageInput) =>
  apiRequest<QuickMessage>(ep.base, { method: "POST", body });
export const updateQuickMessage = (id: number, body: QuickMessageInput) =>
  apiRequest<QuickMessage>(ep.detail(id), { method: "PUT", body });
export const deleteQuickMessage = (id: number) =>
  apiRequest<void>(ep.detail(id), { method: "DELETE" });

/** Normaliza atalho: sem barra inicial, minúsculo, sem espaços. */
export const normalizeShortcode = (s: string) =>
  s.trim().replace(/^\/+/, "").toLowerCase().replace(/\s+/g, "-");
