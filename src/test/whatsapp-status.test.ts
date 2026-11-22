import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiUpload } from "@/shared/api/client";
import { mergeStatusFiles, publishStatusBatch } from "@/modules/whatsapp/status";

vi.mock("@/shared/api/client", () => ({ apiUpload: vi.fn(), apiRequest: vi.fn() }));

const image = (n: number) => new File(["x"], `f${n}.jpg`, { type: "image/jpeg" });
const photos = (count: number) =>
  mergeStatusFiles(
    [],
    Array.from({ length: count }, (_, index) => image(index)),
  ).items;

describe("publicação de fotos no Status", () => {
  beforeEach(() => vi.resetAllMocks());

  it("limita o lote a 20 fotos e exclui formatos inválidos", () => {
    const result = mergeStatusFiles(
      [],
      [
        ...Array.from({ length: 21 }, (_, index) => image(index)),
        new File(["x"], "a.pdf", { type: "application/pdf" }),
      ],
    );
    expect(result.items).toHaveLength(20);
    expect(result.overflow).toBe(1);
    expect(result.rejectedNonImage).toBe(1);
  });

  it("envia a foto à conexão escolhida para resolução automática do público", async () => {
    vi.mocked(apiUpload).mockResolvedValueOnce({ published: 1, id: "server-ack" });
    const [photo] = photos(1);
    photo!.caption = " Foto da empresa ";
    const published = vi.fn();
    await publishStatusBatch(6, [photo!], vi.fn(), published);
    const [route, form] = vi.mocked(apiUpload).mock.calls[0]!;
    expect(route).toBe("/whatsapp/6/status");
    expect(form.get("contactIds")).toBeNull();
    expect(form.get("requestId")).toBe(photo!.id);
    expect(form.get("caption")).toBe("Foto da empresa");
    expect(published).toHaveBeenCalledExactlyOnceWith(photo!.id);
  });

  it("para em uma foto sem confirmação e mantém as confirmações anteriores", async () => {
    vi.mocked(apiUpload)
      .mockResolvedValueOnce({ published: 1, id: "server-ack" })
      .mockResolvedValueOnce({ success: true });
    const items = photos(3);
    const published = vi.fn();
    await expect(publishStatusBatch(6, items, vi.fn(), published)).rejects.toMatchObject({
      code: "ERR_STATUS_UNCONFIRMED",
      photoId: items[1]!.id,
    });
    expect(published).toHaveBeenCalledExactlyOnceWith(items[0]!.id);
    expect(apiUpload).toHaveBeenCalledTimes(2);
  });

  it("envia o horário e confirma o agendamento sem exigir confirmação de publicação", async () => {
    vi.mocked(apiUpload).mockResolvedValueOnce({ scheduled: 1, id: "agenda-id" });
    const items = photos(1);
    const published = vi.fn();
    const date = "2027-01-01T12:30:00.000Z";
    await publishStatusBatch(6, items, vi.fn(), published, date);
    expect(vi.mocked(apiUpload).mock.calls[0]?.[1].get("publishAt")).toBe(date);
    expect(published).toHaveBeenCalledExactlyOnceWith(items[0]!.id);
  });
});
