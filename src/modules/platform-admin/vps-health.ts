import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";

/** Limites de alerta definidos com o usuário (ajustáveis). */
export const VPS_LIMITS = {
  cpuPercent: 80,
  memoryPercent: 85,
  diskPercent: 90,
  activeConnections: 40,
} as const;

/** CONTRATO PENDENTE: rota GET /server/health a instalar na VPS (docs/vps/server-health-route.js). */
export interface ServerHealth {
  hostname: string;
  uptimeSeconds: number;
  cpu: { cores: number; loadAvg1m: number; percent: number };
  memory: { totalMB: number; usedMB: number; percent: number };
  disk: { totalGB: number; usedGB: number; percent: number } | null;
  pm2:
    | {
        name: string;
        status: string;
        restarts: number;
        memoryMB: number;
        cpuPercent: number;
        uptimeSeconds: number | null;
      }[]
    | null;
  collectedAt: string;
}

export const serverHealthContract = "GET /server/health (rota a instalar na VPS)";

/** Retorna null quando a rota ainda não existe na VPS — o painel cai para estimativas. */
export const serverHealthQuery = () =>
  queryOptions({
    queryKey: ["platform", "server-health"],
    refetchInterval: 30_000,
    retry: false,
    queryFn: async ({ signal }) => {
      try {
        return await apiRequest<ServerHealth>("/server/health", { signal });
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

/** Estimativa de capacidade por conexões ativas, usada quando a rota da VPS não responde. */
export function connectionLevel(active: number): HealthLevel {
  return levelOf((active / VPS_LIMITS.activeConnections) * 100, 100);
}
