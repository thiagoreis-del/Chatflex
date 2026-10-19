import type { Ticket } from "./types";

export function selectedReplyUserId(filter: string, isAdmin: boolean): number | null {
  if (!isAdmin || !/^\d+$/.test(filter)) return null;
  const id = Number(filter);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
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
