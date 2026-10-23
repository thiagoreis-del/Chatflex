import { describe, expect, it } from "vitest";
import { normalizePdfFile } from "@/shared/upload/pdf-file";

describe("PDF upload identification", () => {
  it("identifies STOCK_WEST_S.A as PDF despite its missing extension and generic MIME", async () => {
    const file = new File(["%PDF-1.3\ncontent"], "STOCK_WEST_S.A", { type: "application/octet-stream" });
    const result = await normalizePdfFile(file);
    expect(result.name).toBe("STOCK_WEST_S.A.pdf");
    expect(result.type).toBe("application/pdf");
    expect(result.size).toBe(file.size);
  });
  it("replaces a mistaken BIN extension for a PDF", async () => {
    const result = await normalizePdfFile(new File(["%PDF-1.7"], "document.bin"));
    expect(result.name).toBe("document.pdf");
    expect(result.type).toBe("application/pdf");
  });
  it("keeps an already correctly identified PDF", async () => {
    const file = new File(["%PDF-1.3"], "document.PDF", { type: "application/pdf" });
    expect(await normalizePdfFile(file)).toBe(file);
  });
  it("does not relabel other files as PDF", async () => {
    const file = new File(["other bytes"], "document.bin", { type: "application/octet-stream" });
    expect(await normalizePdfFile(file)).toBe(file);
  });
});