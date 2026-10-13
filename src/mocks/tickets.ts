import type { RequestOptions } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import type { Message, Ticket, TicketStatus } from "@/modules/tickets/types";

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();
const vendas = { id: 1, name: "Vendas", color: "#2563eb" };
const suporte = { id: 2, name: "Suporte", color: "#16a34a" };

const tickets: Ticket[] = [
  { id: 1, status: "pending", lastMessage: "Olá, gostaria de um orçamento", updatedAt: ago(3), unreadMessages: 2, contact: { id: 1, name: "Ana Souza", number: "5511987650001" }, queue: vendas, user: null },
  { id: 2, status: "pending", lastMessage: "Meu pedido não chegou", updatedAt: ago(12), unreadMessages: 1, contact: { id: 2, name: "Bruno Lima", number: "5511987650002" }, queue: suporte, user: null },
  { id: 3, status: "open", lastMessage: "Perfeito, vou aguardar", updatedAt: ago(25), unreadMessages: 0, contact: { id: 3, name: "Carla Mendes", number: "5511987650003" }, queue: vendas, user: { id: 1, name: "Pessoa Demonstração" } },
  { id: 4, status: "open", lastMessage: "Consegue me enviar o boleto?", updatedAt: ago(40), unreadMessages: 1, contact: { id: 5, name: "Elisa Prado", number: "5511987650005" }, queue: suporte, user: { id: 1, name: "Pessoa Demonstração" } },
  { id: 5, status: "closed", lastMessage: "Obrigado pelo atendimento!", updatedAt: ago(300), unreadMessages: 0, contact: { id: 7, name: "Gabriela Reis", number: "5511987650007" }, queue: vendas, user: { id: 1, name: "Pessoa Demonstração" } },
];

let mseq = 100;
const messages: Message[] = [
  { id: "1", ticketId: 1, body: "Boa tarde!", fromMe: false, createdAt: ago(4) },
  { id: "2", ticketId: 1, body: "Olá, gostaria de um orçamento", fromMe: false, createdAt: ago(3) },
  { id: "3", ticketId: 2, body: "Meu pedido não chegou", fromMe: false, createdAt: ago(12) },
  { id: "4", ticketId: 3, body: "Vocês têm o modelo azul?", fromMe: false, createdAt: ago(30) },
  { id: "5", ticketId: 3, body: "Temos sim! Chega em 2 dias úteis.", fromMe: true, createdAt: ago(27) },
  { id: "6", ticketId: 3, body: "Perfeito, vou aguardar", fromMe: false, createdAt: ago(25) },
  { id: "7", ticketId: 4, body: "Consegue me enviar o boleto?", fromMe: false, createdAt: ago(40) },
  { id: "8", ticketId: 5, body: "Obrigado pelo atendimento!", fromMe: false, createdAt: ago(300) },
];

export function ticketsMock(path: string, opts: RequestOptions): unknown {
  const method = opts.method ?? "GET";
  const url = new URL(path, "http://mock");
  const parts = url.pathname.split("/").filter(Boolean);
  const id = Number(parts[1]);

  if (parts[0] === "tickets" && !parts[1]) {
    const status = url.searchParams.get("status") as TicketStatus | null;
    const search = (url.searchParams.get("search") ?? "").toLowerCase();
    return tickets
      .filter((t) => !status || t.status === status)
      .filter((t) => !search || t.contact.name.toLowerCase().includes(search) || t.contact.number.includes(search))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) throw new ApiError("notFound", 404);

  if (parts[0] === "tickets" && method === "PUT") {
    const { status } = opts.body as { status: TicketStatus };
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    if (status === "open") ticket.user = { id: 1, name: "Pessoa Demonstração" };
    return ticket;
  }
  if (parts[0] === "messages" && method === "POST") {
    const { body } = opts.body as { body: string };
    const msg: Message = { id: String(mseq++), ticketId: id, body, fromMe: true, createdAt: new Date().toISOString() };
    messages.push(msg);
    ticket.lastMessage = body;
    ticket.updatedAt = msg.createdAt;
    return msg;
  }
  if (parts[0] === "messages") {
    ticket.unreadMessages = 0;
    return messages.filter((m) => m.ticketId === id);
  }
  throw new ApiError("notFound", 404);
}
