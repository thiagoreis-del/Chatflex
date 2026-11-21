import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sessionCacheScope, ticketKeys } from "@/shared/api/query-keys";

const harness = vi.hoisted(() => ({
  status: "connected",
  invalidateQueries: vi.fn(),
  setQueryData: vi.fn(),
  handlers: new Map<string, (payload: unknown) => void>(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => harness,
}));
vi.mock("@/shared/socket/socket-client", () => ({
  useSocketStatus: () => harness.status,
  socketClient: {
    joinRoom: () => () => {},
    onCompany: (name: string, handler: (payload: unknown) => void) => {
      harness.handlers.set(name, handler);
      return () => harness.handlers.delete(name);
    },
  },
}));

import {
  useFallbackInterval,
  useMessagesRealtime,
  useTicketsRealtime,
} from "@/modules/tickets/realtime";

afterEach(() => {
  cleanup();
  harness.handlers.clear();
  vi.clearAllMocks();
});

describe("Ticket refresh recovery", () => {
  it.each(["connected", "reconnecting", "disconnected"])(
    "checks every three seconds when Socket is %s",
    (status) => {
      harness.status = status;
      const { result } = renderHook(() => useFallbackInterval());
      expect(result.current).toBe(3000);
    },
  );

  it("refreshes immediately when returning to the window", () => {
    renderHook(() => useTicketsRealtime("open"));
    harness.invalidateQueries.mockClear();
    act(() => window.dispatchEvent(new Event("focus")));
    expect(harness.invalidateQueries).toHaveBeenCalledWith({ queryKey: ticketKeys.all });
  });

  it("refreshes conversation messages when a ticket event arrives", () => {
    renderHook(() => useTicketsRealtime("open"));
    harness.invalidateQueries.mockClear();
    act(() => harness.handlers.get("ticket")?.({ action: "update", ticketId: 42 }));
    expect(harness.invalidateQueries).toHaveBeenCalledWith({ queryKey: ticketKeys.messages(42) });
  });

  it("refreshes notification polling immediately on new messages", () => {
    renderHook(() => useTicketsRealtime("open"));
    harness.invalidateQueries.mockClear();
    act(() => harness.handlers.get("appMessage")?.({ action: "create" }));
    expect(harness.invalidateQueries).toHaveBeenCalledWith({
      queryKey: [...ticketKeys.all, "incoming"],
    });
    expect(harness.invalidateQueries).toHaveBeenCalledWith({
      queryKey: [...ticketKeys.all, ...sessionCacheScope(), "list"],
    });
  });

  it.each([
    { action: "create", message: { ticketId: 7381 } },
    { action: "update", ticket: { id: "7381" } },
    { action: "delete", ticketId: 7381 },
  ])("refreshes the affected conversation for appMessage %j", (payload) => {
    renderHook(() => useTicketsRealtime("open"));
    harness.invalidateQueries.mockClear();
    act(() => harness.handlers.get("appMessage")?.(payload));
    expect(harness.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ticketKeys.messages(7381) },
      { cancelRefetch: false },
    );
  });

  it("refetches canonical messages instead of inserting incomplete socket payloads", () => {
    renderHook(() => useMessagesRealtime(7381));
    act(() =>
      harness.handlers.get("appMessage")?.({
        action: "update",
        message: { ticketId: "7381", id: "new", ack: 2 },
      }),
    );
    expect(harness.invalidateQueries).toHaveBeenCalledWith(
      { queryKey: ticketKeys.messages(7381) },
      { cancelRefetch: false },
    );
    expect(harness.setQueryData).not.toHaveBeenCalled();
  });

  it("ignores events for another conversation or invalid IDs", () => {
    renderHook(() => useMessagesRealtime(7381));
    for (const ticketId of [5493, 0, "invalid", null]) {
      act(() => harness.handlers.get("appMessage")?.({ message: { ticketId } }));
    }
    expect(harness.invalidateQueries).not.toHaveBeenCalled();
  });

  it("removes focus listeners on unmount", () => {
    const { unmount } = renderHook(() => useTicketsRealtime("open"));
    unmount();
    harness.invalidateQueries.mockClear();
    act(() => window.dispatchEvent(new Event("focus")));
    expect(harness.invalidateQueries).not.toHaveBeenCalled();
  });
});
