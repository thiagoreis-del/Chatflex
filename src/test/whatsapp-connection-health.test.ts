import { describe, expect, it } from "vitest";
import { isConnectionDown } from "@/modules/whatsapp/connection-health";

describe("WhatsApp connection health", () => {
  it("marks disconnected and expired sessions as down", () => {
    expect(isConnectionDown("DISCONNECTED")).toBe(true);
    expect(isConnectionDown("TIMEOUT")).toBe(true);
  });

  it("does not alert while connecting or waiting for QR", () => {
    expect(isConnectionDown("CONNECTED")).toBe(false);
    expect(isConnectionDown("OPENING")).toBe(false);
    expect(isConnectionDown("PAIRING")).toBe(false);
    expect(isConnectionDown("PENDING")).toBe(false);
    expect(isConnectionDown("qrcode")).toBe(false);
  });
});
