import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCompany } from "@/modules/companies/api";
import { createCompanySchema } from "@/modules/companies/schemas";
import { apiRequest } from "@/shared/api/client";

vi.mock("@/shared/api/client", () => ({ apiRequest: vi.fn() }));
vi.mock("@/shared/config/env", () => ({ env: { useMocks: false } }));

const values = {
  legalName: "Empresa Teste",
  tradeName: "Empresa Teste",
  document: "11222333000181",
  email: "empresa@example.test",
  phone: "45 99998-5424",
  responsibleName: "Administrador",
  planId: "3",
  trialDays: 15,
  userLimit: 1,
  connectionLimit: 1,
  storageLimitMb: 1024,
  status: "onboarding",
  internalNotes: "",
  firstAdmin: {
    name: "Administrador",
    email: "admin@example.test",
    phone: "",
    password: "TesteSeguro123",
    confirmPassword: "TesteSeguro123",
  },
};

describe("company initial administrator credentials", () => {
  beforeEach(() => vi.mocked(apiRequest).mockReset());

  it("requires an initial password instead of assuming a server default", () => {
    expect(
      createCompanySchema.safeParse({
        ...values,
        firstAdmin: {
          ...values.firstAdmin,
          password: "",
          confirmPassword: "",
        },
      }).success,
    ).toBe(false);
  });

  it("rejects mismatched confirmation on the confirmation field", () => {
    const result = createCompanySchema.safeParse({
      ...values,
      firstAdmin: {
        ...values.firstAdmin,
        confirmPassword: "OutraSenha123",
      },
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(
        result.error.issues.some((issue) => issue.path.join(".") === "firstAdmin.confirmPassword"),
      ).toBe(true);
  });

  it("accepts the formatted phone and strips confirmation from output", () => {
    const output = createCompanySchema.parse(values);
    expect(output.phone).toBe("45 99998-5424");
    expect(output.firstAdmin).not.toHaveProperty("confirmPassword");
  });

  it("sends the password at the root of the confirmed backend payload", async () => {
    vi.mocked(apiRequest).mockResolvedValue({ id: 7, name: "Empresa Teste" });
    const output = createCompanySchema.parse(values);
    await createCompany({ ...output, status: "onboarding" });
    expect(apiRequest).toHaveBeenCalledWith("/companies", {
      method: "POST",
      body: {
        name: "Empresa Teste",
        email: "admin@example.test",
        phone: "45 99998-5424",
        document: "11222333000181",
        status: true,
        planId: 3,
        dueDate: expect.any(String),
        recurrence: "MENSAL",
        companyUserName: "Administrador",
        password: "TesteSeguro123",
      },
    });
  });
});
