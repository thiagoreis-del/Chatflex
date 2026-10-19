import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Message } from "@/modules/tickets/types";

const harness = vi.hoisted(() => ({
  listener: null as null | ((payload: unknown) => void),
  toast: vi.fn(),
  fetchQuery: vi.fn(),
  tickets: [] as unknown[],
}));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: harness.tickets }),
  useQueryClient: () => ({ fetchQuery: harness.fetchQuery }),
}));
vi.mock("@/shared/auth/session-store", () => ({
  useSession: () => ({ user: { id: "1", companyId: "1" } }),
}));
vi.mock("@/shared/socket/socket-client", () => ({
  socketClient: {
    joinRoom: () => () => {},
    onCompany: (_name: string, listener: (payload: unknown) => void) => {
      harness.listener = listener;
      return () => {};
    },
  },
}));
vi.mock("@/modules/tickets/api", () => ({
  incomingTicketsQuery: () => ({}),
  messagesQuery: () => ({}),
}));
vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("sonner", () => ({
  toast: Object.assign(harness.toast, { info: vi.fn(), success: vi.fn() }),
}));

import { IncomingNotifications } from "@/modules/tickets/components/IncomingNotifications";

afterEach(() => {
  cleanup();
  harness.toast.mockClear();
  harness.tickets = [];
});
describe("Session notifications", () => {
  it("receives a Socket message once and increments the visible bell", async () => {
    render(<IncomingNotifications />);
    const message: Message = {
      id: "socket-1",
      ticketId: 1,
      body: "Olá",
      fromMe: false,
      createdAt: new Date(Date.now() + 1000).toISOString(),
    };
    fireEvent.pointerDown(document);
    harness.listener?.({ action: "create", message });
    harness.listener?.({ action: "create", message });
    harness.listener?.({ action: "update", message: { ...message, id: "update" } });
    await waitFor(() => expect(harness.toast).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "notifications.menu" })).toHaveTextContent("1");
  });
  it("polling receives a message but suppresses historical messages", async () => {
    harness.tickets = [
      {
        id: 1,
        unreadMessages: 1,
        updatedAt: "now",
        lastMessage: "Olá",
        contact: { name: "Cliente" },
      },
    ];
    harness.fetchQuery.mockResolvedValue([
      { id: "old", ticketId: 1, fromMe: false, createdAt: "2020-01-01T00:00:00Z" },
      {
        id: "poll-1",
        ticketId: 1,
        fromMe: false,
        createdAt: new Date(Date.now() + 1000).toISOString(),
      },
    ]);
    render(<IncomingNotifications />);
    await waitFor(() => expect(harness.toast).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "notifications.menu" })).toHaveTextContent("1");
  });
});
