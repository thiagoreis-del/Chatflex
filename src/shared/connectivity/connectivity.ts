/**
 * Monitor de conectividade real do app.
 *
 * Por que o aviso ficava preso: a sonda `/health` usava CORS normal. Quando o
 * backend não devolve cabeçalhos CORS nessa rota, o navegador rejeita a
 * requisição como "erro de rede" mesmo com o servidor no ar — e o tráfego real
 * (mensagens, listas, WebSocket) nunca atualizava esse estado. Somado a um
 * `navigator.onLine` falso, o aviso de "sem internet" ficava permanente.
 *
 * Agora:
 * - a sonda usa `mode: "no-cors"` (resposta opaca = servidor alcançável);
 * - qualquer resposta HTTP real da API ou conexão do WebSocket confirma "online"
 *   (`markApiReachable`), removendo o aviso na hora;
 * - só declara falha após N sondas consecutivas E sem tráfego real recente;
 * - enquanto há falha, sonda mais rápido para sumir assim que voltar;
 * - re-sonda ao voltar o foco/aba e no evento "online" do navegador.
 *
 * Estados independentes: internet (navegador), api (backend). O WebSocket fica
 * em socket-client e a sessão WhatsApp nas conexões; nenhum dos dois gera aviso
 * de internet.
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
  /** Última vez (ms) em que a API respondeu de verdade (sonda, HTTP ou socket). */
  lastOkAt: number | null;
}

/** Quantas sondas consecutivas precisam falhar antes de declarar a API fora. */
export const FAILURE_THRESHOLD = 2;
/** Intervalo entre sondas quando tudo está normal (ms). */
export const PROBE_INTERVAL_MS = 15_000;
/** Intervalo entre sondas enquanto há falha (ms). */
export const RECOVERY_INTERVAL_MS = 5_000;
/** Timeout de cada sonda (ms). */
export const PROBE_TIMEOUT_MS = 8_000;
/** Tráfego real mais recente que isso prova que a API está no ar (ms). */
export const RECENT_OK_WINDOW_MS = 30_000;

const initial: Connectivity = {
  internet: typeof navigator === "undefined" || navigator.onLine ? "unknown" : "offline",
  api: "unknown",
  failures: 0,
  lastCheckedAt: null,
  lastError: null,
  lastOkAt: null,
};

export const connectivityStore = createStore<Connectivity>(initial);

export function useConnectivity() {
  return useStore(connectivityStore);
}

/**
 * Decide o que o aviso deve mostrar. Só há aviso com falha CONFIRMADA da API.
 * navigator.onLine sozinho nunca mostra aviso (falsos negativos são comuns).
 * Socket fora NUNCA gera aviso aqui.
 */
export function bannerKind(c: Connectivity): "internet" | "backend" | null {
  if (c.api !== "offline") return null;
  return c.internet === "offline" ? "internet" : "backend";
}

/** Sucesso: API e internet comprovadamente no ar (puro, para testes). */
export function applySuccess(prev: Connectivity, now = Date.now()): Connectivity {
  return {
    ...prev,
    api: "online",
    internet: "online",
    failures: 0,
    lastCheckedAt: new Date(now).toISOString(),
    lastError: null,
    lastOkAt: now,
  };
}

/** Aplica o resultado de uma sonda ao estado atual (puro, para testes). */
export function applyProbeResult(
  prev: Connectivity,
  ok: boolean,
  error?: string,
  now = Date.now(),
): Connectivity {
  if (ok) return applySuccess(prev, now);
  // Tráfego real recente vence uma sonda isolada que falhou.
  const recentOk = prev.lastOkAt !== null && now - prev.lastOkAt < RECENT_OK_WINDOW_MS;
  const failures = prev.failures + 1;
  return {
    ...prev,
    api:
      failures >= FAILURE_THRESHOLD && !recentOk
        ? "offline"
        : prev.api === "online"
          ? "online"
          : "unknown",
    failures,
    lastCheckedAt: new Date(now).toISOString(),
    lastError: error ?? null,
  };
}

/** Chamado pelo cliente HTTP e pelo WebSocket sempre que a API responde. */
export function markApiReachable(): void {
  const p = connectivityStore.get();
  // Evita re-render a cada requisição: só grava se mudou ou passou 5s.
  if (
    p.api === "online" &&
    p.internet === "online" &&
    p.lastOkAt &&
    Date.now() - p.lastOkAt < 5_000
  ) {
    return;
  }
  const wasDown = p.api !== "online";
  connectivityStore.set((prev) => applySuccess(prev));
  if (wasDown) schedule();
}

let timer: ReturnType<typeof setTimeout> | null = null;
let probing = false;
let started = false;

async function probe(): Promise<void> {
  if (probing) return;
  probing = true;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
      // "no-cors": resposta opaca já prova que o servidor respondeu, sem
      // depender de cabeçalhos CORS na rota de saúde. Só erro de rede rejeita.
      await fetch(`${env.apiUrl}/health?_=${Date.now()}`, {
        method: "GET",
        mode: "no-cors",
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
    console.warn("[connectivity] sonda ao backend falhou:", detail);
    connectivityStore.set((p) => applyProbeResult(p, false, detail));
  } finally {
    probing = false;
  }
}

function schedule() {
  if (!started) return;
  if (timer) clearTimeout(timer);
  const ok = connectivityStore.get().api === "online" && connectivityStore.get().failures === 0;
  timer = setTimeout(
    async () => {
      await probe();
      schedule();
    },
    ok ? PROBE_INTERVAL_MS : RECOVERY_INTERVAL_MS,
  );
}

function probeNow() {
  void probe().then(schedule);
}

function onBrowserOnline() {
  connectivityStore.set((p) => ({ ...p, internet: "online" }));
  probeNow();
}

function onBrowserOffline() {
  // Não mostra aviso sozinho: só confirma com a sonda.
  connectivityStore.set((p) => ({ ...p, internet: "offline" }));
  probeNow();
}

function onVisible() {
  if (typeof document !== "undefined" && document.visibilityState === "visible") probeNow();
}

/** Inicia o monitoramento (idempotente). Chamado uma vez na raiz do app. */
export function startConnectivityMonitor(): void {
  if (started || typeof window === "undefined") return;
  started = true;
  window.addEventListener("online", onBrowserOnline);
  window.addEventListener("offline", onBrowserOffline);
  window.addEventListener("focus", onVisible);
  document.addEventListener("visibilitychange", onVisible);
  probeNow();
}

/** Para testes/limpeza. */
export function stopConnectivityMonitor(): void {
  if (timer) clearTimeout(timer);
  timer = null;
  started = false;
  if (typeof window !== "undefined") {
    window.removeEventListener("online", onBrowserOnline);
    window.removeEventListener("offline", onBrowserOffline);
    window.removeEventListener("focus", onVisible);
    document.removeEventListener("visibilitychange", onVisible);
  }
}
