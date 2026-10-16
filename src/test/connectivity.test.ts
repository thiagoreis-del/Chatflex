import { describe, expect, it } from "vitest";
import {
  applyProbeResult,
  applySuccess,
  bannerKind,
  FAILURE_THRESHOLD,
  type Connectivity,
} from "@/shared/connectivity/connectivity";

const base: Connectivity = {
  internet: "unknown",
  api: "unknown",
  failures: 0,
  lastCheckedAt: null,
  lastError: null,
  lastOkAt: null,
};

describe("connectivity: tolerância a falhas momentâneas", () => {
  it("uma única falha não declara a API fora nem mostra aviso", () => {
    const next = applyProbeResult({ ...base, api: "online", internet: "online" }, false, "x");
    expect(next.api).toBe("online");
    expect(next.failures).toBe(1);
    expect(bannerKind(next)).toBeNull();
  });

  it(`só declara offline após ${FAILURE_THRESHOLD} falhas consecutivas`, () => {
    let state: Connectivity = { ...base, internet: "online" };
    for (let i = 0; i < FAILURE_THRESHOLD - 1; i++) state = applyProbeResult(state, false);
    expect(state.api).not.toBe("offline");
    state = applyProbeResult(state, false);
    expect(state.api).toBe("offline");
  });

  it("uma sonda com sucesso zera as falhas e remove o aviso", () => {
    let state: Connectivity = { ...base, internet: "online" };
    for (let i = 0; i < FAILURE_THRESHOLD; i++) state = applyProbeResult(state, false);
    expect(bannerKind(state)).toBe("backend");
    state = applyProbeResult(state, true);
    expect(state.api).toBe("online");
    expect(state.failures).toBe(0);
    expect(bannerKind(state)).toBeNull();
  });
});

describe("connectivity: diferenciação dos três estados", () => {
  it("navegador sem internet com API confirmada fora mostra aviso de internet", () => {
    expect(bannerKind({ ...base, internet: "offline", api: "offline" })).toBe("internet");
  });

  it("navigator.onLine falso sozinho (API ainda não confirmada) não mostra aviso", () => {
    expect(bannerKind({ ...base, internet: "offline", api: "unknown" })).toBeNull();
  });

  it("navegador online com API fora mostra aviso de backend", () => {
    expect(bannerKind({ ...base, internet: "online", api: "offline" })).toBe("backend");
  });

  it("API online nunca mostra aviso, mesmo se o navegador diz estar offline", () => {
    expect(bannerKind({ ...base, internet: "offline", api: "online" })).toBeNull();
  });

  it("queda apenas do WebSocket não gera aviso (bannerKind não olha o socket)", () => {
    // O estado de socket nem faz parte de Connectivity: só internet e api contam.
    expect(bannerKind({ ...base, internet: "online", api: "online" })).toBeNull();
  });
});

describe("connectivity: tráfego real evita aviso preso", () => {
  it("resposta real recente da API impede declarar offline por sondas falhas", () => {
    const now = 1_000_000;
    let state: Connectivity = { ...base, api: "online", internet: "online", lastOkAt: now - 5_000 };
    for (let i = 0; i < FAILURE_THRESHOLD + 2; i++) state = applyProbeResult(state, false, "x", now);
    expect(state.api).toBe("online");
    expect(bannerKind(state)).toBeNull();
  });

  it("sem tráfego recente, falhas consecutivas declaram offline", () => {
    const now = 1_000_000;
    let state: Connectivity = { ...base, internet: "online", lastOkAt: now - 60_000 };
    for (let i = 0; i < FAILURE_THRESHOLD; i++) state = applyProbeResult(state, false, "x", now);
    expect(state.api).toBe("offline");
  });

  it("um sucesso real remove o aviso e marca internet online", () => {
    const down: Connectivity = { ...base, internet: "offline", api: "offline", failures: 3 };
    const up = applySuccess(down);
    expect(bannerKind(up)).toBeNull();
    expect(up.internet).toBe("online");
    expect(up.failures).toBe(0);
  });
});
