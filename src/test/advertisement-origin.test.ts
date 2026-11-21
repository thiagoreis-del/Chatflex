import { describe, expect, it } from "vitest";
import { cachedAdvertisements, ticketAdvertisement } from "@/modules/tickets/advertisement-origin";
import type { Message } from "@/modules/tickets/types";

const ad =
  "data:image/png;base64,aGVsbG8= | https://facebook.com/ad/123 | Gestão empresarial | Quero saber mais";
const message = (overrides: Partial<Message> = {}): Message => ({
  id: "incoming-ad",
  ticketId: 42,
  body: ad,
  fromMe: false,
  createdAt: "2026-11-21T13:00:00Z",
  ...overrides,
});

describe("advertising lead origin", () => {
  it("identifies an ad in the ticket preview", () => {
    expect(ticketAdvertisement({ lastMessage: ad })?.title).toBe("Gestão empresarial");
  });
  it("keeps the origin when newer messages are ordinary text", () => {
    expect(
      ticketAdvertisement({ lastMessage: "Obrigado" }, [
        message(),
        message({ id: "later", body: "Obrigado" }),
      ])?.sourceUrl,
    ).toBe("https://facebook.com/ad/123");
  });
  it("does not classify an outgoing advertisement as an incoming lead", () => {
    expect(ticketAdvertisement({ lastMessage: "ok" }, [message({ fromMe: true })])).toBeNull();
  });
  it("does not classify private notes as leads", () => {
    expect(ticketAdvertisement({ lastMessage: "ok" }, [message({ isPrivate: true })])).toBeNull();
  });
  it("ignores ordinary text and maps", () => {
    expect(ticketAdvertisement({ lastMessage: "Lead de anúncio" })).toBeNull();
    expect(
      ticketAdvertisement({
        lastMessage: ad.replace(
          "https://facebook.com/ad/123",
          "https://maps.google.com/maps?q=1,2",
        ),
      }),
    ).toBeNull();
  });
  it("uses only the current company and user message caches", () => {
    const entries = [
      { queryKey: ["company", "tickets", 1, 7, "messages", 42], data: [message()] },
      { queryKey: ["company", "tickets", 2, 7, "messages", 43], data: [message({ ticketId: 43 })] },
      { queryKey: ["company", "tickets", 1, 8, "messages", 44], data: [message({ ticketId: 44 })] },
    ];
    expect([...cachedAdvertisements(entries, [1, 7]).keys()]).toEqual([42]);
    expect(cachedAdvertisements(entries, [3, 7]).size).toBe(0);
  });
  it("finds list previews but ignores unscoped notification caches", () => {
    expect([
      ...cachedAdvertisements(
        [
          {
            queryKey: ["company", "tickets", 1, 7, "list", {}],
            data: [{ id: 42, lastMessage: ad }],
          },
          {
            queryKey: ["company", "tickets", "incoming", "1"],
            data: [{ id: 43, lastMessage: ad }],
          },
        ],
        [1, 7],
      ).keys(),
    ]).toEqual([42]);
  });
});
