/**
 * Monitor de conectividade real do app.
 *
 * Não confia só em navigator.onLine (falso negativo em VPN/portal cativo):
 * sonda o backend periodicamente e só declara falha após N quedas consecutivas,
 * evitando alarmes falsos por oscilações momentâneas.
 *
 * Três estados independentes:
 * - internet: sinal do navegador (offline/online);
 * - api: backend respondeu (qualquer HTTP conta; só erro de rede derruba);
 * - socket: vem do socket-client (queda do WebSocket NÃO gera aviso de internet).
 */
import { env } from "@/shared/config/env";
import { createStore, useStore } from "@/shared/hooks/create-store";

export type NetState = "unknown" | "online" | "offline";

export interface Connectivity {
  internet: NetState;
  api: NetState;
  /** Falhas consecutivas da sonda (diagnóstico). */
  failures: number;
  lastCheckedAt: string | null;
  lastError: string | null;
}

/** Quantas sondas consecutivas precisam falhar antes de declarar a API fora. */
export const FAILURE_THRESHOLD = 2;
/** Intervalo entre sondas (ms). */
export const PROBE_INTERVAL_MS = 15_000;
/** Timeout de cada sonda (ms). */
export const PROBE_TIMEOUT_MS = 8_000;

const initial: Connectivity = {
  internet: typeof navigator === "undefined" || navigator.onLine ? "unknown" : "offline",
  api: "unknown",
  failures: 0,
  lastCheckedAt: null,
  lastError: null,
};

export const connectivityStore = createStore<Connectivity>(initial);

export function useConnectivity() {
  return useStore(connectivityStore);
}

/** Decide o que o aviso deve mostrar. Socket fora NUNCA gera aviso aqui. */
export function bannerKind(c: Connectivity): "internet" | "backend" | null {
  if (c.api === "online") return null;
  if (c.internet === "offline") return "internet";
  if (c.api === "offline") return "backend";
  return null;
}

/** Aplica o resultado de uma sonda ao estado atual (puro, para testes). */
export function applyProbeResult(prev: Connectivity, ok: boolean, error?: string): Connectivity {
  const at = new Date().toISOString();
  if (ok) {
    return { ...prev, api: "online", internet: "online", failures: 0, lastCheckedAt: at, lastError: null };
  }
  const failures = prev.failures + 1;
  return {
    ...prev,
    api: failures >= FAILURE_THRESHOLD ? "offline" : prev.api === "online" ? "online" : "unknown",
    failures,
    lastCheckedAt: at,
    lastError: error ?? null,
  };
}

let timer: ReturnType<typeof setInterval> | null = null;
let probing = false;
let started = false;

async function probe(): Promise<void> {
  if (probing) return;
  probing = true;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      // Qualquer resposta HTTP (até 401/404) prova que o backend está no ar.
      await fetch(`${env.apiUrl}/health`, {
        method: "GET",
        cache: "no-store",
        credentials: "omit",
        signal: controller.signal,
      });
      connectivityStore.set((p) => applyProbeResult(p, true));
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.warn("[connectivity] sonda falhou:", detail);
    connectivityStore.set((p) => applyProbeResult(p, false, detail));
  } finally {
    probing = false;
  }
}

function onBrowserOnline() {
  connectivityStore.set((p) => ({ ...p, internet: "online" }));
  void probe();
}

function onBrowserOffline() {
  connectivityStore.set((p) => ({ ...p, internet: "offline" }));
}

/** Inicia o monitoramento (idempotente). Chamado uma vez na raiz do app. */
export function startConnectivityMonitor(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("online", onBrowserOnline);
  window.addEventListener("offline", onBrowserOffline);
  void probe();
  timer = setInterval(() => void probe(), PROBE_INTERVAL_MS);
}

/** Para testes/limpeza. */
export function stopConnectivityMonitor(): void {
  if (timer) clearInterval(timer);
  timer = null;
  started = false;
  if (typeof window !== "undefined") {
    window.removeEventListener("online", onBrowserOnline);
    window.removeEventListener("offline", onBrowserOffline);
  }
}
