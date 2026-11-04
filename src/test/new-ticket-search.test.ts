import { describe, expect, it } from "vitest";
import { availableContactSuggestions, conversationContactName, isGroupContact, normalizeContactSearch } from "@/modules/tickets/contact-search";
import type { Contact } from "@/modules/contacts/types";
import type { Ticket, TicketContact } from "@/modules/tickets/types";

const contact = (id: number, number = "5511998765432", isGroup = false): Contact & TicketContact => ({ id, name: "Anvat Soluções", number, isGroup });
const ticket = (c: TicketContact, status: Ticket["status"] = "open"): Ticket => ({
  id: c.id, contact: c, status, lastMessage: "Oi", updatedAt: "2026-11-04T13:00:00Z", unreadMessages: 0, queue: null, user: null,
});

describe("normalizeContactSearch", () => {
  it("remove pontuação de telefone", () => {
    expect(normalizeContactSearch("(11) 98765-0001")).toBe("11987650001");
  });
  it("mantém busca por nome", () => {
    expect(normalizeContactSearch(" Ana Souza ")).toBe("Ana Souza");
  });
});

describe("sugestões de novos contatos", () => {
  it("exclui contatos marcados como grupo", () => {
    expect(availableContactSuggestions([contact(1, "123456789012345", true), contact(2)], []).map((c) => c.id)).toEqual([2]);
  });
  it("reconhece JID de grupo mesmo sem marcação", () => {
    expect(isGroupContact(contact(1, "120363123456789@g.us"))).toBe(true);
    expect(availableContactSuggestions([contact(1, "120363123456789@g.us")], [])).toEqual([]);
  });
  it("não sugere contato com mesmo ID de atendimento aguardando", () => {
    expect(availableContactSuggestions([contact(1)], [ticket(contact(1), "pending")])).toEqual([]);
  });
  it("não sugere contato duplicado por telefone formatado em atendimento aberto", () => {
    expect(availableContactSuggestions([contact(2, "+55 (11) 99876-5432")], [ticket(contact(1))])).toEqual([]);
  });
  it("reconhece telefone brasileiro sem nono dígito", () => {
    expect(availableContactSuggestions([contact(2, "551198765432")], [ticket(contact(1))])).toEqual([]);
  });
  it("remove duplicatas entre sugestões de contatos livres", () => {
    expect(availableContactSuggestions([contact(1), contact(2)], []).map((c) => c.id)).toEqual([1]);
  });
  it("permite iniciar novo atendimento de contato finalizado", () => {
    expect(availableContactSuggestions([contact(1)], [ticket(contact(1), "closed")]).map((c) => c.id)).toEqual([1]);
  });
  it("preserva contatos distintos sem número plausível", () => {
    expect(availableContactSuggestions([contact(1, ""), contact(2, "")], []).map((c) => c.id)).toEqual([1, 2]);
  });
});

describe("identificação de grupos", () => {
  it("usa nome do grupo, não seu identificador", () => {
    expect(conversationContactName(contact(1, "120363123456789@g.us", true), false, "Grupos")).toBe("Anvat Soluções");
  });
  it("grupo sem nome não apresenta número interno", () => {
    expect(conversationContactName({ ...contact(1, "120363123456789@g.us"), name: "" }, false, "Grupos")).toBe("Grupos");
  });
  it("considera também marcação de grupo no ticket", () => {
    expect(conversationContactName({ ...contact(1), name: "" }, true, "Grupos")).toBe("Grupos");
  });
  it("contato individual sem nome mantém telefone", () => {
    expect(conversationContactName({ ...contact(1), name: "" }, false, "Grupos")).toBe("+5511998765432");
  });
});
