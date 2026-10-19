import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ticketKeys } from "@/shared/api/query-keys";

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

import { useFallbackInterval, useTicketsRealtime } from "@/modules/tickets/realtime";

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
  });

  it("removes focus listeners on unmount", () => {
    const { unmount } = renderHook(() => useTicketsRealtime("open"));
    unmount();
    harness.invalidateQueries.mockClear();
    act(() => window.dispatchEvent(new Event("focus")));
    expect(harness.invalidateQueries).not.toHaveBeenCalled();
  });
});