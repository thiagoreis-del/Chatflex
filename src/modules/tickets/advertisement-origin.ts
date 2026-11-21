import { parseAdvertisement, type ParsedAdvertisement } from "./advertisement";
import type { Message, Ticket } from "./types";

/** Only incoming, public messages establish an advertising origin. */
export function ticketAdvertisement(
  ticket: Pick<Ticket, "lastMessage">,
  messages: readonly Message[] = [],
): ParsedAdvertisement | null {
  for (const message of messages) {
    if (message.fromMe || message.isPrivate) continue;
    const advertisement = parseAdvertisement(message.body);
    if (advertisement) return advertisement;
  }
  return parseAdvertisement(ticket.lastMessage);
}

export interface AdvertisementCacheEntry {
  queryKey: readonly unknown[];
  data: unknown;
}

/** Reads existing session data only; never fetches histories for the sidebar. */
export function cachedAdvertisements(
  entries: readonly AdvertisementCacheEntry[],
  scope: readonly [string | number, string | number],
): ReadonlyMap<number, ParsedAdvertisement> {
  const origins = new Map<number, ParsedAdvertisement>();
  for (const { queryKey: key, data } of entries) {
    if (
      key[0] !== "company" ||
      key[1] !== "tickets" ||
      key[2] !== scope[0] ||
      key[3] !== scope[1] ||
      !Array.isArray(data)
    )
      continue;
    if (key[4] === "messages" && typeof key[5] === "number") {
      const origin = ticketAdvertisement({ lastMessage: "" }, data as Message[]);
      if (origin) origins.set(key[5], origin);
    }
    if (key[4] === "list") {
      for (const ticket of data as Ticket[]) {
        const origin = parseAdvertisement(ticket.lastMessage);
        if (origin) origins.set(ticket.id, origin);
      }
    }
  }
  return origins;
}
