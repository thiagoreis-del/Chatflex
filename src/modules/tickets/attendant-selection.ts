import type { Ticket } from "./types";

export function selectedReplyUserId(filter: string, isAdmin: boolean): number | null {
  if (!isAdmin || !/^\d+$/.test(filter)) return null;
  const id = Number(filter);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

/** Toda resposta ao cliente abre o atendimento e registra quem está respondendo. */
export function ticketNeedsOutgoingAssignment(
  ticket: Pick<Ticket, "status" | "user">,
  senderId: number,
): boolean {
  return ticket.status !== "open" || Number(ticket.user?.id) !== senderId;
}

/** A assinatura persistida na mensagem preserva a autoria histórica do envio. */
export function outgoingMessageAttendant(body: string, fallback?: string | null): string | null {
  const signed = /^\*([^*\n]+):\*/.exec(body)?.[1]?.trim();
  return signed || fallback?.trim() || null;
}

export function matchesAttendantFilter(
  ticket: Pick<Ticket, "user" | "status">,
  filter: string,
  currentUserId: string | number | undefined,
  isAdmin: boolean,
): boolean {
  if (filter === "all") return true;
  if (filter === "none") return !ticket.user;
  if (filter === "mine") return !!ticket.user && String(ticket.user.id) === String(currentUserId);
  if (!isAdmin) return false;
  return String(ticket.user?.id) === filter || (ticket.status === "pending" && !ticket.user);
}
