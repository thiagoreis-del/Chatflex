import { describe, expect, it } from "vitest";
import {
  matchesAttendantFilter,
  outgoingMessageAttendant,
  selectedReplyUserId,
  ticketNeedsOutgoingAssignment,
} from "../modules/tickets/attendant-selection";

describe("seleção de atendente pelo administrador", () => {
  it("mantém aguardando sem responsável ao selecionar outro atendente", () => {
    expect(matchesAttendantFilter({ status: "pending", user: null }, "12", "7", true)).toBe(true);
    expect(matchesAttendantFilter({ status: "open", user: null }, "12", "7", true)).toBe(false);
  });
  it("mostra conversas do escolhido e não de outro atendente", () => {
    expect(
      matchesAttendantFilter({ status: "open", user: { id: 12, name: "Ana" } }, "12", "7", true),
    ).toBe(true);
    expect(
      matchesAttendantFilter({ status: "pending", user: { id: 8, name: "João" } }, "12", "7", true),
    ).toBe(false);
  });
  it("não amplia os filtros Meus e Sem atendente", () => {
    expect(matchesAttendantFilter({ status: "pending", user: null }, "mine", "7", true)).toBe(
      false,
    );
    expect(
      matchesAttendantFilter(
        { status: "pending", user: { id: 12, name: "Ana" } },
        "none",
        "7",
        true,
      ),
    ).toBe(false);
  });
  it("seleciona a assinatura apenas para administradores", () => {
    expect(selectedReplyUserId("12", true)).toBe(12);
    expect(selectedReplyUserId("12", false)).toBeNull();
    expect(matchesAttendantFilter({ status: "pending", user: null }, "12", "7", false)).toBe(false);
  });
  it("volta para a assinatura própria nos filtros gerais", () => {
    for (const filter of ["all", "mine", "none", "0", "invalid"]) {
      expect(selectedReplyUserId(filter, true)).toBeNull();
    }
  });

  it("abre e atribui um aguardando mesmo quando ele já tem usuário", () => {
    expect(
      ticketNeedsOutgoingAssignment({ status: "pending", user: { id: 7, name: "Thiago" } }, 7),
    ).toBe(true);
    expect(
      ticketNeedsOutgoingAssignment({ status: "open", user: { id: 7, name: "Thiago" } }, 7),
    ).toBe(false);
    expect(
      ticketNeedsOutgoingAssignment({ status: "open", user: { id: 8, name: "Bruna" } }, 7),
    ).toBe(true);
  });

  it("preserva o autor gravado na assinatura da mensagem", () => {
    expect(outgoingMessageAttendant("*Bruna:*\nOlá", "Thiago")).toBe("Bruna");
    expect(outgoingMessageAttendant("Áudio", "Bruna")).toBe("Bruna");
  });
});
