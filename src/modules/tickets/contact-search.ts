import type { Contact } from "@/modules/contacts/types";
import type { Ticket, TicketContact } from "./types";
import { normalizedTicketNumber } from "./ticket-identity";

/** Identifica grupos por marcação explícita ou JID do WhatsApp. */
export function isGroupContact(contact: Pick<Contact, "isGroup" | "number">): boolean {
  return contact.isGroup === true || /@g\.us$/i.test(contact.number.trim());
}

export function normalizeContactSearch(search: string): string {
  const term = search.trim();
  return /^[\d\s()+.-]+$/.test(term) ? term.replace(/\D/g, "") : term;
}

/** Exclui grupos, atendimentos ativos e duplicatas, sem alterar os registros do servidor. */
export function availableContactSuggestions(contacts: Contact[], activeTickets: Ticket[]): Contact[] {
  const active = activeTickets.filter((ticket) => ticket.status === "open" || ticket.status === "pending");
  const ids = new Set(active.map((ticket) => ticket.contact.id));
  const numbers = new Set(active.flatMap((ticket) => {
    if (ticket.isGroup || isGroupContact(ticket.contact)) return [];
    const number = normalizedTicketNumber(ticket.contact.number);
    return number ? [number] : [];
  }));
  const seenIds = new Set<number>();
  const seenNumbers = new Set<string>();
  return contacts.filter((contact) => {
    if (isGroupContact(contact) || ids.has(contact.id) || seenIds.has(contact.id)) return false;
    const number = normalizedTicketNumber(contact.number);
    if (number && (numbers.has(number) || seenNumbers.has(number))) return false;
    seenIds.add(contact.id);
    if (number) seenNumbers.add(number);
    return true;
  });
}

/** Grupos nunca usam seu JID como título quando o nome não está disponível. */
export function conversationContactName(contact: TicketContact, isGroup: boolean | undefined, groupLabel: string): string {
  return contact.name.trim() || (isGroup || isGroupContact(contact) ? groupLabel : `+${contact.number}`);
}