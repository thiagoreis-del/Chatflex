import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Message } from "@/modules/tickets/types";
import { ticketKeys } from "@/shared/api/query-keys";

const mocks = vi.hoisted(() => ({ apiRequest: vi.fn() }));

vi.mock("@/shared/api/client", () => ({
  apiRequest: mocks.apiRequest,
  apiUpload: vi.fn(),
}));

import { latestMessagesQuery, messagesQuery } from "@/modules/tickets/api";

const message = (id: string, createdAt: string): Message => ({
  id,
  ticketId: 10,
  body: id,
  fromMe: false,
  createdAt,
});

beforeEach(() => mocks.apiRequest.mockReset());

describe("message polling", () => {
  it("carrega todas as páginas somente quando a conversa ainda não está no cache", async () => {
    mocks.apiRequest
      .mockResolvedValueOnce({
        messages: [message("2", "2026-10-29T10:00:00.000Z")],
        hasMore: true,
      })
      .mockResolvedValueOnce({
        messages: [message("1", "2026-10-29T09:00:00.000Z")],
        hasMore: false,
      });
    const client = new QueryClient();

    const result = await client.fetchQuery(messagesQuery(10));

    expect(mocks.apiRequest).toHaveBeenCalledTimes(2);
    expect(result.map((item) => item.id)).toEqual(["1", "2"]);
  });

  it("consulta apenas a página recente durante as atualizações periódicas", async () => {
    const client = new QueryClient();
    client.setQueryData(ticketKeys.messages(10), [message("1", "2026-10-29T09:00:00.000Z")]);
    mocks.apiRequest.mockResolvedValue({
      messages: [message("2", "2026-10-29T10:00:00.000Z")],
      hasMore: true,
    });

    const result = await client.fetchQuery({ ...messagesQuery(10), staleTime: 0 });

    expect(mocks.apiRequest).toHaveBeenCalledTimes(1);
    expect(String(mocks.apiRequest.mock.calls[0]?.[0])).toContain("pageNumber=1");
    expect(result.map((item) => item.id)).toEqual(["1", "2"]);
  });

  it("notificações consultam somente a página recente sem preencher o cache do histórico", async () => {
    const client = new QueryClient();
    mocks.apiRequest.mockResolvedValue({
      messages: [message("2", "2026-10-29T10:00:00.000Z")],
      hasMore: true,
    });

    const result = await client.fetchQuery(latestMessagesQuery(10));

    expect(mocks.apiRequest).toHaveBeenCalledTimes(1);
    expect(String(mocks.apiRequest.mock.calls[0]?.[0])).toContain("pageNumber=1");
    expect(result.map((item) => item.id)).toEqual(["2"]);
    expect(client.getQueryData(ticketKeys.messages(10))).toBeUndefined();
  });
});
