import { describe, expect, it } from "vitest";
import { confirmStatusPublish, mergeStatusFiles } from "@/modules/whatsapp/status";

const img = (n: number) => new File(["x"], `f${n}.jpg`, { type: "image/jpeg" });

describe("lote de Status", () => {
  it("aceita no máximo 20 fotos", () => {
    const r = mergeStatusFiles(
      [],
      Array.from({ length: 25 }, (_, i) => img(i)),
    );
    expect(r.items).toHaveLength(20);
    expect(r.overflow).toBe(5);
  });
  it("rejeita arquivos que não são imagem", () => {
    const r = mergeStatusFiles([], [img(1), new File(["x"], "a.pdf", { type: "application/pdf" })]);
    expect(r.items).toHaveLength(1);
    expect(r.rejectedNonImage).toBe(1);
  });
  it("não confunde HTTP aceito com publicação confirmada", () => {
    expect(() => confirmStatusPublish(undefined, 1)).toThrow("STATUS_NOT_CONFIRMED");
    expect(() => confirmStatusPublish({ success: true }, 1)).toThrow("STATUS_NOT_CONFIRMED");
  });
  it("confirma somente o lote completo", () => {
    expect(confirmStatusPublish({ published: 2, failed: 0 }, 2)).toEqual({ published: 2 });
    expect(() =>
      confirmStatusPublish({ results: [{ success: true }, { error: "falhou" }] }, 2),
    ).toThrow("STATUS_PARTIALLY_CONFIRMED");
  });
});
