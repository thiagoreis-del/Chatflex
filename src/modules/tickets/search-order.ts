import type { Ticket } from "./types";

/** Envia o termo nos dois nomes aceitos pelo backend (`searchParam` é o lido por ListTicketsService). */
export function withSearchParams<T extends { search?: string }>(f: T): T & { searchParam?: string } {
  const s = f.search?.trim();
  return s ? { ...f, search: s, searchParam: s } : f;
}

const norm = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Salvaguarda local: nome, número ou última mensagem contém o termo. */
export function ticketMatchesSearch(t: Ticket, search: string): boolean {
  const q = norm(search).trim();
  if (!q) return true;
  const digits = q.replace(/\D/g, "");
  const name = norm(t.contact?.name);
  const last = norm(t.lastMessage);
  if (name.includes(q) || last.includes(q)) return true;
  return digits.length >= 3 && String(t.contact?.number ?? "").replace(/\D/g, "").includes(digits);
}

/** Conversas com quem já falou: mais recente primeiro. */
export function sortByRecent(list: Ticket[]): Ticket[] {
  const ts = (t: Ticket) => Date.parse(String(t.updatedAt ?? "")) || 0;
  return [...list].sort((a, b) => ts(b) - ts(a));
}
