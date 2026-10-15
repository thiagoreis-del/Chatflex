import type { RequestOptions } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import type { Message, Ticket, TicketStatus, TicketTag } from "@/modules/tickets/types";
import { queues as teamQueues, users as teamUsers } from "./team";

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
const vendas = { id: 1, name: "Vendas", color: "#2563eb" };
const suporte = { id: 2, name: "Suporte", color: "#16a34a" };

const tagOptions: TicketTag[] = [
  { id: 1, name: "VIP", color: "#f59e0b" },
  { id: 2, name: "Orçamento", color: "#2563eb" },
  { id: 3, name: "Financeiro", color: "#dc2626" },
  { id: 4, name: "Pós-venda", color: "#16a34a" },
];

const tickets: Ticket[] = [
  {
    id: 1,
    status: "pending",
    lastMessage: "Olá, gostaria de um orçamento",
    updatedAt: ago(3),
    unreadMessages: 2,
    contact: { id: 1, name: "Ana Souza", number: "5511987650001" },
    queue: vendas,
    user: null,
    whatsapp: { id: 1, name: "Comercial", number: "5511999990001" },
  },
  {
    id: 2,
    status: "pending",
    lastMessage: "Meu pedido não chegou",
    updatedAt: ago(12),
    unreadMessages: 1,
    contact: { id: 2, name: "Bruno Lima", number: "5511987650002" },
    queue: suporte,
    user: null,
    whatsapp: { id: 2, name: "Suporte", number: "5511999990002" },
  },
  {
    id: 6,
    status: "open",
    lastMessage: "Pessoal, reunião às 15h",
    updatedAt: ago(8),
    unreadMessages: 3,
    contact: { id: 9, name: "Equipe Comercial", number: "120363000000000001", isGroup: true },
    queue: vendas,
    user: { id: 1, name: "Pessoa Demonstração" },
    whatsapp: { id: 1, name: "Comercial", number: "5511999990001" },
  },
  {
    id: 3,
    status: "open",
    lastMessage: "Perfeito, vou aguardar",
    updatedAt: ago(25),
    unreadMessages: 0,
    contact: { id: 3, name: "Carla Mendes", number: "5511987650003" },
    queue: vendas,
    user: { id: 1, name: "Pessoa Demonstração" },
    whatsapp: { id: 1, name: "Comercial", number: "5511999990001" },
    tags: [{ id: 1, name: "VIP", color: "#f59e0b" }],
  },
  {
    id: 4,
    status: "open",
    lastMessage: "Consegue me enviar o boleto?",
    updatedAt: ago(40),
    unreadMessages: 1,
    contact: { id: 5, name: "Elisa Prado", number: "5511987650005" },
    queue: suporte,
    user: { id: 1, name: "Pessoa Demonstração" },
    whatsapp: { id: 2, name: "Suporte", number: "5511999990002" },
  },
  {
    id: 5,
    status: "closed",
    lastMessage: "Obrigado pelo atendimento!",
    createdAt: ago(360),
    firstResponseAt: ago(355),
    updatedAt: ago(300),
    unreadMessages: 0,
    contact: { id: 7, name: "Gabriela Reis", number: "5511987650007" },
    queue: vendas,
    user: { id: 1, name: "Pessoa Demonstração" },
    whatsapp: { id: 1, name: "Comercial", number: "5511999990001" },
  },
];

let mseq = 100;
const messages: Message[] = [
  { id: "1", ticketId: 1, body: "Boa tarde!", fromMe: false, createdAt: ago(4) },
  { id: "2", ticketId: 1, body: "Olá, gostaria de um orçamento", fromMe: false, createdAt: ago(3) },
  { id: "3", ticketId: 2, body: "Meu pedido não chegou", fromMe: false, createdAt: ago(12) },
  { id: "4", ticketId: 3, body: "Vocês têm o modelo azul?", fromMe: false, createdAt: ago(30) },
  {
    id: "5",
    ticketId: 3,
    body: "Temos sim! Chega em 2 dias úteis.",
    fromMe: true,
    createdAt: ago(27),
  },
  { id: "6", ticketId: 3, body: "Perfeito, vou aguardar", fromMe: false, createdAt: ago(25) },
  {
    id: "9",
    ticketId: 3,
    body: "Esse é o modelo?",
    fromMe: false,
    createdAt: ago(29),
    mediaUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
    mediaType: "image",
  },
  { id: "7", ticketId: 4, body: "Consegue me enviar o boleto?", fromMe: false, createdAt: ago(40) },
  {
    id: "10",
    ticketId: 4,
    body: "boleto-exemplo.pdf",
    fromMe: true,
    createdAt: ago(38),
    mediaUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    mediaType: "application",
  },
  {
    id: "11",
    ticketId: 4,
    body: "Cliente com boleto vencido, verificar com financeiro.",
    fromMe: true,
    isPrivate: true,
    createdAt: ago(39),
  },
  { id: "8", ticketId: 5, body: "Obrigado pelo atendimento!", fromMe: false, createdAt: ago(300) },
];
messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));

