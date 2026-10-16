import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { env } from "@/shared/config/env";
import {
  businessHoursEndpoints as bh,
  settingEndpoints,
  whatsappEndpoints,
} from "@/shared/config/endpoints";

/**
 * Horário de atendimento e mensagem fora do expediente.
 * Usa as estruturas que o backend ZapPro já lê ao receber mensagens:
 * Companies.schedules + CompaniesSettings.scheduleType="company" + Whatsapps.outOfHoursMessage.
 * Com isso o próprio servidor envia a mensagem automática fora do horário.
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

const WEEKDAY_EN = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const WEEKDAY_PT = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

interface BackendSchedule {
  weekday?: string;
  weekdayEn?: string;
  startTimeA?: string;
  endTimeA?: string;
  startTimeB?: string;
  endTimeB?: string;
}

interface BackendConnection {
  id: number;
  outOfHoursMessage?: string | null;
  queues?: { id: number }[];
  [key: string]: unknown;
}

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

function fromSchedules(list: BackendSchedule[] | null | undefined): DayHours[] {
  const base = defaultBusinessHours().days;
  if (!Array.isArray(list) || list.length === 0) return base;
  return base.map((d, i) => {
    const s = list.find((x) => x.weekdayEn?.toLowerCase() === WEEKDAY_EN[i]);
    if (!s) return { ...d, enabled: false };
    const start = s.startTimeA ?? "";
    const end = s.endTimeA ?? "";
    return start && end ? { enabled: true, start, end } : { ...d, enabled: false };
  });
}

/** Dia fechado vai com horários vazios: o backend trata como fora do expediente. */
function toSchedules(days: DayHours[]): BackendSchedule[] {
  return days.map((d, i) => ({
    weekday: WEEKDAY_PT[i] ?? "",
    weekdayEn: WEEKDAY_EN[i] ?? "",
    startTimeA: d.enabled ? d.start : "",
    endTimeA: d.enabled ? d.end : "",
    startTimeB: "",
    endTimeB: "",
  }));
}

// ---- Modo demonstração: guarda tudo em /settings (mocks) ----
const MOCK_KEY = "businessHours";
async function loadMock(): Promise<BusinessHoursSetting> {
  const raw = await apiRequest<{ value?: string }>(settingEndpoints.detail(MOCK_KEY));
  try {
    return { ...defaultBusinessHours(), ...(JSON.parse(raw?.value ?? "") as object) };
  } catch {
    return defaultBusinessHours();
  }
}

async function load(companyId: string): Promise<BusinessHoursSetting> {
  if (env.useMocks) return loadMock();
  const [company, mode, connections] = await Promise.all([
    apiRequest<{ schedules?: BackendSchedule[] }>(bh.company(companyId)),
    apiRequest<{ scheduleType?: string } | undefined>(bh.companySettingOne("scheduleType")).catch(
      () => undefined,
    ),
    apiRequest<BackendConnection[]>(whatsappEndpoints.list).catch(() => []),
  ]);
  const message =
    (Array.isArray(connections) ? connections : []).find((c) => c.outOfHoursMessage)
      ?.outOfHoursMessage ?? "";
  return {
    timezone: "America/Sao_Paulo",
    days: fromSchedules(company?.schedules),
    outOfHoursEnabled: mode?.scheduleType === "company",
    outOfHoursMessage: message,
  };
}

/**
 * Atualiza só a mensagem de uma conexão. O backend sobrescreve campos e filas omitidos,
 * então reenviamos a conexão completa (sem sessão/QR) com as filas atuais.
 */
async function saveConnectionMessage(id: number, message: string) {
  const full = await apiRequest<BackendConnection>(whatsappEndpoints.status(id));
  const { session: _s, qrcode: _q, status: _st, queues, ...rest } = full;
  void _s;
  void _q;
  void _st;
  await apiRequest(whatsappEndpoints.detail(id), {
    method: "PUT",
    body: {
      ...rest,
      queueIds: (queues ?? []).map((q) => q.id),
      outOfHoursMessage: message,
    },
  });
}

export async function saveBusinessHours(companyId: string, s: BusinessHoursSetting) {
  if (env.useMocks) {
    await apiRequest(settingEndpoints.detail(MOCK_KEY), {
      method: "PUT",
      body: { value: JSON.stringify(s) },
    });
    return;
  }
  await apiRequest(bh.schedules(companyId), {
    method: "PUT",
    body: { schedules: toSchedules(s.days) },
  });
  await apiRequest(bh.companySettings, {
    method: "PUT",
    body: { column: "scheduleType", data: s.outOfHoursEnabled ? "company" : "disabled" },
  });
  const connections = await apiRequest<BackendConnection[]>(whatsappEndpoints.list);
  for (const c of Array.isArray(connections) ? connections : []) {
    if ((c.outOfHoursMessage ?? "") !== s.outOfHoursMessage) {
      await saveConnectionMessage(c.id, s.outOfHoursMessage);
    }
  }
}

export const businessHoursQuery = (companyId: string) =>
  queryOptions({
    queryKey: ["settings", companyId, "businessHours"],
    queryFn: () => load(companyId),
    staleTime: 5 * 60_000,
  });

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
  return hm >= d.start && hm <= d.end;
}
