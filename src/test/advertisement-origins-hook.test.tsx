import { act, cleanup, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const session = vi.hoisted(() => ({ user: { companyId: 1, id: 7 } }));
vi.mock("@/shared/auth/session-store", () => ({ useSession: () => session }));
import { useAdvertisementOrigins } from "@/modules/tickets/use-advertisement-origins";

const ad =
  "data:image/png;base64,aGVsbG8= | https://facebook.com/ad/123 | Gestão empresarial | Olá";
afterEach(() => {
  cleanup();
  session.user = { companyId: 1, id: 7 };
});

function harness() {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, ...renderHook(() => useAdvertisementOrigins(), { wrapper }) };
}

describe("session-scoped advertising origins observer", () => {
  it("updates when an incoming ad arrives in the canonical message cache", () => {
    const { client, result } = harness();
    expect(result.current.size).toBe(0);
    act(() =>
      client.setQueryData(
        ["company", "tickets", 1, 7, "messages", 42],
        [{ id: "ad", ticketId: 42, body: ad, fromMe: false }],
      ),
    );
    expect(result.current.get(42)?.title).toBe("Gestão empresarial");
  });
  it("discards identified origins on query-cache clearing", () => {
    const { client, result } = harness();
    act(() =>
      client.setQueryData(["company", "tickets", 1, 7, "list", {}], [{ id: 42, lastMessage: ad }]),
    );
    expect(result.current.has(42)).toBe(true);
    act(() => client.clear());
    expect(result.current.size).toBe(0);
  });
  it("never reuses origins across a change of company or user", () => {
    const { client, result, rerender } = harness();
    act(() =>
      client.setQueryData(["company", "tickets", 1, 7, "list", {}], [{ id: 42, lastMessage: ad }]),
    );
    expect(result.current.has(42)).toBe(true);
    session.user = { companyId: 2, id: 7 };
    rerender();
    expect(result.current.size).toBe(0);
    session.user = { companyId: 1, id: 8 };
    rerender();
    expect(result.current.size).toBe(0);
  });
});
