import { describe, expect, it } from "vitest";
import { serviceState } from "@/modules/platform-admin/vps-health";

describe("serviceState", () => {
  it("not_configured nunca é offline (não gera alerta de queda)", () => {
    expect(serviceState("not_configured")).toBe("not_configured");
    expect(serviceState("not_configured")).not.toBe("offline");
  });

  it("reconhece online", () => {
    expect(serviceState("online")).toBe("online");
    expect(serviceState("CONNECTED")).toBe("online");
  });

  it("reconhece falha real confirmada", () => {
    expect(serviceState("offline")).toBe("offline");
    expect(serviceState("error")).toBe("offline");
  });

  it("status ausente ou desconhecido não é falha", () => {
    expect(serviceState(null)).toBe("unknown");
    expect(serviceState(undefined)).toBe("unknown");
    expect(serviceState("starting")).toBe("unknown");
  });
});
