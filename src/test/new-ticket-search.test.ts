import { describe, expect, it } from "vitest";
import { normalizeContactSearch } from "@/modules/tickets/components/NewTicketSuggestions";

describe("normalizeContactSearch", () => {
  it("remove pontuação de telefone", () => {
    expect(normalizeContactSearch("(11) 98765-0001")).toBe("11987650001");
  });
  it("mantém busca por nome", () => {
    expect(normalizeContactSearch(" Ana Souza ")).toBe("Ana Souza");
  });
});
