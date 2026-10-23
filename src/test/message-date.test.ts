import { describe, expect, it } from "vitest";
import { messageDateLabel, messageDayKey, startsMessageDay } from "@/modules/tickets/message-date";

const labels = { today: "Hoje", yesterday: "Ontem" };
const now = new Date(2026, 9, 23, 13, 47);
const iso = (day: number, hour = 12) => new Date(2026, 9, day, hour).toISOString();

describe("conversation calendar dates", () => {
  it("labels today's messages", () => {
    expect(messageDateLabel(iso(23), labels, now)).toBe("Hoje");
  });
  it("labels yesterday across a month boundary", () => {
    expect(messageDateLabel(iso(31), labels, new Date(2026, 10, 1, 1))).toBe("Ontem");
  });
  it("shows a full date for older messages", () => {
    expect(messageDateLabel(iso(20), labels, now)).toBe("20/10/2026");
  });
  it("separates the first message and day changes, not messages on the same day", () => {
    expect(startsMessageDay(iso(23))).toBe(true);
    expect(startsMessageDay(iso(23), iso(22))).toBe(true);
    expect(startsMessageDay(iso(23, 18), iso(23, 8))).toBe(false);
  });
  it("does not invent a date for invalid timestamps", () => {
    expect(messageDayKey("invalid")).toBeNull();
    expect(messageDateLabel("invalid", labels, now)).toBeNull();
    expect(startsMessageDay("invalid")).toBe(false);
  });
});