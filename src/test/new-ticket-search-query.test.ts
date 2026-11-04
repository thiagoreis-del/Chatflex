import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "@/shared/api/client";
import { ticketsQuery } from "@/modules/tickets/api";
import { availableContactSuggestions } from "@/modules/tickets/contact-search";
import type { Ticket } from "@/modules/tickets/types";

vi.mock("@/shared/api/client", () => ({ apiRequest: vi.fn(), apiUpload: vi.fn() }));
const request = vi.mocked(apiRequest);
const contact = { id: 42, name: "Anvat Soluções", number: "5511998765432", isGroup: false };
const activeTicket = (status: "open" | "pending"): Ticket => ({
  id: 99, contact, status, lastMessage: "Oi", updatedAt: "2026-11-04T18:00:00Z",
  unreadMessages: 0, queue: null, user: null,
});

beforeEach(() => request.mockReset());

describe("search-scoped active ticket exclusions", () => {
  it.each(["open", "pending"] as const)(
    "excludes an older %s ticket absent from the unfiltered first page",
    async (status) => {
      request.mockImplementation(async (path) => {
        const params = new URL(path, "https://example.test").searchParams;
        return {
          tickets: params.get("search") === "Anvat" && params.get("status") === status
            ? [activeTicket(status)] : [],
          count: 100, hasMore: true,
        };
      });
      const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      try {
        const initial = await client.fetchQuery(ticketsQuery({ status }));
        expect(availableContactSuggestions([contact], initial)).toEqual([contact]);
        const lists = await Promise.all(
          (["open", "pending"] as const).map((state) =>
            client.fetchQuery(ticketsQuery({ status: state, search: "Anvat" })),
          ),
        );
        expect(availableContactSuggestions([contact], lists.flat())).toEqual([]);
        expect(request).toHaveBeenCalledTimes(3);
      } finally {
        client.clear();
      }
    },
  );
});