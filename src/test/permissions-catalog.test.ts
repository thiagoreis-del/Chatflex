import { describe, expect, it } from "vitest";
import { can } from "@/shared/permissions/catalog";
import type { AuthenticatedUser } from "@/shared/auth/types";

const base: AuthenticatedUser = {
  id: "1",
  name: "A",
  email: "a@a.com",
  role: "agent",
  companyId: "1",
  permissions: [],
};

describe("permissões", () => {
  it("atendente não vê Conexões por padrão", () => {
    expect(can(base, "module.connections")).toBe(false);
  });
  it("atendente vê Atendimento", () => {
    expect(can(base, "module.tickets")).toBe(true);
  });
  it("atendente vê Publicar Status", () => {
    expect(can(base, "module.status")).toBe(true);
  });
  it("admin vê Conexões", () => {
    expect(can({ ...base, role: "company_admin" }, "module.connections")).toBe(true);
  });
  it("permissões do servidor têm prioridade", () => {
    expect(can({ ...base, permissions: ["module.connections"] }, "module.tickets")).toBe(false);
  });
});
