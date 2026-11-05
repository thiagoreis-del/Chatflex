import { describe, expect, it } from "vitest";
import {
  encodeReplyBody,
  parseReplyBody,
  quoteSnippet,
  stripQuote,
} from "@/modules/internal-chat/quote";

describe("citação de resposta do chat interno", () => {
  it("codifica e recupera remetente, id e trecho", () => {
    const raw = encodeReplyBody({ id: "42", sender: "Bruna", snippet: "chegou código?" }, "sim, chegou");
    const parsed = parseReplyBody(raw);
    expect(parsed.quote).toEqual({ id: "42", sender: "Bruna", snippet: "chegou código?" });
    expect(parsed.body).toBe("sim, chegou");
  });

  it("preserva acentos e emojis no remetente e no trecho", () => {
    const raw = encodeReplyBody({ id: "7", sender: "João 🚀", snippet: "reunião às 14h" }, "ok");
    expect(parseReplyBody(raw).quote).toEqual({ id: "7", sender: "João 🚀", snippet: "reunião às 14h" });
  });

  it("mantém o corpo intacto quando não há marcador", () => {
    expect(parseReplyBody("mensagem comum").quote).toBeNull();
    expect(parseReplyBody("⟦reply:invalido⟧\ntexto").body).toBe("⟦reply:invalido⟧\ntexto");
  });

  it("remove o marcador para prévias e encaminhamento", () => {
    const raw = encodeReplyBody({ id: "1", sender: "Ana", snippet: "oi" }, "resposta");
    expect(stripQuote(raw)).toBe("resposta");
    expect(stripQuote("sem marcador")).toBe("sem marcador");
  });

  it("resume o trecho em uma linha com limite", () => {
    expect(quoteSnippet("linha um\nlinha   dois")).toBe("linha um linha dois");
    expect(quoteSnippet("x".repeat(200)).length).toBeLessThanOrEqual(140);
  });

  it("não encadeia marcador de uma mensagem já respondida", () => {
    const primeira = encodeReplyBody({ id: "1", sender: "Ana", snippet: "oi" }, "resposta");
    expect(quoteSnippet(primeira)).toBe("resposta");
  });
});
