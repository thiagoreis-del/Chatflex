import { describe, expect, it } from "vitest";
import { normalizePdfFile, normalizeUploadFile } from "@/shared/upload/pdf-file";

describe("PDF upload identification", () => {
  it("identifies STOCK_WEST_S.A as PDF despite its missing extension and generic MIME", async () => {
    const file = new File(["%PDF-1.3\ncontent"], "STOCK_WEST_S.A", {
      type: "application/octet-stream",
    });
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

describe("media upload normalization", () => {
  it("sanitizes an edited PNG name and trusts its header", async () => {
    const png = new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2])],
      "{8730C342-B304}-editada.bin",
      { type: "application/octet-stream" },
    );
    const result = await normalizeUploadFile(png);
    expect(result.name).toBe("8730C342-B304-editada.png");
    expect(result.type).toBe("image/png");
    expect(result.size).toBe(png.size);
  });

  it("normalizes JPEG MIME and extension", async () => {
    const jpeg = new File([new Uint8Array([0xff, 0xd8, 0xff, 1])], "foto.PNG", {
      type: "image/png",
    });
    const result = await normalizeUploadFile(jpeg);
    expect(result.name).toBe("foto.jpg");
    expect(result.type).toBe("image/jpeg");
  });
});
