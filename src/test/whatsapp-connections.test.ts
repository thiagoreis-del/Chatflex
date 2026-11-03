import { describe, expect, it } from "vitest";
import { normalizeConnectionsResponse } from "@/modules/whatsapp/api";

const connection = {
  id: 1,
  name: "Notasflex",
  status: "CONNECTED" as const,
  isDefault: true,
};

describe("WhatsApp connections response", () => {
  it("accepts a direct list", () => {
    expect(normalizeConnectionsResponse([connection])).toEqual([connection]);
  });

  it("accepts backend envelopes", () => {
    expect(normalizeConnectionsResponse({ whatsapps: [connection] })).toEqual([connection]);
    expect(normalizeConnectionsResponse({ data: [connection] })).toEqual([connection]);
    expect(normalizeConnectionsResponse({ records: [connection] })).toEqual([connection]);
  });

  it("rejects malformed data before the page tries to render it", () => {
    expect(() => normalizeConnectionsResponse({ whatsapps: null })).toThrow(
      "Invalid WhatsApp list response",
    );
  });
});
