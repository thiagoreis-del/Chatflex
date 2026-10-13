import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { ticketKeys } from "@/shared/api/query-keys";
import { ticketEndpoints as ep, withQuery } from "@/shared/config/endpoints";
import type {
  Message,
  Ticket,
  TicketFilters,
  TicketStatus,
  TicketTag,
  TransferInput,
} from "./types";

export const ticketsContract = "GET /tickets";

/** Backend responde `{ tickets, count, hasMore }`. */
interface TicketsResponse {
  tickets: Ticket[];
  count: number;
  hasMore: boolean;
}
/** Backend responde `{ messages, ticket, count, hasMore }`. */
interface MessagesResponse {
  messages: Message[];
  count: number;
  hasMore: boolean;
}

export const ticketsQuery = (filters: TicketFilters) =>
  queryOptions({
    queryKey: ticketKeys.list(filters),
    queryFn: async ({ signal }) =>
      (await apiRequest<TicketsResponse>(withQuery(ep.list, filters), { signal }))?.tickets ?? [],
  });

export const messagesQuery = (ticketId: number) =>
  queryOptions({
    queryKey: ticketKeys.messages(ticketId),
    queryFn: async ({ signal }) =>
      (await apiRequest<MessagesResponse>(ep.messages(ticketId), { signal }))?.messages ?? [],
    // Polling de fallback é definido na tela conforme o status do Socket.
  });

export const tagOptionsQuery = () =>
  queryOptions({
    queryKey: ticketKeys.tagOptions,
    queryFn: ({ signal }) => apiRequest<TicketTag[]>(ep.tagOptions, { signal }),
    staleTime: 60_000,
  });

export const updateTicketStatus = (id: number, status: TicketStatus) =>
  apiRequest<Ticket>(ep.detail(id), { method: "PUT", body: { status } });

/** Nota interna: o backend compara `isPrivate === "true"` (string). */
export const sendMessage = (ticketId: number, body: string, isPrivate = false) =>
  apiRequest<Message>(ep.messages(ticketId), {
    method: "POST",
    body: isPrivate ? { body, isPrivate: "true" } : { body },
  });

/** Transferência = update do ticket com `msgTransfer` e `isTransfered: true`. */
export const transferTicket = (ticketId: number, input: TransferInput) =>
  apiRequest<Ticket>(ep.detail(ticketId), {
    method: "PUT",
    body: {
      queueId: input.queueId,
      userId: input.userId ?? null,
      status: input.userId ? "open" : "pending",
      isTransfered: true,
      ...(input.note ? { msgTransfer: input.note } : {}),
    },
  });

/** Vincula etiqueta e devolve o ticket com a lista local atualizada. */
export async function addTicketTag(ticket: Ticket, tag: TicketTag): Promise<Ticket> {
  await apiRequest(ep.ticketTag(ticket.id, tag.id), { method: "PUT" });
  const others = (ticket.tags ?? []).filter((x) => x.id !== tag.id);
  return { ...ticket, tags: [...others, tag] };
}

/** O backend só remove TODAS; re-vinculamos as que devem ficar. */
export async function removeTicketTag(ticket: Ticket, tagId: number): Promise<Ticket> {
  const keep = (ticket.tags ?? []).filter((x) => x.id !== tagId);
  await apiRequest(ep.ticketTags(ticket.id), { method: "DELETE" });
  for (const tag of keep) await apiRequest(ep.ticketTag(ticket.id, tag.id), { method: "PUT" });
  return { ...ticket, tags: keep };
}

/** Contrato confirmado: multipart com campo `medias` (multer array) e `body` como legenda. */
export const sendMediaMessage = (ticketId: number, file: File, caption = "") => {
  const form = new FormData();
  form.append("medias", file);
  form.append("body", caption);
  return apiRequest<Message | undefined>(ep.messages(ticketId), { method: "POST", body: form });
};

export const MAX_MEDIA_BYTES = 16 * 1024 * 1024;
export const ACCEPTED_MEDIA =
  "image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip";
