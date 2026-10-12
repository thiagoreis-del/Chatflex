/**
 * Mocks SOMENTE para desenvolvimento visual. Carregados dinamicamente pelo cliente
 * HTTP apenas quando VITE_USE_MOCKS=true. Nenhum dado real.
 */
import type { RequestOptions } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import { endpoints } from "@/shared/config/endpoints";
import type { AuthenticatedUser } from "@/shared/auth/types";

const demoUser: AuthenticatedUser = {
  id: "demo-user",
  name: "Pessoa Demonstração",
  email: "demo@exemplo.test",
  role: "company_admin",
  companyId: "empresa-demo",
  permissions: ["dashboard:view"],
};

// Sessão mock em memória: recarregar a página encerra (igual ao comportamento real sem cookie).
let mockLoggedIn = false;

const wait = (ms = 350) => new Promise((r) => setTimeout(r, ms));

export async function mockRequest<T>(path: string, opts: RequestOptions): Promise<T> {
  await wait();
  const body = (opts.body ?? {}) as Record<string, string>;
  switch (path) {
    case endpoints.auth.login:
      if (body["password"] !== "demo1234") throw new ApiError("unauthorized", 401);
      mockLoggedIn = true;
      return { accessToken: "mock-token", user: { ...demoUser, email: body["email"] } } as T;
    case endpoints.auth.refresh:
      if (!mockLoggedIn) throw new ApiError("unauthorized", 401);
      return { accessToken: "mock-token" } as T;
    case endpoints.auth.me:
      if (!mockLoggedIn) throw new ApiError("unauthorized", 401);
      return demoUser as T;
    case endpoints.auth.logout:
      mockLoggedIn = false;
      return undefined as T;
    case endpoints.auth.forgotPassword:
      return undefined as T;
    case endpoints.auth.resetPassword:
      if (body["token"] === "expirado") throw new ApiError("validation", 422);
      return undefined as T;
    default:
      throw new ApiError("notFound", 404);
  }
}
