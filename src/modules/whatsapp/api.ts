import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { whatsappKeys } from "@/shared/api/query-keys";
import { whatsappEndpoints as ep } from "@/shared/config/endpoints";
import type { WhatsAppConnection, WhatsAppInput } from "./types";

export const whatsappContract = "GET /whatsapp";

export const connectionsQuery = () =>
  queryOptions({
    queryKey: whatsappKeys.list(),
    queryFn: ({ signal }) => apiRequest<WhatsAppConnection[]>(ep.list, { signal }),
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
