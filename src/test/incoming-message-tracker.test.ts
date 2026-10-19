import { describe, expect, it } from "vitest";
import { IncomingMessageTracker } from "@/modules/tickets/incoming-message-tracker";
import type { Message } from "@/modules/tickets/types";

const started = Date.parse("2026-10-15T11:17:00Z");
const message: Message = {
  id: "new",
  ticketId: 1,
  body: "Olá",
  fromMe: false,
  createdAt: "2026-10-15T11:17:01Z",
};
describe("Incoming message alerts", () => {
  it("alerts once across Socket and polling", () => {
    const tracker = new IncomingMessageTracker(started);
    expect(tracker.accept(message)).toBe(true);
    expect(tracker.accept({ ...message })).toBe(false);
    expect(tracker.accept({ ...message, id: "next" })).toBe(true);
  });
  it("ignores history, outgoing messages, notes and invalid dates", () => {
    const tracker = new IncomingMessageTracker(started);
    for (const patch of [
      { createdAt: "2026-10-15T10:00:00Z" },
      { fromMe: true },
      { isPrivate: true },
      { createdAt: "invalid" },
    ]) {
      expect(tracker.accept({ ...message, ...patch })).toBe(false);
    }
  });
});
