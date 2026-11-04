import type { Ticket } from "./types";

/** Only server-authorized records are merged; never deduplicate history by contact. */
export function mergeTicketHistory(pages: Ticket[][]): Ticket[] {
  const records = new Map<number, Ticket>();
  for (const page of pages) {
    for (const ticket of page) {
      if (!records.has(ticket.id)) records.set(ticket.id, ticket);
    }
  }
  return [...records.values()];
}