import { describe, expect, it } from "vitest";
import { canAddConnection, canChangeToPlan, defaultPublicPlans } from "@/modules/plans/commercial";

describe("planos por conexão", () => {
  it("preços padrão: 1=R$99,90, 2=R$150, 3=R$200", () => {
    expect(defaultPublicPlans.map((p) => [p.connections, p.monthlyPrice])).toEqual([
      [1, 9990],
      [2, 15000],
      [3, 20000],
    ]);
  });
  it("plano de 2 WhatsApps é o mais escolhido", () => {
    expect(defaultPublicPlans.find((p) => p.recommended)?.connections).toBe(2);
  });
  it("bloqueia conexão acima do limite", () => {
    expect(canAddConnection(1, 1)).toBe(false);
    expect(canAddConnection(1, 2)).toBe(true);
  });
  it("bloqueia downgrade incompatível", () => {
    expect(canChangeToPlan(3, 1)).toBe(false);
    expect(canChangeToPlan(2, 3)).toBe(true);
  });
});
