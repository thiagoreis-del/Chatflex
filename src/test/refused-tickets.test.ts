import { describe, it, expect, beforeEach } from "vitest";
import {
  getRefusedHiddenIds,
  hideRefusedTicket,
  restoreRefusedTicket,
} from "../modules/tickets/refused";

describe("atendimentos recusados", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("oculta o ticket recusado para o atendente", () => {
    hideRefusedTicket("7", 42);
    expect(getRefusedHiddenIds("7").has(42)).toBe(true);
  });

  it("não afeta outros atendentes", () => {
    hideRefusedTicket("7", 42);
    expect(getRefusedHiddenIds("8").has(42)).toBe(false);
  });

  it("reexibe o ticket quando a recusa falha no servidor", () => {
    hideRefusedTicket("7", 42);
    restoreRefusedTicket("7", 42);
    expect(getRefusedHiddenIds("7").has(42)).toBe(false);
  });
});
