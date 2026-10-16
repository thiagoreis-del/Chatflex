import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tokenStore } from "@/shared/auth/token-store";
import { apiRequest, setUnauthorizedHandler } from "@/shared/api/client";

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Pedidos em voo sobrevivem à troca de token", () => {
  beforeEach(() => {
    tokenStore.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("refaz o pedido com o token novo em vez de deslogar", async () => {
    const unauthorized = vi.fn();
    setUnauthorizedHandler(unauthorized);

    let calls = 0;
    const fetchMock = vi.fn(async () => {
      calls += 1;
      if (calls === 1) {
        // Simula a troca de sessão (ex.: sair da empresa) durante o pedido.
        tokenStore.set("token-novo");
        return jsonResponse({ message: "ERR_SESSION_EXPIRED" }, 401);
      }
      return jsonResponse({ ok: true }, 200);
    });
    vi.stubGlobal("fetch", fetchMock);

    tokenStore.set("token-antigo");
    const result = await apiRequest<{ ok: boolean }>("/tickets", {
      headers: undefined,
    } as never);
    expect(result).toEqual({ ok: true });
    expect(calls).toBe(2);
    expect(unauthorized).not.toHaveBeenCalled();
    expect(tokenStore.get()).toBe("token-novo");
  });

  it("desloga quando o token atual falha de verdade e o refresh não salva", async () => {
    const unauthorized = vi.fn();
    setUnauthorizedHandler(unauthorized);

    const fetchMock = vi.fn(async () => jsonResponse({ message: "ERR_SESSION_EXPIRED" }, 401));
    vi.stubGlobal("fetch", fetchMock);

    tokenStore.set("token-atual");
    await expect(apiRequest("/tickets")).rejects.toThrow();
    expect(unauthorized).toHaveBeenCalled();
  });
});
