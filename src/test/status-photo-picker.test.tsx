import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { StatusPublishPage } from "@/modules/whatsapp/pages/StatusPublishPage";
import type { StatusSchedule } from "@/modules/whatsapp/status";
import { apiDownload, apiRequest, apiUpload } from "@/shared/api/client";
import "@/shared/i18n";

vi.mock("@/shared/api/client", () => ({
  apiRequest: vi.fn(),
  apiDownload: vi.fn(),
  apiUpload: vi.fn(),
}));

afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

it("adds published photos from a search alongside an existing local photo", async () => {
  const entry: StatusSchedule = {
    id: "foto-publicada",
    caption: "Campanha de verão",
    filename: "campanha.jpg",
    publishAt: "2026-08-01T12:00:00Z",
    publishedAt: "2026-08-01T12:00:00Z",
    expiresAt: "2026-08-02T12:00:00Z",
    status: "published",
    errorCode: null,
    hasPhoto: true,
    canRemove: false,
  };
  const blob = new Blob(["image"], { type: "image/jpeg" });
  const stats = { page: 1, pageSize: 12, counts: { online: 0, scheduled: 0, library: 1 } };
  vi.mocked(apiRequest).mockImplementation(async (path) => {
    if (path === "/whatsapp") return [{ id: 6, name: "Notasflex", channel: "whatsapp" }] as never;
    const url = new URL(path, "https://example.test");
    const entries = url.searchParams.get("q") === "verão" ? [entry] : [];
    return { ...stats, entries, total: entries.length } as never;
  });
  vi.mocked(apiDownload).mockResolvedValue({ blob, filename: entry.filename });
  vi.stubGlobal(
    "URL",
    class extends URL {
      static override createObjectURL = () => "blob:test";
      static override revokeObjectURL = () => {};
    },
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const { container } = render(
    <QueryClientProvider client={client}>
      <StatusPublishPage />
    </QueryClientProvider>,
  );
  const newStatus = await screen.findByRole("button", { name: "Novo status" });
  await waitFor(() => expect(newStatus).toBeEnabled());
  fireEvent.click(newStatus);
  fireEvent.click(screen.getByRole("button", { name: "Adicionar fotos" }));
  const fileInput = container.querySelector('input[type="file"]')!;
  const click = vi.spyOn(fileInput as HTMLInputElement, "click");
  fireEvent.click(screen.getByRole("button", { name: "Enviar do dispositivo" }));
  expect(click).toHaveBeenCalledOnce();
  fireEvent.change(fileInput, {
    target: { files: [new File(["local"], "local.png", { type: "image/png" })] },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Legenda (opcional)" }), {
    target: { value: "Minha legenda" },
  });

  fireEvent.click(screen.getByRole("button", { name: "Adicionar fotos" }));
  const dialog = within(screen.getByRole("dialog"));
  fireEvent.change(dialog.getByRole("searchbox", { name: "Buscar fotos publicadas" }), {
    target: { value: "verão" },
  });
  fireEvent.click(dialog.getByRole("button", { name: "Buscar" }));
  const saved = await dialog.findByRole("button", { name: /Campanha de verão/ });
  await waitFor(() => expect(saved).toBeEnabled());
  fireEvent.click(saved);
  fireEvent.click(dialog.getByRole("button", { name: "Adicionar 1 foto ao rascunho" }));
  expect(screen.getByText("2 de 20 fotos")).toBeVisible();
  expect(screen.getByDisplayValue("Minha legenda")).toBeVisible();
  expect(screen.getByDisplayValue(entry.caption)).toBeVisible();
  expect(apiRequest).toHaveBeenCalledWith(
    "/whatsapp/6/status/dashboard?view=published&page=1&q=ver%C3%A3o",
    expect.anything(),
  );
  expect(apiDownload).toHaveBeenCalledWith(
    "/whatsapp/6/status/schedules/foto-publicada/photo",
    expect.anything(),
  );
  expect(apiUpload).not.toHaveBeenCalled();
});
