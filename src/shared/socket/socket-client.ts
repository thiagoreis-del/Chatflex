/**
 * Adaptador Socket.io — contrato confirmado no backend ZapPro/Whaticket:
 * - namespace por empresa: `${VITE_SOCKET_URL}/${companyId}`;
 * - autenticação via query `{ token, userId }` (JWT de acesso em memória);
 * - salas: joinTickets(status)/leaveTickets, joinChatBox(ticketId)/joinChatBoxLeave, joinNotification;
 * - eventos: company-{id}-ticket, company-{id}-appMessage, company-{id}-contact.
 *
 * Desligado no modo de demonstração (VITE_USE_MOCKS=true). Quando não está
 * "connected", as telas usam polling como fallback.
 */
import type { Socket } from "socket.io-client";
import { env } from "@/shared/config/env";
import { tokenStore } from "@/shared/auth/token-store";
import { sessionStore } from "@/shared/auth/session-store";
import { createStore, useStore } from "@/shared/hooks/create-store";

export const SOCKET_ENABLED = !env.useMocks;

export type SocketStatus =
  "disabled" | "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";

export const socketStatusStore = createStore<SocketStatus>(SOCKET_ENABLED ? "idle" : "disabled");

type Handler = (payload: unknown) => void;

let socket: Socket | null = null;
let companyId: string | null = null;
let connecting = false;
const listeners = new Map<string, Set<Handler>>();
const rooms = new Map<string, { join: string; leave: string; arg?: string; count: number }>();

function rejoinRooms() {
  if (!socket) return;
  for (const r of rooms.values()) socket.emit(r.join, r.arg);
}

async function open() {
  const token = tokenStore.get();
  const user = sessionStore.get().user;
  if (!token || !user?.companyId) {
    socketStatusStore.set("disconnected");
    return;
  }
  connecting = true;
  socketStatusStore.set("connecting");
  const { io } = await import("socket.io-client");
  connecting = false;
  companyId = user.companyId;
  const s = io(`${env.socketUrl}/${companyId}`, {
    transports: ["websocket", "polling"],
    query: { token, userId: user.id },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30_000,
  });
  socket = s;
  s.on("connect", () => {
    socketStatusStore.set("connected");
    rejoinRooms();
  });
  s.on("disconnect", () => socketStatusStore.set("reconnecting"));
  s.io.on("reconnect_attempt", () => {
    // Token pode ter sido renovado: envia sempre o atual.
    (s.io.opts as { query?: Record<string, string> }).query = {
      token: tokenStore.get() ?? "",
      userId: user.id,
    };
    socketStatusStore.set("reconnecting");
  });
  s.on("connect_error", () => socketStatusStore.set("reconnecting"));
  s.onAny((event: string, payload: unknown) => {
    listeners.get(event)?.forEach((h) => h(payload));
  });
}

export const socketClient = {
  connect() {
    if (!SOCKET_ENABLED || typeof window === "undefined") return;
    if (socket || connecting) return;
    void open();
  },
  disconnect() {
    socket?.removeAllListeners();
    socket?.disconnect();
    socket = null;
    companyId = null;
    if (SOCKET_ENABLED) socketStatusStore.set("disconnected");
  },
  /** Assina um evento escopado pela empresa: `company-{id}-{name}`. */
  onCompany(name: "ticket" | "appMessage" | "contact", handler: Handler) {
    const cid = companyId ?? sessionStore.get().user?.companyId;
    if (!cid) return () => {};
    const event = `company-${cid}-${name}`;
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(handler);
    return () => listeners.get(event)?.delete(handler);
  },
  /** Entra numa sala; devolve função para sair. Reentra após reconexão. */
  joinRoom(join: string, leave: string, arg?: string) {
    const key = `${join}:${arg ?? ""}`;
    const r = rooms.get(key) ?? { join, leave, arg, count: 0 };
    r.count += 1;
    rooms.set(key, r);
    if (r.count === 1 && socket?.connected) socket.emit(join, arg);
    return () => {
      r.count -= 1;
      if (r.count <= 0) {
        rooms.delete(key);
        if (socket?.connected) socket.emit(leave, arg);
      }
    };
  },
};

export function useSocketStatus() {
  return useStore(socketStatusStore);
}
