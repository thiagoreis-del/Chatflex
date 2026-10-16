import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { quickMessageKeys } from "@/shared/api/query-keys";
import { quickMessageEndpoints as ep } from "@/shared/config/endpoints";
import type { QuickMessage, QuickMessageInput } from "./types";

export const quickMessagesContract = "GET /quick-messages/list";

export const quickMessagesQuery = () =>
  queryOptions({
    queryKey: quickMessageKeys.list(),
    queryFn: async ({ signal }) => {
      const all: QuickMessage[] = [];
      for (let page = 1; page <= 50; page++) {
        const res = await apiRequest<unknown>(`${ep.base}?searchParam=&pageNumber=${page}`, { signal });
        if (Array.isArray(res)) return res as QuickMessage[];
        const r = (res ?? {}) as { records?: QuickMessage[]; hasMore?: boolean };
        all.push(...(r.records ?? []));
        if (!r.hasMore) break;
      }
      return all;
    },
    staleTime: 60_000,
  });

export const createQuickMessage = (body: QuickMessageInput) =>
  apiRequest<QuickMessage>(ep.base, { method: "POST", body });
export const updateQuickMessage = (id: number, body: QuickMessageInput) =>
  apiRequest<QuickMessage>(ep.detail(id), { method: "PUT", body });
export const deleteQuickMessage = (id: number) =>
  apiRequest<void>(ep.detail(id), { method: "DELETE" });

/** Normaliza atalho: sem barra inicial, minúsculo, sem espaços. */
export const normalizeShortcode = (s: string) =>
  s.trim().replace(/^\/+/, "").toLowerCase().replace(/\s+/g, "-");
