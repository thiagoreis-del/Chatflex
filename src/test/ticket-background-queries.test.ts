import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/shared/api/client";
import { activeTicketsForSlaQuery, incomingTicketsQuery } from "@/modules/tickets/api";

vi.mock("@/shared/api/client", () => ({ apiRequest: vi.fn(), apiUpload: vi.fn() }));

const request = vi.mocked(apiRequest);

beforeEach(() => request.mockReset());

describe("ticket background queries", () => {
  it("reads only the newest page for session-wide notifications", async () => {
    request.mockResolvedValue({ tickets: [], count: 100, hasMore: true });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    try {
      await client.fetchQuery(incomingTicketsQuery("7"));

      expect(request).toHaveBeenCalledTimes(3);
      expect(request.mock.calls.map(([path]) => String(path))).toEqual(
        expect.arrayContaining([
          expect.stringContaining("status=pending"),
          expect.stringContaining("status=open"),
          expect.stringContaining("status=group"),
        ]),
      );
      for (const [path] of request.mock.calls) {
        expect(String(path)).toContain("pageNumber=1");
      }
    } finally {
      client.clear();
    }
  });

  it("keeps complete pagination available to the enabled SLA monitor", async () => {
    request.mockImplementation(async (path) => {
      const params = new URL(String(path), "https://example.test").searchParams;
      const page = Number(params.get("pageNumber"));
      const status = params.get("status");
      return {
        tickets:
          page === 1
            ? [
                {
                  id: status === "pending" ? 1 : 2,
                  status,
                  updatedAt: "2026-11-20T12:00:00Z",
                },
              ]
            : [],
        count: 1,
        hasMore: page === 1,
      };
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    try {
      await client.fetchQuery(activeTicketsForSlaQuery("7"));

      expect(request).toHaveBeenCalledTimes(4);
      const pages = request.mock.calls.map(([path]) =>
        new URL(String(path), "https://example.test").searchParams.get("pageNumber"),
      );
      expect(pages).toEqual(expect.arrayContaining(["1", "1", "2", "2"]));
    } finally {
      client.clear();
    }
  });
});
