import { beforeEach, describe, expect, it } from "vitest";
import { hideMessageForMe, listHiddenMessages } from "@/modules/internal-chat/hidden";

describe("excluir mensagem interna para mim", () => {
  beforeEach(() => window.localStorage.clear());

  it("oculta a mensagem só para a empresa e o usuário", () => {
    hideMessageForMe(1, 10, "99");
    expect(listHiddenMessages(1, 10)).toEqual(["99"]);
    expect(listHiddenMessages(2, 10)).toEqual([]);
    expect(listHiddenMessages(1, 11)).toEqual([]);
  });

  it("não duplica nem perde ocultações anteriores", () => {
    hideMessageForMe(1, 10, "1");
    hideMessageForMe(1, 10, "2");
    hideMessageForMe(1, 10, "1");
    expect(listHiddenMessages(1, 10)).toEqual(["1", "2"]);
  });

  it("tolera conteúdo inválido no armazenamento", () => {
    window.localStorage.setItem("chatflex.internal-hidden.1.10", "não-é-json");
    expect(listHiddenMessages(1, 10)).toEqual([]);
  });
});
