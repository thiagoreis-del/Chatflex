import { describe, expect, it } from "vitest";
import { sortByRecent, ticketMatchesSearch, withSearchParams } from "./search-order";
import type { Ticket } from "./types";

const tk = (id: number, name: string, updatedAt: string) =>
  ({ id, contact: { name, number: "5545999" + id }, updatedAt, lastMessage: "" }) as unknown as Ticket;

describe("busca de atendimentos", () => {
  it("envia searchParam junto com search", () => {
    expect(withSearchParams({ status: "open", search: " lj decor " })).toMatchObject({ search: "lj decor", searchParam: "lj decor" });
  });
  it("filtra quem não corresponde ao termo", () => {
    expect(ticketMatchesSearch(tk(1, "LJ Decor", ""), "lj decor")).toBe(true);
    expect(ticketMatchesSearch(tk(2, "Thiago Reis", ""), "lj decor")).toBe(false);
  });
  it("ordena o último falado primeiro", () => {
    const r = sortByRecent([tk(1, "a", "2026-01-01T10:00:00Z"), tk(2, "b", "2026-01-02T10:00:00Z")]);
    expect(r.map((t) => t.id)).toEqual([2, 1]);
  });
});
