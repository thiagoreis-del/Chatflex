import type { Ticket } from "./types";

/** Normaliza apenas números plausíveis; JIDs e valores quebrados não são agrupados. */
export function normalizedTicketNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  let number = value.replace(/\D/g, "");
  if (number.startsWith("00")) number = number.slice(2);
  if (number.length < 7 || number.length > 15) return null;

  // O WhatsApp ainda pode devolver números brasileiros no formato antigo,
  // sem o nono dígito. As duas formas identificam a mesma conversa.
  if (number.startsWith("55") && number.length === 13 && number[4] === "9") {
    number = `${number.slice(0, 4)}${number.slice(5)}`;
  }
  return number;
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
  const newest = (items: Ticket[]) =>
    items.reduce((current, ticket) =>
      timestamp(ticket) > timestamp(current) ||
      (timestamp(ticket) === timestamp(current) && ticket.id > current.id)
        ? ticket
        : current,
    );
  const result: Ticket[] = [];
  const byNumber = new Map<string, Ticket[]>();

  for (const ticket of tickets) {
    const number =
      ticket.isGroup || ticket.contact?.isGroup
        ? null
        : normalizedTicketNumber(ticket.contact?.number);
    if (!number) {
      result.push(ticket);
      continue;
    }
    const bucket = byNumber.get(number) ?? [];
    bucket.push(ticket);
    byNumber.set(number, bucket);
  }

  for (const bucket of byNumber.values()) {
    const knownConnections = new Map<number, Ticket[]>();
    const unknown: Ticket[] = [];
    for (const ticket of bucket) {
      const connectionId = ticket.whatsapp?.id;
      if (connectionId == null) unknown.push(ticket);
      else {
        const connection = knownConnections.get(connectionId) ?? [];
        connection.push(ticket);
        knownConnections.set(connectionId, connection);
      }
    }

    if (knownConnections.size === 0) result.push(newest(unknown));
    else if (knownConnections.size === 1) {
      result.push(newest([...knownConnections.values().next().value!, ...unknown]));
    } else {
      for (const connection of knownConnections.values()) result.push(newest(connection));
      // Sem conexão não há como decidir a qual conversa pertence. Mantemos
      // esses registros visíveis para não esconder um atendimento legítimo.
      result.push(...unknown);
    }
  }

  return result.sort((a, b) => timestamp(b) - timestamp(a) || b.id - a.id);
}
