import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { ticketKeys } from "@/shared/api/query-keys";
import { ticketEndpoints as ep, withQuery } from "@/shared/config/endpoints";
import type { Message, Ticket, TicketFilters, TicketStatus } from "./types";

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

export const sendMessage = (ticketId: number, body: string) =>
  apiRequest<Message>(ep.messages(ticketId), { method: "POST", body: { body } });
