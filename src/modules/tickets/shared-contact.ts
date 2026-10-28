import { contactsQuery, createContact } from "@/modules/contacts/api";
import { QueryClient } from "@tanstack/react-query";
import { createTicket, ticketsQuery } from "./api";
import type { ParsedVCard } from "./vcard";
import type { Ticket } from "./types";

/** Preserve country codes; never invent one for a shared phone number. */
export function sharedContactNumber(phone: string | null): string | null {
  if (!phone || !/^(?:tel:)?\+?[\d\s().-]+$/i.test(phone.trim())) return null;
  const number = phone.replace(/\D/g, "");
  return number.length >= 7 && number.length <= 15 ? number : null;
}

/** Uses only session-scoped APIs; never changes an existing ticket's assignment. */
export async function startSharedContactConversation(
  contact: ParsedVCard,
  whatsappId: number,
  userId?: number,
): Promise<Ticket> {
  const number = sharedContactNumber(contact.phone);
  if (!number || !Number.isSafeInteger(whatsappId) || whatsappId <= 0) {
    throw new Error("Invalid shared contact or connection");
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  for (const status of ["open", "pending"] as const) {
    const options = ticketsQuery({ status, search: number });
    const tickets = await client.fetchQuery(options);
    const existing = tickets.find((ticket) =>
      !ticket.isGroup && !ticket.contact.isGroup &&
      sharedContactNumber(ticket.contact.number) === number && ticket.whatsapp?.id === whatsappId,
    );
    if (existing) return existing;
  }
  let page = 1;
  let resolved;
  while (true) {
    const options = contactsQuery({ search: number, page });
    const result = await client.fetchQuery(options);
    resolved = result.data.find((item) => !item.isGroup && sharedContactNumber(item.number) === number);
    if (resolved || !result.data.length || page * result.pageSize >= result.total) break;
    page += 1;
  }
  resolved ??= await createContact({ name: contact.name.trim() || number, number, email: "", tags: [] });
  const ticket = await createTicket(
    { contactId: resolved.id, whatsappId, userId },
    { id: resolved.id, name: resolved.name, number: resolved.number },
  );
  if (!Number.isSafeInteger(ticket.id) || ticket.id <= 0) throw new Error("Invalid ticket response");
  return ticket;
}