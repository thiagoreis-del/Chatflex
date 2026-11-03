import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { whatsappKeys } from "@/shared/api/query-keys";
import { whatsappEndpoints as ep } from "@/shared/config/endpoints";
import type { WhatsAppConnection, WhatsAppInput } from "./types";

export const whatsappContract = "GET /whatsapp";

/** O backend varia entre array direto e envelopes conforme a versão instalada. */
export function normalizeConnectionsResponse(value: unknown): WhatsAppConnection[] {
  if (Array.isArray(value)) return value as WhatsAppConnection[];
  if (!value || typeof value !== "object") throw new Error("Invalid WhatsApp list response");
  const response = value as {
    whatsapps?: unknown;
    data?: unknown;
    records?: unknown;
  };
  const list = response.whatsapps ?? response.data ?? response.records;
  if (!Array.isArray(list)) throw new Error("Invalid WhatsApp list response");
  return list as WhatsAppConnection[];
}

export const connectionsQuery = () =>
  queryOptions({
    queryKey: whatsappKeys.list(),
    queryFn: async ({ signal }) =>
      normalizeConnectionsResponse(await apiRequest<unknown>(ep.list, { signal })),
  });

/** Enquanto o Socket estiver desativado, o QR é obtido por consulta periódica. */
export const connectionQuery = (id: number, poll: boolean) =>
  queryOptions({
    queryKey: whatsappKeys.detail(id),
    queryFn: ({ signal }) => apiRequest<WhatsAppConnection>(ep.status(id), { signal }),
    refetchInterval: poll ? 2500 : false,
    refetchIntervalInBackground: true,
    staleTime: 0,
  });

export const createConnection = (body: WhatsAppInput) =>
  apiRequest<WhatsAppConnection>(ep.list, { method: "POST", body });
export const updateConnection = (id: number, body: WhatsAppInput) =>
  apiRequest<WhatsAppConnection>(ep.detail(id), { method: "PUT", body });
export const deleteConnection = (id: number) =>
  apiRequest<void>(ep.detail(id), { method: "DELETE" });
export const startSession = (id: number) => apiRequest<void>(ep.session(id), { method: "POST" });
export const refreshQr = (id: number) => apiRequest<void>(ep.session(id), { method: "PUT" });
export const disconnectSession = (id: number) =>
  apiRequest<void>(ep.session(id), { method: "DELETE" });
