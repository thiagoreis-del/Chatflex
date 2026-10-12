/**
 * Mocks SOMENTE para desenvolvimento visual. Carregados dinamicamente pelo cliente
 * HTTP apenas quando VITE_USE_MOCKS=true. Nenhum dado real.
 *
 * Logins de demonstração (senha demo1234):
 * - superadmin@exemplo.test → superadministrador (vê a área Plataforma)
 * - qualquer outro e-mail   → administrador da empresa
 */
import type { RequestOptions } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import { endpoints } from "@/shared/config/endpoints";
import type { AuthenticatedUser } from "@/shared/auth/types";
import { platformMock } from "./platform";

export const DEMO_SUPERADMIN_EMAIL = "superadmin@exemplo.test";

const demoCompanyUser: AuthenticatedUser = {
  id: "demo-user",
  name: "Pessoa Demonstração",
  email: "demo@exemplo.test",
  role: "company_admin",
  companyId: "empresa-demo",
  permissions: ["dashboard:view"],
};

const demoSuperadmin: AuthenticatedUser = {
  id: "demo-superadmin",
  name: "Superadmin Demonstração",
  email: DEMO_SUPERADMIN_EMAIL,
  role: "superadmin",
  companyId: "plataforma",
  permissions: ["dashboard:view"],
};

// Sessão mock em memória: recarregar a página encerra (igual ao comportamento real sem cookie).
let currentUser: AuthenticatedUser | null = null;

const wait = (ms = 350) => new Promise((r) => setTimeout(r, ms));

export async function mockRequest<T>(path: string, opts: RequestOptions): Promise<T> {
  await wait();
  const body = (opts.body ?? {}) as Record<string, string>;
  switch (path) {
    case endpoints.auth.login: {
      if (body["password"] !== "demo1234") throw new ApiError("unauthorized", 401);
      const email = (body["email"] ?? "").toLowerCase();
      currentUser =
        email === DEMO_SUPERADMIN_EMAIL ? demoSuperadmin : { ...demoCompanyUser, email };
      return { accessToken: "mock-token", user: currentUser } as T;
    }
    case endpoints.auth.refresh:
      if (!currentUser) throw new ApiError("unauthorized", 401);
      return { accessToken: "mock-token" } as T;
    case endpoints.auth.me:
      if (!currentUser) throw new ApiError("unauthorized", 401);
      return currentUser as T;
    case endpoints.auth.logout:
      currentUser = null;
      return undefined as T;
    case endpoints.auth.forgotPassword:
      return undefined as T;
    case endpoints.auth.resetPassword:
      if (body["token"] === "expirado") throw new ApiError("validation", 422);
      return undefined as T;
  }
  if (path.startsWith("/platform/")) {
    if (currentUser?.role !== "superadmin") throw new ApiError("forbidden", 403);
    return platformMock(path, opts) as T;
  }
  throw new ApiError("notFound", 404);
}
