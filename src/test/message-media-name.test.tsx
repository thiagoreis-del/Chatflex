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
});
