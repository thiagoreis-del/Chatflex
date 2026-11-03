import { describe, expect, it } from "vitest";
import { deduplicateActiveTickets, ticketConversationKey } from "@/modules/tickets/ticket-identity";
import type { Ticket } from "@/modules/tickets/types";

const ticket = ({ id, ...overrides }: Partial<Ticket> & Pick<Ticket, "id">): Ticket => ({
  id,
  status: "open",
  lastMessage: "",
  updatedAt: "2026-10-30T12:00:00.000Z",
  unreadMessages: 0,
  contact: { id: 1, name: "Altair Rosa", number: "55 (45) 99999-0000" },
  queue: null,
  user: null,
  whatsapp: { id: 7, name: "Notasflex" },
  ...overrides,
});

describe("ticket conversation identity", () => {
  it("une tickets do mesmo número e da mesma conexão, mesmo com contatos distintos", () => {
    const older = ticket({ id: 10, contact: { id: 1, name: "Altair", number: "5545999990000" } });
    const newer = ticket({
      id: 11,
      updatedAt: "2026-10-30T12:01:00.000Z",
      contact: { id: 2, name: "Altair Rosa", number: "+55 45 99999-0000" },
    });
    expect(deduplicateActiveTickets([older, newer])).toEqual([newer]);
  });

  it("preserva o mesmo contato em conexões diferentes", () => {
    const first = ticket({ id: 10 });
    const second = ticket({ id: 11, whatsapp: { id: 8, name: "Comercial" } });
    expect(deduplicateActiveTickets([first, second])).toHaveLength(2);
    expect(ticketConversationKey(first)).not.toBe(ticketConversationKey(second));
  });

  it("une a forma brasileira com e sem o nono dígito", () => {
    const oldFormat = ticket({
      id: 10,
      contact: { id: 1, name: "Alliance", number: "554532211234" },
    });
    const newFormat = ticket({
      id: 11,
      updatedAt: "2026-10-30T12:01:00.000Z",
      contact: { id: 2, name: "Alliance Contabilidade", number: "5545932211234" },
    });
    expect(deduplicateActiveTickets([oldFormat, newFormat])).toEqual([newFormat]);
  });

  it("une identidade parcial quando só um registro informa a conexão", () => {
    const partial = ticket({ id: 10, whatsapp: null });
    const complete = ticket({ id: 11, updatedAt: "2026-10-30T12:01:00.000Z" });
    expect(deduplicateActiveTickets([partial, complete])).toEqual([complete]);
  });

  it("não atribui identidade parcial quando há mais de uma conexão possível", () => {
    const partial = ticket({ id: 10, whatsapp: null });
    const first = ticket({ id: 11, whatsapp: { id: 7, name: "Notasflex" } });
    const second = ticket({ id: 12, whatsapp: { id: 8, name: "Comercial" } });
    expect(deduplicateActiveTickets([partial, first, second])).toHaveLength(3);
  });

  it("não agrupa grupos nem números inválidos", () => {
    const groupA = ticket({ id: 10, isGroup: true });
    const groupB = ticket({ id: 11, isGroup: true });
    const invalidA = ticket({ id: 12, contact: { id: 3, name: "A", number: "sem-numero" } });
    const invalidB = ticket({ id: 13, contact: { id: 4, name: "B", number: "sem-numero" } });
    expect(deduplicateActiveTickets([groupA, groupB, invalidA, invalidB])).toHaveLength(4);
  });
});
