import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_TICKET_LAYOUT, parseTicketLayout, saveTicketLayout, TICKET_LAYOUT_KEY } from "@/modules/tickets/workspace-layout";

afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

describe("ticket workspace preference", () => {
  it("uses a 35/65 default when no preference is available", () => {
    expect(parseTicketLayout(null) ?? DEFAULT_TICKET_LAYOUT).toEqual({ list: 35, conversation: 65 });
  });
  it("restores the user's chosen size", () => {
    saveTicketLayout({ list: 47, conversation: 53 }, { isUserInteraction: true });
    expect(parseTicketLayout(localStorage.getItem(TICKET_LAYOUT_KEY))).toEqual({ list: 47, conversation: 53 });
  });
  it("rejects malformed, invalid or out-of-range sizes", () => {
    for (const raw of ["{", "null", "[]", '{"list":24,"conversation":76}', '{"list":61,"conversation":39}', '{"list":40,"conversation":40}', '{"list":"40","conversation":60}']) {
      expect(parseTicketLayout(raw)).toBeUndefined();
    }
  });
  it("does not overwrite the preference during window resize or initial mount", () => {
    saveTicketLayout({ list: 45, conversation: 55 }, { isUserInteraction: true });
    saveTicketLayout({ list: 35, conversation: 65 }, { isUserInteraction: false });
    expect(parseTicketLayout(localStorage.getItem(TICKET_LAYOUT_KEY))).toEqual({ list: 45, conversation: 55 });
  });
  it("keeps resizing usable when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(() => saveTicketLayout({ list: 45, conversation: 55 }, { isUserInteraction: true })).not.toThrow();
  });
});