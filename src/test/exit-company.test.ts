import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/errors";

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
  connect: vi.fn(),
  disconnect: vi.fn(),
}));

vi.mock("@/shared/api/client", () => ({
  apiRequest: mocks.apiRequest,
  refreshAccessToken: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}));

vi.mock("@/shared/socket/socket-client", () => ({
  socketClient: { connect: mocks.connect, disconnect: mocks.disconnect },
}));

import { enterCompany, exitCompany, login } from "@/shared/auth/auth-service";
import { sessionStore } from "@/shared/auth/session-store";
import { tokenStore } from "@/shared/auth/token-store";

const platformUser = {
  id: "super-1",
  name: "Super Admin",
  email: "super@notasflex.com.br",
  role: "superadmin",
  companyId: "1",
  permissions: [],
};

const companyUser = {
  id: "admin-1",
  name: "Admin Empresa",
  email: "admin@empresa.com.br",
  role: "company_admin",
  companyId: "2",
  permissions: [],
};

describe("Sair da empresa não desloga o superadmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.sessionStorage.clear();
    sessionStore.set({ status: "idle", user: null });
  });

  it("restaura a sessão original da plataforma quando o servidor falha", async () => {
    apiRequestMock.mockImplementation((path: string, opts?: { body?: unknown }) => {
      if (path === "/auth/login") return Promise.resolve({ token: "token-plataforma", user: platformUser });
      if (path === "/companies/2/enter")
        return Promise.resolve({ token: "token-delegado", user: companyUser });
      if (path === "/companies/exit")
        return Promise.reject(new ApiError("forbidden", 403, { message: "ERR_NO_SUPER" }));
      throw new Error(`rota inesperada: ${path} ${JSON.stringify(opts)}`);
    });

    await login("super@notasflex.com.br", "senha");
    await enterCompany("2");
    expect(tokenStore.get()).toBe("token-delegado");
    expect(sessionStore.get().user?.companyId).toBe("2");

    await expect(exitCompany()).rejects.toThrow();
    // Sessão da plataforma restaurada localmente, sem deslogar.
    expect(tokenStore.get()).toBe("token-plataforma");
    expect(sessionStore.get().user?.role).toBe("superadmin");
    expect(sessionStore.get().user?.companyId).toBe("1");
  });

  it("usa a resposta do servidor quando a saída tem sucesso", async () => {
    apiRequestMock.mockImplementation((path: string) => {
      if (path === "/auth/login") return Promise.resolve({ token: "token-plataforma", user: platformUser });
      if (path === "/companies/2/enter") return Promise.resolve({ token: "token-delegado", user: companyUser });
      if (path === "/companies/exit") return Promise.resolve({ token: "token-novo", user: platformUser });
      throw new Error(`rota inesperada: ${path}`);
    });

    await login("super@notasflex.com.br", "senha");
    await enterCompany("2");
    await expect(exitCompany()).resolves.toBeUndefined();
    expect(tokenStore.get()).toBe("token-novo");
    expect(sessionStore.get().user?.companyId).toBe("1");
  });
});
