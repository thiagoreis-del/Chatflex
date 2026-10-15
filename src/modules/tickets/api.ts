import { queryOptions } from "@tanstack/react-query";
import { apiRequest, apiUpload, type UploadOptions } from "@/shared/api/client";
import { ticketKeys } from "@/shared/api/query-keys";
import { ticketEndpoints as ep, withQuery } from "@/shared/config/endpoints";
import { sessionStore } from "@/shared/auth/session-store";
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

export interface AttendantMetric {
  id: number;
  name: string;
  closedToday: number;
}

export interface OperationalDashboard {
  pending: number;
  open: number;
  closedToday: number;
  attendants: AttendantMetric[];
  firstResponseMinutes: number | null;
  attendantsPartial: boolean;
}

/**
 * O backend (ListTicketsService) filtra por `queueIds`; sem esse parâmetro,
 * conversas com fila não aparecem em Aguardando. Admins usam `showAll=true`.
 */
function scope(): Record<string, string> {
  const user = sessionStore.get().user;
  const out: Record<string, string> = { queueIds: JSON.stringify(user?.queueIds ?? []) };
  if (user && user.role !== "agent") out["showAll"] = "true";
  return out;
}

export const ticketsQuery = (filters: TicketFilters) =>
  queryOptions({
    queryKey: ticketKeys.list(filters),
    queryFn: async ({ signal }) =>
      (
        await apiRequest<TicketsResponse>(withQuery(ep.list, { ...scope(), ...filters }), {
          signal,
        })
      )?.tickets ?? [],
  });

/** Session-wide notification fallback, including pages beyond the visible list. */
export const incomingTicketsQuery = (companyId: string) =>
  queryOptions({
    queryKey: [...ticketKeys.all, "incoming", companyId],
    queryFn: async ({ signal }): Promise<Ticket[]> => {
      const lists = await Promise.all(
        ["pending", "open", "group"].map(async (status) => {
          const tickets: Ticket[] = [];
          let pageNumber = 1;
          while (true) {
            const result = await apiRequest<TicketsResponse>(
              withQuery(ep.list, {
                ...scope(),
                status,
                pageNumber,
              }),
              { signal },
            );
            tickets.push(...(result.tickets ?? []));
            if (!result.hasMore || !result.tickets?.length) break;
            pageNumber += 1;
          }
          return tickets;
        }),
      );
      return [...new Map(lists.flat().map((ticket) => [ticket.id, ticket])).values()];
    },
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

/**
 * Resumo operacional usando contratos já disponíveis no backend.
 * O total por status vem de `count`. A distribuição por atendente usa os
 * tickets fechados devolvidos na página; `attendantsPartial` informa paginação.
 * O tempo de primeira resposta permanece nulo até o servidor expor a métrica.
 */
export const operationalDashboardQuery = () =>
  queryOptions({
    queryKey: ticketKeys.operationalDashboard(),
    queryFn: async ({ signal }): Promise<OperationalDashboard> => {
      const date = new Date().toLocaleDateString("en-CA");
      const get = (status: TicketStatus, extra: Record<string, unknown> = {}) =>
        apiRequest<TicketsResponse>(withQuery(ep.list, { ...scope(), status, ...extra }), {
          signal,
        });
      const [pending, open, closed] = await Promise.all([
        get("pending"),
        get("open"),
        get("closed", { date }),
      ]);
      const byAttendant = new Map<number, AttendantMetric>();
      const firstResponseTimes: number[] = [];
      for (const ticket of closed.tickets ?? []) {
        if (ticket.createdAt && ticket.firstResponseAt) {
          const minutes =
            (new Date(ticket.firstResponseAt).getTime() - new Date(ticket.createdAt).getTime()) /
            60_000;
          if (Number.isFinite(minutes) && minutes >= 0) firstResponseTimes.push(minutes);
        }
        if (!ticket.user) continue;
        const current = byAttendant.get(ticket.user.id);
        if (current) current.closedToday += 1;
        else
          byAttendant.set(ticket.user.id, {
            id: ticket.user.id,
            name: ticket.user.name,
            closedToday: 1,
          });
      }
      return {
        pending: pending.count ?? pending.tickets.length,
        open: open.count ?? open.tickets.length,
        closedToday: closed.count ?? closed.tickets.length,
        attendants: [...byAttendant.values()].sort((a, b) => b.closedToday - a.closedToday),
        firstResponseMinutes: firstResponseTimes.length
          ? Math.round(
              firstResponseTimes.reduce((total, value) => total + value, 0) /
                firstResponseTimes.length,
            )
          : null,
        attendantsPartial: !!closed.hasMore,
      };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

/** Grupos: tickets ativos (aberto + aguardando) cujo contato é grupo. */
export const groupTicketsQuery = (search?: string) =>
  queryOptions({
    queryKey: [...ticketKeys.list({ status: "open", search }), "groups"],
    queryFn: async ({ signal }) => {
      const get = (status: string) =>
        apiRequest<TicketsResponse>(withQuery(ep.list, { ...scope(), status, search }), {
          signal,
        }).catch(() => ({ tickets: [] as Ticket[] }));
      // ZapPro guarda grupos com status "group"; também aceitamos aberto/aguardando marcados.
      const [g, o, p] = await Promise.all([get("group"), get("open"), get("pending")]);
      const seen = new Set<number>();
      return [...(g?.tickets ?? []), ...(o?.tickets ?? []), ...(p?.tickets ?? [])]
        .filter((t) => (t.status as string) === "group" || t.contact?.isGroup || t.isGroup)
        .filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
  });

/** Encerra vários tickets em lotes de 5 para não sobrecarregar o servidor. */
export async function closeTicketsBulk(ids: number[]) {
  let failed = 0;
  for (let i = 0; i < ids.length; i += 5) {
    const r = await Promise.allSettled(
      ids.slice(i, i + 5).map((id) => updateTicketStatus(id, "closed")),
    );
    failed += r.filter((x) => x.status === "rejected").length;
  }
  return { closed: ids.length - failed, failed };
}

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

/** Ao aceitar/reabrir, o backend só define o atendente se `userId` for enviado. */
export const updateTicketStatus = (id: number, status: TicketStatus, userId?: number | null) =>
  apiRequest<Ticket>(ep.detail(id), {
    method: "PUT",
    body: status === "open" && userId ? { status, userId } : { status },
  });

/** Assume a conversa para o atendente logado (ticket aberto sem responsável). */
export const assignTicket = (id: number, userId: number) =>
  apiRequest<Ticket>(ep.detail(id), { method: "PUT", body: { status: "open", userId } });

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
export const sendMediaMessage = (
  ticketId: number,
  file: File,
  caption = "",
  opts: UploadOptions = {},
) => {
  const form = new FormData();
  form.append("medias", file);
  form.append("body", caption);
  return apiUpload<Message | undefined>(ep.messages(ticketId), form, opts);
};

export const MAX_MEDIA_BYTES = 16 * 1024 * 1024;
export const ACCEPTED_MEDIA =
  "image/*,audio/*,video/*,application/pdf,.jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.txt,.rtf,.odt,.xls,.xlsx,.csv,.ods,.ppt,.pptx,.zip,.rar,.7z,.mp3,.wav,.ogg,.m4a,.mp4,.mov,.webm,.xml,.json";
