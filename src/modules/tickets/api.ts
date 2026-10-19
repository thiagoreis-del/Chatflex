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
  open: number;
  avgHandleMinutes: number | null;
}

export interface QueueMetric {
  id: number;
  name: string;
  color: string;
  closedToday: number;
  waiting: number;
  waitMinutes: number | null;
}

export interface OperationalDashboard {
  pending: number;
  open: number;
  closedToday: number;
  attendants: AttendantMetric[];
  queues: QueueMetric[];
  hourly: { hour: number; created: number; closed: number }[];
  firstResponseMinutes: number | null;
  /** TME: espera atual dos tickets aguardando (ou 1ª resposta dos encerrados). */
  waitMinutes: number | null;
  /** TMA: do início do atendimento ao encerramento, nos encerrados de hoje. */
  handleMinutes: number | null;
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

/** Busca TODAS as páginas de um status, para métricas e gráficos completos. */
async function fetchAllTickets(
  status: TicketStatus,
  extra: Record<string, unknown>,
  signal: AbortSignal | undefined,
): Promise<{ tickets: Ticket[]; count: number }> {
  const tickets: Ticket[] = [];
  let count = 0;
  let pageNumber = 1;
  while (true) {
    const result = await apiRequest<TicketsResponse>(
      withQuery(ep.list, { ...scope(), status, pageNumber, ...extra }),
      { signal },
    );
    tickets.push(...(result.tickets ?? []));
    count = result.count ?? tickets.length;
    if (!result.hasMore || !result.tickets?.length) break;
    pageNumber += 1;
  }
  return { tickets, count };
}

/**
 * Resumo operacional usando contratos já disponíveis no backend.
 * Todas as páginas são percorridas, então gráficos e métricas contam
 * todos os atendimentos. O tempo de primeira resposta permanece nulo
 * até o servidor expor a métrica.
  */
export const operationalDashboardQuery = () =>
  queryOptions({
    queryKey: ticketKeys.operationalDashboard(),
    queryFn: async ({ signal }): Promise<OperationalDashboard> => {
      const date = new Date().toLocaleDateString("en-CA");
      const [pending, open, closed] = await Promise.all([
        fetchAllTickets("pending", {}, signal),
        fetchAllTickets("open", {}, signal),
        fetchAllTickets("closed", { date }, signal),
      ]);
      const now = Date.now();
      const minutes = (from?: string | null, to?: string | number | null) => {
        if (!from || to == null) return null;
        const v = (new Date(to).getTime() - new Date(from).getTime()) / 60_000;
        return Number.isFinite(v) && v >= 0 && v < 60 * 24 * 7 ? v : null;
      };
      const avg = (list: number[]) =>
        list.length ? Math.round(list.reduce((a, b) => a + b, 0) / list.length) : null;
      const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, created: 0, closed: 0 }));
      const today = new Date().toDateString();
      for (const tk of [...(pending.tickets ?? []), ...(open.tickets ?? []), ...(closed.tickets ?? [])]) {
        const d = tk.createdAt ? new Date(tk.createdAt) : null;
        if (d && d.toDateString() === today) hourly[d.getHours()]!.created += 1;
      }
      const byAttendant = new Map<number, AttendantMetric & { handle: number[] }>();
      const byQueue = new Map<number, QueueMetric & { wait: number[] }>();
      const firstResponseTimes: number[] = [];
      const handleTimes: number[] = [];
      for (const ticket of closed.tickets ?? []) {
        const closedAt = new Date(ticket.updatedAt);
        if (closedAt.toDateString() === today) hourly[closedAt.getHours()]!.closed += 1;
        const fr = minutes(ticket.createdAt, ticket.firstResponseAt);
        if (fr != null) firstResponseTimes.push(fr);
        const handle = minutes(ticket.firstResponseAt ?? ticket.createdAt, ticket.updatedAt);
        if (handle != null) handleTimes.push(handle);
        if (ticket.queue) {
          const q = byQueue.get(ticket.queue.id) ?? {
            id: ticket.queue.id, name: ticket.queue.name, color: ticket.queue.color,
            closedToday: 0, waiting: 0, waitMinutes: null, wait: [],
          };
          q.closedToday += 1;
          byQueue.set(q.id, q);
        }
        if (!ticket.user) continue;
        const a = byAttendant.get(ticket.user.id) ?? {
          id: ticket.user.id, name: ticket.user.name, closedToday: 0, open: 0, avgHandleMinutes: null, handle: [],
        };
        a.closedToday += 1;
        if (handle != null) a.handle.push(handle);
        byAttendant.set(a.id, a);
      }
      for (const ticket of open.tickets ?? []) {
        if (!ticket.user) continue;
        const a = byAttendant.get(ticket.user.id) ?? {
          id: ticket.user.id, name: ticket.user.name, closedToday: 0, open: 0, avgHandleMinutes: null, handle: [],
        };
        a.open += 1;
        byAttendant.set(a.id, a);
      }
      // TME: quem está aguardando agora, desde a abertura do ticket.
      const waitNow: number[] = [];
      for (const ticket of pending.tickets ?? []) {
        const w = minutes(ticket.createdAt ?? ticket.updatedAt, now);
        if (w != null) waitNow.push(w);
        if (!ticket.queue) continue;
        const q = byQueue.get(ticket.queue.id) ?? {
          id: ticket.queue.id, name: ticket.queue.name, color: ticket.queue.color,
          closedToday: 0, waiting: 0, waitMinutes: null, wait: [],
        };
        q.waiting += 1;
        if (w != null) q.wait.push(w);
        byQueue.set(q.id, q);
      }
      return {
        pending: pending.count,
        open: open.count,
        closedToday: closed.count,
        attendants: [...byAttendant.values()]
          .map(({ handle, ...a }) => ({ ...a, avgHandleMinutes: avg(handle) }))
          .sort((a, b) => b.closedToday - a.closedToday || b.open - a.open),
        queues: [...byQueue.values()]
          .map(({ wait, ...q }) => ({ ...q, waitMinutes: avg(wait) }))
          .sort((a, b) => b.closedToday + b.waiting - (a.closedToday + a.waiting)),
        hourly,
        firstResponseMinutes: avg(firstResponseTimes),
        waitMinutes: avg(waitNow.length ? waitNow : firstResponseTimes),
        handleMinutes: avg(handleTimes),
        attendantsPartial: false,
      };
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
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
      // O backend guarda grupos com status "group"; também aceitamos aberto/aguardando marcados.
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
export const sendMessage = (
  ticketId: number,
  body: string,
  isPrivate = false,
  quoted: Message | null = null,
) =>
  apiRequest<Message>(ep.messages(ticketId), {
    method: "POST",
    body: isPrivate
      ? { body, isPrivate: "true" }
      : quoted
        ? { body, quotedMsg: { id: quoted.id, body: quoted.body, fromMe: quoted.fromMe } }
        : { body },
  });

/** Transferência = update do ticket com `msgTransfer` e `isTransfered: true`. */
export const transferTicket = (ticketId: number, input: TransferInput) =>
  apiRequest<Ticket>(ep.detail(ticketId), {
    method: "PUT",
    body: {
      // Recusa não envia fila: o backend mantém a fila atual do ticket.
      ...(input.queueId ? { queueId: input.queueId } : {}),
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

export interface CreateTicketInput {
  contactId: number;
  userId?: number | undefined;
  whatsappId?: number | undefined;
}

/** Inicia um atendimento para um contato que não está em atendimento. */
export const createTicket = (input: CreateTicketInput) =>
  apiRequest<Ticket>(ep.list, { method: "POST", body: { status: "open", ...input } });
