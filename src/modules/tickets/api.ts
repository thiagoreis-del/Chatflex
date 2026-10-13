import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { ticketKeys } from "@/shared/api/query-keys";
import { ticketEndpoints as ep, withQuery } from "@/shared/config/endpoints";
import type { Message, Ticket, TicketFilters, TicketStatus, TransferInput } from "./types";

export const ticketsContract = "GET /tickets";

export const ticketsQuery = (filters: TicketFilters) =>
  queryOptions({
    queryKey: ticketKeys.list(filters),
    queryFn: ({ signal }) => apiRequest<Ticket[]>(withQuery(ep.list, filters), { signal }),
  });

export const messagesQuery = (ticketId: number) =>
  queryOptions({
    queryKey: ticketKeys.messages(ticketId),
    queryFn: ({ signal }) => apiRequest<Message[]>(ep.messages(ticketId), { signal }),
    // Socket desativado: atualização periódica até o contrato de tempo real ser confirmado.
    refetchInterval: 5000,
  });

export const updateTicketStatus = (id: number, status: TicketStatus) =>
  apiRequest<Ticket>(ep.detail(id), { method: "PUT", body: { status } });

export const sendMessage = (ticketId: number, body: string, isPrivate = false) =>
  apiRequest<Message>(ep.messages(ticketId), {
    method: "POST",
    body: isPrivate ? { body, isPrivate: true } : { body },
  });

/** CONTRATO PENDENTE: PUT /tickets/:id/transfer { queueId, userId?, note? }. */
export const transferTicket = (ticketId: number, input: TransferInput) =>
  apiRequest<Ticket>(ep.transfer(ticketId), { method: "PUT", body: input });

/** CONTRATO PENDENTE: POST /tickets/:id/tags { tag }. */
export const addTicketTag = (ticketId: number, tag: string) =>
  apiRequest<Ticket>(ep.tags(ticketId), { method: "POST", body: { tag } });

/** CONTRATO PENDENTE: DELETE /tickets/:id/tags/:tag. */
export const removeTicketTag = (ticketId: number, tag: string) =>
  apiRequest<Ticket>(ep.tag(ticketId, tag), { method: "DELETE" });

/** Contrato observado: multipart com campo `medias` (multer array) e `body` como legenda. */
export const sendMediaMessage = (ticketId: number, file: File, caption = "") => {
  const form = new FormData();
  form.append("medias", file);
  form.append("body", caption);
  return apiRequest<Message | undefined>(ep.messages(ticketId), { method: "POST", body: form });
};

export const MAX_MEDIA_BYTES = 16 * 1024 * 1024;
export const ACCEPTED_MEDIA =
  "image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip";
