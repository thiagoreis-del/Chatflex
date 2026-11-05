import { describe, expect, it } from "vitest";
import { shouldAutoAssignOnSend } from "@/modules/tickets/auto-assign";

const withUser = { status: "open" as const, user: { id: 7, name: "Ana" } };

describe("shouldAutoAssignOnSend", () => {
  it("assume ticket aguardando sem responsável ao enviar mensagem", () => {
    expect(shouldAutoAssignOnSend({ status: "pending", user: null }, 3)).toBe(true);
  });

  it("assume ticket aguardando mesmo com responsável anterior", () => {
    expect(shouldAutoAssignOnSend({ status: "pending", user: { id: 9, name: "B" } }, 3)).toBe(true);
  });

  it("assume ticket de grupo ao enviar mensagem", () => {
    expect(shouldAutoAssignOnSend({ status: "group" as "pending", user: null }, 3)).toBe(true);
  });

  it("assume ticket aberto sem responsável", () => {
    expect(shouldAutoAssignOnSend({ status: "open", user: null }, 3)).toBe(true);
  });

  it("não reatribui ticket aberto já assumido pelo próprio atendente", () => {
    expect(shouldAutoAssignOnSend(withUser, 7)).toBe(false);
  });

  it("não reatribui ticket aberto de outro atendente sem 'responder como'", () => {
    expect(shouldAutoAssignOnSend(withUser, 3)).toBe(false);
  });

  it("admin respondendo como outro usuário transfere o ticket para ele", () => {
    expect(shouldAutoAssignOnSend(withUser, 3, { id: 3 })).toBe(true);
  });

  it("sem remetente identificado nunca assume", () => {
    expect(shouldAutoAssignOnSend({ status: "pending", user: null }, null)).toBe(false);
    expect(shouldAutoAssignOnSend({ status: "open", user: null }, undefined)).toBe(false);
  });

  it("ticket finalizado não é assumido pelo envio", () => {
    expect(shouldAutoAssignOnSend({ status: "closed", user: withUser.user }, 7)).toBe(false);
  });
});
