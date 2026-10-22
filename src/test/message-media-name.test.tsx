import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Message } from "@/modules/tickets/types";

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

import { MessageMedia, fileNameFromUrl } from "@/modules/tickets/components/MessageMedia";

afterEach(cleanup);

const mediaMessage = (overrides: Partial<Message>): Message => ({
  id: "1",
  ticketId: 1,
  body: "",
  fromMe: true,
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe("Message media file name", () => {
  it("fileNameFromUrl extracts the real file name from the URL", () => {
    expect(fileNameFromUrl("https://api.example.com/public/company1/proposta-orcamento.pdf")).toBe(
      "proposta-orcamento.pdf",
    );
  });

  it("shows the file name even when the body only carries the sender signature", () => {
    render(
      <MessageMedia
        message={mediaMessage({
          body: "*Thiago:*",
          mediaUrl: "https://api.example.com/public/company1/proposta-orcamento.pdf",
          mediaType: "application",
        })}
      />,
    );
    const chip = screen.getByRole("button", { name: "media.download" });
    expect(chip).toHaveTextContent("proposta-orcamento.pdf");
    expect(chip.textContent).not.toContain("Thiago");
  });

  it("clicking a PDF downloads it with the real file name instead of opening a tab", async () => {
    const url = "https://api.example.com/public/company1/contrato.pdf";
    const blob = new Blob(["pdf"], { type: "application/pdf" });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, blob: () => Promise.resolve(blob) });
    vi.stubGlobal("fetch", fetchMock);
    const createObjectURL = vi.fn().mockReturnValue("blob:mock");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL }));
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(
      <MessageMedia message={mediaMessage({ mediaUrl: url, mediaType: "application" })} />,
    );
    screen.getByRole("button", { name: "media.download" }).click();
    await vi.waitFor(() => expect(clickSpy).toHaveBeenCalled());

    expect(fetchMock).toHaveBeenCalledWith(url);
    expect(openSpy).not.toHaveBeenCalled();
    const anchor = clickSpy.mock.instances[0] as HTMLAnchorElement;
    expect(anchor.download).toBe("contrato.pdf");
    expect(anchor.href).toBe("blob:mock");

    clickSpy.mockRestore();
    openSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
