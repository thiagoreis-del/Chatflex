import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";

/** Limites de alerta definidos com o usuário (ajustáveis). */
export const VPS_LIMITS = {
  cpuPercent: 80,
  memoryPercent: 85,
  /** Atenção a partir de 80%, crítico a partir de 90%. */
  diskWarningPercent: 80,
  diskPercent: 90,
  activeConnections: 40,
} as const;

/** Capacidade contratada da VPS (referência exibida no painel). */
export const VPS_CAPACITY = {
  cpuCores: 4,
  memoryGb: 8,
  diskGb: 100,
} as const;

/**
 * Contrato real da VPS: GET /server-metrics (isAuth + isSuper).
 * Resposta de ServerMetricsController.index.
 */
export interface ServerMetrics {
  status: string;
  serverTime: string;
  uptimeSeconds: number;
  processUptimeSeconds: number;
  general: {
    hostname: string;
    platform: string;
    release: string;
    arch: string;
    nodeVersion: string;
    pid: number;
  };
  memory: {
    /** Formatado pelo backend, ex.: "3.45 GB" */
    total: string;
    used: string;
    free: string;
    usedPercent: number;
  };
  cpu: {
    model: string;
    cores: number;
    loadAverage1m: number;
    loadAverage5m: number;
    loadAverage15m: number;
  };
  /** Formato livre conforme o backend; exibido de forma defensiva. */
  disk: { usedPercent?: number; total?: string; used?: string; free?: string } | null;
  redis: { status?: string; usedMemory?: string } | null;
  wuzapi: { status?: string } | null;
  collectedAt: string;
  cacheTtlMs: number;
}

export const serverMetricsContract = "GET /server-metrics";

/** Percentual de CPU estimado a partir do load average de 1 min por núcleo. */
export function cpuPercent(cpu: ServerMetrics["cpu"]): number {
  if (!cpu.cores) return 0;
  return Math.min(100, (cpu.loadAverage1m / cpu.cores) * 100);
}

/** Retorna null quando a rota não responde — o painel cai para estimativas. */
export const serverHealthQuery = () =>
  queryOptions({
    queryKey: ["platform", "server-metrics"],
    refetchInterval: 30_000,
    retry: false,
    queryFn: async ({ signal }) => {
      try {
        return await apiRequest<ServerMetrics>("/server-metrics", { signal });
      } catch {
        return null;
      }
    },
  });

export type HealthLevel = "ok" | "warning" | "danger";

export function levelOf(percent: number, limit: number): HealthLevel {
  if (percent >= limit) return "danger";
  if (percent >= limit - 10) return "warning";
  return "ok";
}

/** Estado normalizado de um serviço reportado pela VPS. */
export type ServiceState = "online" | "offline" | "not_configured" | "unknown";

/**
 * Interpreta o status bruto do backend. `not_configured` significa que o serviço
 * não faz parte da instalação (ex.: Wuzapi não utilizado) — nunca é falha.
 * Apenas estados explicitamente negativos contam como offline confirmado.
 */
export function serviceState(status: string | null | undefined): ServiceState {
  if (!status) return "unknown";
  const s = status.toLowerCase();
  if (s === "not_configured" || s === "not-configured" || s === "disabled") return "not_configured";
  if (s === "online" || s === "ok" || s === "connected" || s === "healthy") return "online";
  if (s === "offline" || s === "down" || s === "error" || s === "failed" || s === "unreachable")
    return "offline";
  return "unknown";
}

/** Estimativa de capacidade por conexões ativas, usada quando a rota da VPS não responde. */
export function connectionLevel(active: number): HealthLevel {
  return levelOf((active / VPS_LIMITS.activeConnections) * 100, 100);
}

/** Amostra real coletada da rota de métricas, usada no histórico do painel. */
export interface MetricsSample {
  at: number;
  cpu: number;
  memory: number;
  disk: number | null;
}

/** Máximo de amostras mantidas no histórico da sessão (30s cada ≈ 1h). */
export const HISTORY_MAX_SAMPLES = 120;

/** Acrescenta uma amostra real ao histórico, descartando as mais antigas. */
export function appendSample(history: MetricsSample[], sample: MetricsSample): MetricsSample[] {
  if (history.length > 0 && history[history.length - 1].at === sample.at) return history;
  return [...history, sample].slice(-HISTORY_MAX_SAMPLES);
}
