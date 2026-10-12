/**
 * Base do Socket.
 *
 * CONTRATO PENDENTE: protocolo, caminho e forma de autenticação do Socket não foram
 * confirmados. Enquanto `SOCKET_ENABLED` for false, o adaptador fica DESATIVADO
 * e apenas informa o status "disabled".
 *
 * Regras:
 * - usa VITE_SOCKET_URL e o access token da memória;
 * - inicia só após autenticação e encerra no logout;
 * - reconecta com atraso exponencial;
 * - NÃO entra em namespace/sala de empresa (o backend decide);
 * - nenhum evento de mensagens nesta fase.
 */
import { env } from "@/shared/config/env";
import { tokenStore } from "@/shared/auth/token-store";
import { createStore, useStore } from "@/shared/hooks/create-store";

export const SOCKET_ENABLED = false;

export type SocketStatus =
  | "disabled"
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export const socketStatusStore = createStore<SocketStatus>(SOCKET_ENABLED ? "idle" : "disabled");

const MAX_DELAY_MS = 30_000;
let ws: WebSocket | null = null;
let attempts = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let manualClose = false;

function toWsUrl(url: string) {
  return url.replace(/^http/, "ws");
}

function scheduleReconnect() {
  attempts += 1;
  const delay = Math.min(1000 * 2 ** (attempts - 1), MAX_DELAY_MS);
  socketStatusStore.set("reconnecting");
  retryTimer = setTimeout(open, delay);
}

function open() {
  const token = tokenStore.get();
  if (!token) {
    socketStatusStore.set("disconnected");
    return;
  }
  socketStatusStore.set(attempts === 0 ? "connecting" : "reconnecting");
  ws = new WebSocket(toWsUrl(env.socketUrl));
  ws.onopen = () => {
    attempts = 0;
    // Token enviado na primeira mensagem (não na URL). Formato a confirmar.
    ws?.send(JSON.stringify({ type: "auth", token: tokenStore.get() }));
    socketStatusStore.set("connected");
  };
  ws.onclose = () => {
    ws = null;
    if (manualClose) {
      socketStatusStore.set("disconnected");
      return;
    }
    scheduleReconnect();
  };
  ws.onerror = () => ws?.close();
}

export const socketClient = {
  connect() {
    if (!SOCKET_ENABLED || typeof window === "undefined") return;
    if (ws) return;
    manualClose = false;
    attempts = 0;
    open();
  },
  disconnect() {
    if (retryTimer) clearTimeout(retryTimer);
    retryTimer = null;
    manualClose = true;
    ws?.close();
    ws = null;
    attempts = 0;
    if (SOCKET_ENABLED) socketStatusStore.set("disconnected");
  },
};

export function useSocketStatus() {
  return useStore(socketStatusStore);
}
