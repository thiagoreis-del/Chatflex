import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { bindSessionCache } from "@/shared/auth/session-cache";
import { clearSession, sessionStore, setSessionUser } from "@/shared/auth/session-store";
import { contactKeys, ticketKeys } from "@/shared/api/query-keys";
import type { AuthenticatedUser } from "@/shared/auth/types";
import type { Ticket } from "@/modules/tickets/types";
import { mergeTicketHistory } from "@/modules/tickets/history";

const mocks = vi.hoisted(() => ({ apiRequest: vi.fn() }));
vi.mock("@/shared/api/client", () => ({
  apiRequest: mocks.apiRequest,
  apiUpload: vi.fn(),
  refreshAccessToken: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}));
vi.mock("@/shared/socket/socket-client", () => ({
  socketClient: { connect: vi.fn(), disconnect: vi.fn() },
}));
import { logout, login } from "@/shared/auth/auth-service";
import { closedOlderTicketsQuery, ticketsQuery, updateTicketStatus } from "@/modules/tickets/api";
import { contactsQuery } from "@/modules/contacts/api";

const user = (companyId = "1", id = "7"): AuthenticatedUser => ({
  companyId,
  id,
  name: "Atendente",
  email: "agent@example.test",
  role: "agent",
  permissions: [],
  queueIds: [3],
});
const ticket = (id: number): Ticket => ({
  id,
  status: "closed",
  lastMessage: "Histórico",
  updatedAt: "2026-11-04T12:00:00Z",
  unreadMessages: 0,
  contact: { id: 10, name: "Contato", number: "5511999999999" },
  user: { id: 7, name: "Atendente" },
  queue: { id: 3, name: "Suporte", color: "green" },
});

beforeEach(() => {
  mocks.apiRequest.mockReset();
  sessionStore.set({ status: "idle", user: null });
  window.localStorage.clear();
});

describe("conservação segura de conversas e contatos", () => {
  it("finalizar altera apenas o status sem excluir contato, mensagens ou atribuição", async () => {
    mocks.apiRequest.mockResolvedValue(ticket(42));
    await updateTicketStatus(42, "closed", 7);
    expect(mocks.apiRequest.mock.calls).toEqual([
      ["/tickets/42", { method: "PUT", body: { status: "closed" } }],
    ]);
  });

  it("recusar mantém o ticket recuperável nos Finalizados, ignorando bloqueios locais antigos", async () => {
    setSessionUser(user());
    window.localStorage.setItem("chatflex:refused:7", JSON.stringify([{ id: 42, at: Date.now() }]));
    mocks.apiRequest
      .mockResolvedValueOnce(ticket(42))
      .mockResolvedValueOnce({ tickets: [ticket(42)] });
    await updateTicketStatus(42, "closed");
    const client = new QueryClient();
    const history = await client.fetchQuery(ticketsQuery({ status: "closed" }));
    expect(history.map((t) => t.id)).toEqual([42]);
    expect(mocks.apiRequest.mock.calls[0]).toEqual([
      "/tickets/42",
      { method: "PUT", body: { status: "closed" } },
    ]);
    client.clear();
  });

  it("sair limpa o cache mesmo com falha remota e um novo login relê contatos e histórico do servidor", async () => {
    setSessionUser(user());
    const client = new QueryClient();
    const unbind = bindSessionCache(client);
    client.setQueryData(contactKeys.list({ search: "", page: 1 }), { data: [{ id: 10 }] });
    client.setQueryData(ticketKeys.list({ status: "closed" }), [ticket(42)]);
    mocks.apiRequest.mockRejectedValueOnce(new Error("offline"));
    await logout(client);
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    expect(sessionStore.get().user).toBeNull();
    mocks.apiRequest.mockResolvedValueOnce({ token: "test-token", user: user() });
    await login("agent@example.test", "test-password");
    mocks.apiRequest.mockResolvedValueOnce({
      contacts: [{ id: 10, name: "Contato", number: "5511999999999" }],
      count: 1,
    });
    expect((await client.fetchQuery(contactsQuery({ search: "", page: 1 }))).data[0]?.id).toBe(10);
    mocks.apiRequest.mockResolvedValueOnce({ tickets: [ticket(42)] });
    expect((await client.fetchQuery(ticketsQuery({ status: "closed" })))[0]?.id).toBe(42);
    expect(mocks.apiRequest.mock.calls.some(([, opts]) => opts?.method === "DELETE")).toBe(false);
    unbind();
    client.clear();
  });

  it("isola chaves e limpa dados na troca de empresa", () => {
    setSessionUser(user("1"));
    const client = new QueryClient();
    const unbind = bindSessionCache(client);
    const contactsA = contactKeys.list({});
    const messagesA = ticketKeys.messages(42);
    const olderA = closedOlderTicketsQuery("").queryKey;
    client.setQueryData(contactsA, [{ id: 10 }]);
    setSessionUser(user("2"));
    expect(contactKeys.list({})).not.toEqual(contactsA);
    expect(ticketKeys.messages(42)).not.toEqual(messagesA);
    expect(closedOlderTicketsQuery("").queryKey).not.toEqual(olderA);
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    unbind();
  });

  it("não reutiliza histórico entre usuários da mesma empresa", () => {
    setSessionUser(user("1", "7"));
    const previous = ticketKeys.messages(42);
    setSessionUser(user("1", "8"));
    expect(ticketKeys.messages(42)).not.toEqual(previous);
  });

  it("descarta dados na perda de sessão e em mudanças de permissões", () => {
    setSessionUser(user());
    const client = new QueryClient();
    const unbind = bindSessionCache(client);
    client.setQueryData(ticketKeys.messages(42), [{ body: "Privado" }]);
    setSessionUser({ ...user(), queueIds: [] });
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    client.setQueryData(ticketKeys.messages(42), [{ body: "Privado" }]);
    clearSession();
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    unbind();
  });

  it("preserva atendimentos antigos do mesmo contato e deduplica todas as páginas por ticket", () => {
    expect(
      mergeTicketHistory([[ticket(42)], [ticket(42), ticket(41)], [ticket(41), ticket(40)]]).map(
        (t) => t.id,
      ),
    ).toEqual([42, 41, 40]);
  });

  it("mantém busca e filas autorizadas ao carregar páginas antigas sem ampliar acesso", async () => {
    setSessionUser(user());
    const options = closedOlderTicketsQuery("Contato");
    mocks.apiRequest.mockResolvedValue({ tickets: [ticket(42)], hasMore: true });
    const client = new QueryClient();
    await client.fetchInfiniteQuery(options);
    const path = String(mocks.apiRequest.mock.calls[0]?.[0]);
    expect(path).toContain("pageNumber=2");
    expect(path).toContain("search=Contato");
    expect(path).toContain("queueIds=%5B3%5D");
    expect(path).not.toContain("showAll=true");
    client.clear();
  });
});
