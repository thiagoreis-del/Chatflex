import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { settingEndpoints as ep } from "@/shared/config/endpoints";

/**
 * Horário de atendimento e mensagem fora do expediente, por empresa (empresa do token).
 * CONTRATO PENDENTE: chave `businessHours` em /settings (valor JSON); o envio automático
 * fora do horário precisa ser feito pelo backend.
 */
export interface DayHours {
  enabled: boolean;
  start: string;
  end: string;
}

export interface BusinessHoursSetting {
  timezone: string;
  days: DayHours[]; // 0 = domingo … 6 = sábado
  outOfHoursEnabled: boolean;
  outOfHoursMessage: string;
}

const KEY = "businessHours";

export const defaultBusinessHours = (): BusinessHoursSetting => ({
  timezone: "America/Sao_Paulo",
  days: Array.from({ length: 7 }, (_, i) => ({
    enabled: i >= 1 && i <= 5,
    start: "08:00",
    end: "18:00",
  })),
  outOfHoursEnabled: false,
  outOfHoursMessage: "",
});

function parse(raw: unknown): BusinessHoursSetting {
  const base = defaultBusinessHours();
  const value = (raw as { value?: unknown } | null)?.value ?? raw;
  if (typeof value !== "string" || !value) return base;
  try {
    const v = JSON.parse(value) as Partial<BusinessHoursSetting>;
    return {
      timezone: v.timezone || base.timezone,
      days: base.days.map((d, i) => ({ ...d, ...(v.days?.[i] ?? {}) })),
      outOfHoursEnabled: Boolean(v.outOfHoursEnabled),
      outOfHoursMessage: String(v.outOfHoursMessage ?? ""),
    };
  } catch {
    return base;
  }
}

export const businessHoursQuery = (companyId: string) =>
  queryOptions({
    queryKey: ["settings", companyId, KEY],
    queryFn: async ({ signal }) => parse(await apiRequest<unknown>(ep.detail(KEY), { signal })),
    staleTime: 5 * 60_000,
  });

export const saveBusinessHours = (s: BusinessHoursSetting) =>
  apiRequest<unknown>(ep.detail(KEY), { method: "PUT", body: { value: JSON.stringify(s) } });

/** Verdadeiro se `now` está dentro do expediente configurado (no fuso da empresa). */
export function isWithinBusinessHours(s: BusinessHoursSetting, now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: s.timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const d = s.days[day];
  if (!d?.enabled) return false;
  const hm = `${get("hour").replace("24", "00")}:${get("minute")}`;
  return hm >= d.start && hm < d.end;
}
