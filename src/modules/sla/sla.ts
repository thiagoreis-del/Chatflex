import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { settingEndpoints } from "@/shared/config/endpoints";
import type { Ticket } from "@/modules/tickets/types";

/**
 * SLA e alertas — opcional e independente por empresa (empresa do token).
 * Configuração em /settings/sla (tabela Settings, isolada por companyId no backend).
 *
 * LIMITAÇÃO: enquanto o backend não tiver o job de SLA (/sla/*), o estado é estimado no
 * navegador a partir da lista de tickets (mensagens não lidas + horário da última mensagem).
 * Isso só funciona com o painel aberto e não substitui o monitoramento no servidor.
 */
export type SlaTone = "classic" | "double" | "urgent" | "soft";
export type SlaState = "monitoring" | "warning" | "urgent" | "violated" | "none";

export interface SlaConfig {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  supervisorAlerts: boolean;
  highlight: boolean;
  warningMinutes: number;
  urgentMinutes: number;
  violatedMinutes: number;
  tone: SlaTone;
  volume: number; // 0–100
  supervisorIds: number[];
  /** Datas AAAA-MM-DD sem monitoramento. */
  holidays: string[];
  /** Respeita o horário de atendimento configurado na empresa. */
  onlyBusinessHours: boolean;
  /** Ciclos iniciados antes disto são ignorados (sem alertas retroativos). */
  enabledAt: string | null;
}

export const defaultSlaConfig = (): SlaConfig => ({
  enabled: false,
  sound: true,
  desktop: false,
  supervisorAlerts: true,
  highlight: true,
  warningMinutes: 2,
  urgentMinutes: 3,
  violatedMinutes: 5,
  tone: "classic",
  volume: 70,
  supervisorIds: [],
  holidays: [],
  onlyBusinessHours: false,
  enabledAt: null,
});

const KEY = "sla";

function parse(raw: unknown): SlaConfig {
  const base = defaultSlaConfig();
  const value = (raw as { value?: unknown } | null)?.value ?? raw;
  if (typeof value !== "string" || !value) return base;
  try {
    return { ...base, ...(JSON.parse(value) as Partial<SlaConfig>) };
  } catch {
    return base;
  }
}

export const slaConfigQuery = (companyId: string) =>
  queryOptions({
    queryKey: ["settings", companyId, KEY],
    queryFn: async ({ signal }) => {
      try {
        return parse(await apiRequest<unknown>(settingEndpoints.detail(KEY), { signal }));
      } catch {
        return defaultSlaConfig();
      }
    },
    staleTime: 60_000,
  });

export function validateSla(c: SlaConfig): string | null {
  if (!(c.warningMinutes > 0 && c.warningMinutes < c.urgentMinutes && c.urgentMinutes < c.violatedMinutes))
    return "order";
  return null;
}

export const saveSlaConfig = (previous: SlaConfig, next: SlaConfig) => {
  const value: SlaConfig = {
    ...next,
    // Ao reativar, só ciclos novos são monitorados.
    enabledAt: next.enabled ? (previous.enabled ? previous.enabledAt : new Date().toISOString()) : null,
  };
  return apiRequest<unknown>(settingEndpoints.detail(KEY), {
    method: "PUT",
    body: { value: JSON.stringify(value) },
  });
};

export interface SlaInfo {
  state: SlaState;
  startedAt: number | null;
  elapsedMs: number;
  /** Tempo até a violação (negativo quando já violado). */
  remainingMs: number;
}

const NONE: SlaInfo = { state: "none", startedAt: null, elapsedMs: 0, remainingMs: 0 };

/** Estimativa no navegador: aguardando resposta = mensagens não lidas em conversa ativa. */
export function computeSla(ticket: Ticket, c: SlaConfig, now = Date.now()): SlaInfo {
  if (!c.enabled) return NONE;
  if (ticket.status === "closed" || ticket.isGroup || ticket.contact?.isGroup) return NONE;
  if (!ticket.unreadMessages) return NONE;
  const today = new Date(now).toISOString().slice(0, 10);
  if (c.holidays.includes(today)) return NONE;
  const start = new Date(ticket.updatedAt).getTime();
  if (Number.isNaN(start)) return NONE;
  if (c.enabledAt && start < new Date(c.enabledAt).getTime()) return NONE;
  const elapsedMs = Math.max(0, now - start);
  const min = elapsedMs / 60_000;
  const state: SlaState =
    min >= c.violatedMinutes
      ? "violated"
      : min >= c.urgentMinutes
        ? "urgent"
        : min >= c.warningMinutes
          ? "warning"
          : "monitoring";
  return { state, startedAt: start, elapsedMs, remainingMs: c.violatedMinutes * 60_000 - elapsedMs };
}

export function formatDuration(ms: number) {
  const abs = Math.abs(ms);
  const m = Math.floor(abs / 60_000);
  const s = Math.floor((abs % 60_000) / 1000);
  return `${ms < 0 ? "-" : ""}${m}:${String(s).padStart(2, "0")}`;
}

let ctx: AudioContext | null = null;
/** Toca um dos quatro tons; precisa de um gesto do usuário antes (política dos navegadores). */
export function playSlaTone(tone: SlaTone, volume: number) {
  try {
    const A =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!A) return;
    ctx ??= new A();
    void ctx.resume();
    const patterns: Record<SlaTone, [number, number, number][]> = {
      classic: [[880, 0, 0.25]],
      double: [[880, 0, 0.15], [880, 0.22, 0.15]],
      urgent: [[1200, 0, 0.12], [900, 0.15, 0.12], [1200, 0.3, 0.12], [900, 0.45, 0.12]],
      soft: [[520, 0, 0.5]],
    };
    const gainValue = Math.max(0, Math.min(1, volume / 100)) * 0.4;
    for (const [freq, at, dur] of patterns[tone]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = tone === "soft" ? "sine" : "square";
      osc.frequency.value = freq;
      const t0 = ctx.currentTime + at;
      gain.gain.setValueAtTime(gainValue, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    }
  } catch {
    /* Áudio indisponível neste dispositivo. */
  }
}