export function ticketsMock(path: string, opts: RequestOptions): unknown {
  const method = opts.method ?? "GET";
  const url = new URL(path, "http://mock");
  const parts = url.pathname.split("/").filter(Boolean);
  const id = Number(parts[1]);

  if (parts[0] === "tags") return tagOptions;
  if (parts[0] === "tickets" && !parts[1]) {
    const status = url.searchParams.get("status") as TicketStatus | null;
    const search = (url.searchParams.get("search") ?? "").toLowerCase();
    const list = tickets
      .filter((t) => !status || t.status === status)
      .filter(
        (t) =>
          !search ||
          t.contact.name.toLowerCase().includes(search) ||
          t.contact.number.includes(search),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return { tickets: list, count: list.length, hasMore: false };
  }
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) throw new ApiError("notFound", 404);

  if (parts[0] === "ticket-tags") {
    if (method === "PUT") {
      const tag = tagOptions.find((x) => x.id === Number(parts[2]));
      if (!tag) throw new ApiError("validation", 422);
      ticket.tags = [...(ticket.tags ?? []).filter((x) => x.id !== tag.id), tag];
    }
    if (method === "DELETE") ticket.tags = [];
    return { ok: true };
  }
  if (
    parts[0] === "tickets" &&
    method === "PUT" &&
    (opts.body as { isTransfered?: boolean }).isTransfered
  ) {
    const { queueId, userId, msgTransfer } = opts.body as {
      queueId: number;
      userId: number | null;
      msgTransfer?: string;
    };
    const q = teamQueues.find((x) => x.id === queueId);
    if (!q) throw new ApiError("validation", 422);
    const u = userId ? teamUsers.find((x) => x.id === userId) : null;
    ticket.queue = { id: q.id, name: q.name, color: q.color };
    ticket.user = u ? { id: u.id, name: u.name } : null;
    ticket.status = u ? "open" : "pending";
    ticket.updatedAt = new Date().toISOString();
    const text = `Transferido para ${q.name}${u ? ` · ${u.name}` : ""}${msgTransfer ? ` — ${msgTransfer}` : ""}`;
    messages.push({
      id: String(mseq++),
      ticketId: id,
      body: text,
      fromMe: true,
      isPrivate: true,
      createdAt: ticket.updatedAt,
    });
    return ticket;
  }
  if (parts[0] === "tickets" && method === "PUT") {
    const { status, userId } = opts.body as { status: TicketStatus; userId?: number };
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    if (status === "open" && userId) {
      const u = teamUsers.find((x) => x.id === userId);
      ticket.user = { id: userId, name: u?.name ?? "Pessoa Demonstração" };
    }
    return ticket;
  }
  if (parts[0] === "messages" && method === "POST") {
    let msg: Message;
    if (opts.body instanceof FormData) {
      const file = opts.body.get("medias") as File;
      const caption = String(opts.body.get("body") ?? "");
      msg = {
        id: String(mseq++),
        ticketId: id,
        body: caption || file.name,
        fromMe: true,
        createdAt: new Date().toISOString(),
        // Demo: URL local do navegador; some ao recarregar.
        mediaUrl: URL.createObjectURL(file),
        mediaType: file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("audio/")
            ? "audio"
            : file.type.startsWith("video/")
              ? "video"
              : "application",
      };
    } else {
      const { body, isPrivate, quotedMsg } = opts.body as {
        body: string;
        isPrivate?: string;
        quotedMsg?: { id: string };
      };
      const quoted = quotedMsg ? messages.find((m) => m.id === quotedMsg.id) : undefined;
      msg = {
        isPrivate: isPrivate === "true",
        id: String(mseq++),
        ticketId: id,
        body,
        fromMe: true,
        createdAt: new Date().toISOString(),
        ...(quoted ? { quotedMsg: quoted } : {}),
      };
    }
    messages.push(msg);
    if (msg.isPrivate) return msg;
    ticket.lastMessage = msg.mediaUrl ? `📎 ${msg.body}` : msg.body;
    ticket.updatedAt = msg.createdAt;
    return msg;
  }
  if (parts[0] === "messages") {
    ticket.unreadMessages = 0;
    const list = messages.filter((m) => m.ticketId === id);
    return { messages: list, ticket, count: list.length, hasMore: false };
  }
  throw new ApiError("notFound", 404);
}
