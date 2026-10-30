import type { Ticket } from "./types";

/** Normaliza apenas números plausíveis; JIDs e valores quebrados não são agrupados. */
export function normalizedTicketNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  const number = value.replace(/\D/g, "");
  return number.length >= 7 && number.length <= 15 ? number : null;
}

/**
 * Identidade da conversa no WhatsApp. A conexão faz parte da chave porque o
 * mesmo cliente pode conversar legitimamente com dois números da empresa.
 */
export function ticketConversationKey(ticket: Ticket): string {
  if (ticket.isGroup || ticket.contact?.isGroup) return `group:${ticket.id}`;
  const connectionId = ticket.whatsapp?.id;
  const number = normalizedTicketNumber(ticket.contact?.number);
  if (connectionId != null && number) return `whatsapp:${connectionId}:${number}`;
  return `contact:${connectionId ?? "unknown"}:${ticket.contact?.id ?? ticket.id}`;
}

const timestamp = (ticket: Ticket) => {
  const value = new Date(ticket.updatedAt).getTime();
  return Number.isFinite(value) ? value : 0;
};

/** Mantém somente o ticket mais recentemente atualizado de cada conversa ativa. */
export function deduplicateActiveTickets(tickets: Ticket[]): Ticket[] {
  const latest = new Map<string, Ticket>();
  for (const ticket of tickets) {
    const key = ticketConversationKey(ticket);
    const current = latest.get(key);
    if (
      !current ||
      timestamp(ticket) > timestamp(current) ||
      (timestamp(ticket) === timestamp(current) && ticket.id > current.id)
    ) {
      latest.set(key, ticket);
    }
  }
  return [...latest.values()].sort((a, b) => timestamp(b) - timestamp(a) || b.id - a.id);
}
