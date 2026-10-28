import { describe, expect, it, beforeEach, vi } from "vitest";
import { isDownloaded, markDownloaded } from "@/modules/tickets/downloaded-media";

describe("selo de arquivo baixado para ouvir offline", () => {
  beforeEach(() => window.localStorage.clear());

  it("não marca arquivos que ainda não foram salvos", () => {
    expect(isDownloaded("https://api.example.com/audio1.ogg")).toBe(false);
  });

  it("marca o arquivo salvo e o reconhece como baixado", () => {
    markDownloaded("https://api.example.com/audio1.ogg");
    expect(isDownloaded("https://api.example.com/audio1.ogg")).toBe(true);
  });

  it("não marca outros arquivos ao salvar um", () => {
    markDownloaded("https://api.example.com/audio1.ogg");
    expect(isDownloaded("https://api.example.com/audio2.ogg")).toBe(false);
  });

  it("marca o mesmo arquivo apenas uma vez", () => {
    markDownloaded("https://api.example.com/audio1.ogg");
    markDownloaded("https://api.example.com/audio1.ogg");
    expect(JSON.parse(window.localStorage.getItem("chatflex.downloaded-media") ?? "[]")).toHaveLength(1);
  });

  it("não quebra quando o storage está indisponível", () => {
    const spy = vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => markDownloaded("https://api.example.com/audio3.ogg")).not.toThrow();
    spy.mockRestore();
  });
});
