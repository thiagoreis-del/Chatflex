import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { quickMessageKeys } from "@/shared/api/query-keys";
import { quickMessageEndpoints as ep } from "@/shared/config/endpoints";
import type { QuickMessage, QuickMessageInput } from "./types";

export const quickMessagesContract = "GET /quick-messages/list";

export const quickMessagesQuery = () =>
  queryOptions({
    queryKey: quickMessageKeys.list(),
    queryFn: ({ signal }) => apiRequest<QuickMessage[]>(ep.list, { signal }),
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
