import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Activity, Cpu, Database, Globe, HardDrive, MemoryStick, Radio, Server, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConnectivity } from "@/shared/connectivity/connectivity";
import { useSocketStatus } from "@/shared/socket/socket-client";
import {
  VPS_CAPACITY,
  VPS_LIMITS,
  appendSample,
  connectionLevel,
  cpuPercent,
  levelOf,
  serverHealthQuery,
  serverMetricsContract,
  serviceState,
  type HealthLevel,
  type MetricsSample,
  type ServiceState,
} from "../vps-health";
import type { PlatformDashboard } from "../api";

const BAR: Record<HealthLevel, string> = {
  ok: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
};
const TEXT: Record<HealthLevel, string> = {
  ok: "text-success",
  warning: "text-warning-foreground dark:text-warning",
  danger: "text-destructive",
};

function Gauge({
  label,
  icon,
  percent,
  detail,
  level,
}: {
  label: string;
  icon: React.ReactNode;
  percent: number;
  detail: string;
  level: HealthLevel;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className={cn("font-display text-lg font-bold tabular-nums", TEXT[level])}>
          {percent.toFixed(1).replace(".", ",")}%
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-muted" aria-hidden>
        <div
          className={cn("h-full rounded-full transition-all", BAR[level])}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${Math.floor((seconds % 3600) / 60)}min`;
}

const STATE_STYLE: Record<ServiceState, string> = {
  online: "bg-success/15 text-success",
  offline: "bg-destructive/15 text-destructive",
  not_configured: "bg-muted text-muted-foreground",
  unknown: "bg-muted text-muted-foreground",
};

function ServiceBadge({ status }: { status: string | null | undefined }) {
  const { t } = useTranslation("platform");
  const state = serviceState(status);
  return (
    <span
      className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", STATE_STYLE[state])}
    >
      {t(`vps.state.${state}`)}
    </span>
  );
}

/** Mini-gráfico do histórico real coletado nesta sessão do painel. */
function Sparkline({ samples, pick, level }: { samples: MetricsSample[]; pick: (s: MetricsSample) => number | null; level: HealthLevel }) {
  const { t } = useTranslation("platform");
  const points = samples.map(pick).filter((v): v is number => v != null);
  if (points.length < 2) {
    return <p className="mt-2 text-xs text-muted-foreground">{t("vps.historyCollecting")}</p>;
  }
  const w = 100;
  const h = 24;
  const step = w / (points.length - 1);
  const d = points
    .map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - (Math.min(100, v) / 100) * h).toFixed(1)}`)
    .join(" ");
  const stroke =
    level === "danger" ? "var(--destructive)" : level === "warning" ? "var(--warning)" : "var(--success)";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-6 w-full" preserveAspectRatio="none" aria-hidden>
      <path d={d} fill="none" stroke={stroke} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function VpsHealthSection({ dashboard }: { dashboard: PlatformDashboard | undefined }) {
  const { t } = useTranslation("platform");
  const { t: tc } = useTranslation("common");
  const q = useQuery(serverHealthQuery());
  const health = q.data ?? null;
  const connectivity = useConnectivity();
  const socketStatus = useSocketStatus();

  const online = dashboard?.connectionsOnline ?? 0;
  const companies = dashboard?.companies.active ?? 0;
  const connLevel = connectionLevel(online);
  const cpuPct = health ? cpuPercent(health.cpu) : 0;
  const diskPct = health?.disk?.usedPercent ?? null;

  // Histórico real: acumula as amostras coletadas a cada 30s nesta sessão.
  const [history, setHistory] = useState<MetricsSample[]>([]);
  const collectedAt = health?.collectedAt;
  useEffect(() => {
    if (!health || !collectedAt) return;
    const at = new Date(collectedAt).getTime();
    if (Number.isNaN(at)) return;
    setHistory((h) =>
      appendSample(h, { at, cpu: cpuPct, memory: health.memory.usedPercent, disk: diskPct }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectedAt]);

  const alerts: string[] = [];
  if (health) {
    if (levelOf(cpuPct, VPS_LIMITS.cpuPercent) === "danger")
      alerts.push(t("vps.alertCpu", { limit: VPS_LIMITS.cpuPercent }));
    if (levelOf(health.memory.usedPercent, VPS_LIMITS.memoryPercent) === "danger")
      alerts.push(t("vps.alertMemory", { limit: VPS_LIMITS.memoryPercent }));
    if (diskPct != null && diskPct >= VPS_LIMITS.diskPercent)
      alerts.push(t("vps.alertDisk", { limit: VPS_LIMITS.diskPercent }));
    else if (diskPct != null && diskPct >= VPS_LIMITS.diskWarningPercent)
      alerts.push(t("vps.alertDiskWarning", { limit: VPS_LIMITS.diskWarningPercent }));
    // Alerta somente em falha real confirmada: "não configurado" ou status
    // desconhecido nunca derrubam o painel (ex.: Wuzapi não utilizado).
    const down = [
      serviceState(health.redis?.status) === "offline" ? "Redis" : null,
      serviceState(health.wuzapi?.status) === "offline" ? "Wuzapi" : null,
    ].filter(Boolean);
    if (down.length > 0) alerts.push(t("vps.alertServices", { names: down.join(", ") }));
  }
  if (connLevel === "danger")
    alerts.push(t("vps.alertConnections", { count: online, limit: VPS_LIMITS.activeConnections }));

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          <Server className="size-4" aria-hidden />
          {t("vps.title")}
        </h2>
        <span className="text-xs text-muted-foreground">
          {health
            ? t("vps.live", {
                host: health.general.hostname,
                uptime: formatUptime(health.uptimeSeconds),
              })
            : t("vps.estimated", { contract: serverMetricsContract })}
          {" · "}
          {t("vps.capacity", {
            cores: VPS_CAPACITY.cpuCores,
            ram: VPS_CAPACITY.memoryGb,
            disk: VPS_CAPACITY.diskGb,
          })}
        </span>
      </div>

      {alerts.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm"
        >
          <p className="font-semibold text-destructive">{t("vps.alertsTitle")}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-foreground">
            {alerts.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">{t("vps.alertsHint")}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {health ? (
          <>
            <Gauge
              label={t("vps.cpu")}
              icon={<Cpu className="size-4" />}
              percent={cpuPct}
              detail={t("vps.cpuDetail", {
                load: health.cpu.loadAverage1m.toFixed(2).replace(".", ","),
                cores: health.cpu.cores,
              })}
              level={levelOf(cpuPct, VPS_LIMITS.cpuPercent)}
            />
            <Gauge
              label={t("vps.memory")}
              icon={<MemoryStick className="size-4" />}
              percent={health.memory.usedPercent}
              detail={t("vps.memoryDetail", {
                used: health.memory.used,
                total: health.memory.total,
              })}
              level={levelOf(health.memory.usedPercent, VPS_LIMITS.memoryPercent)}
            />
            {health.disk?.usedPercent != null ? (
              <Gauge
                label={t("vps.disk")}
                icon={<HardDrive className="size-4" />}
                percent={health.disk.usedPercent}
                detail={
                  health.disk.used && health.disk.total
                    ? t("vps.diskDetail", { used: health.disk.used, total: health.disk.total })
                    : t("vps.unavailable")
                }
                level={levelOf(health.disk.usedPercent, VPS_LIMITS.diskPercent)}
              />
            ) : (
              <Gauge
                label={t("vps.disk")}
                icon={<HardDrive className="size-4" />}
                percent={0}
                detail={t("vps.unavailable")}
                level="ok"
              />
            )}
          </>
        ) : (
          <>
            <Gauge
              label={t("vps.companies")}
              icon={<Activity className="size-4" />}
              percent={Math.min(100, (companies / VPS_LIMITS.activeConnections) * 100)}
              detail={t("vps.companiesDetail", { count: companies })}
              level={connectionLevel(companies)}
            />
            <Gauge
              label={t("vps.cpu")}
              icon={<Cpu className="size-4" />}
              percent={0}
              detail={t("vps.installHint")}
              level="ok"
            />
            <Gauge
              label={t("vps.memory")}
              icon={<MemoryStick className="size-4" />}
              percent={0}
              detail={t("vps.installHint")}
              level="ok"
            />
          </>
        )}
        <Gauge
          label={t("vps.connections")}
          icon={<Smartphone className="size-4" />}
          percent={Math.min(100, (online / VPS_LIMITS.activeConnections) * 100)}
          detail={t("vps.connectionsDetail", { count: online, limit: VPS_LIMITS.activeConnections })}
          level={connLevel}
        />
      </div>

      {health && (
        <div className="rounded-xl border bg-card p-4 text-sm shadow-soft">
          <p className="flex items-center gap-2 font-medium text-muted-foreground">
            <Activity className="size-4" aria-hidden />
            {t("vps.historyTitle")}
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">{t("vps.cpu")}</p>
              <Sparkline samples={history} pick={(s) => s.cpu} level={levelOf(cpuPct, VPS_LIMITS.cpuPercent)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("vps.memory")}</p>
              <Sparkline samples={history} pick={(s) => s.memory} level={levelOf(health.memory.usedPercent, VPS_LIMITS.memoryPercent)} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("vps.disk")}</p>
              <Sparkline samples={history} pick={(s) => s.disk} level={diskPct != null ? levelOf(diskPct, VPS_LIMITS.diskPercent) : "ok"} />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("vps.historyHint", { minutes: Math.round((history.length * 30) / 60) })}
          </p>
        </div>
      )}

      <div className="rounded-xl border bg-card p-4 text-sm shadow-soft">
        <p className="flex items-center gap-2 font-medium text-muted-foreground">
          <Smartphone className="size-4" aria-hidden />
          {t("vps.whatsappTitle")}
        </p>
        <ul className="mt-2 grid gap-1.5 sm:grid-cols-3">
          <li className="flex items-center justify-between gap-2">
            <span>{t("vps.whatsappActive")}</span>
            <span className="inline-flex rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-success">
              {online}
            </span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span>{t("vps.whatsappAwaitingQr")}</span>
            <span className="inline-flex rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-warning-foreground dark:text-warning">
              {dashboard?.connectionsAwaitingQr ?? 0}
            </span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span>{t("vps.whatsappDisconnected")}</span>
            <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground">
              {dashboard?.connectionsDisconnected ?? 0}
            </span>
          </li>
        </ul>
      </div>

      {health && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border bg-card p-4 text-sm shadow-soft">
            <p className="flex items-center gap-2 font-medium text-muted-foreground">
              <Database className="size-4" aria-hidden />
              {t("vps.services")}
            </p>
            <ul className="mt-2 space-y-1.5">
              {[
                { name: "Redis", status: health.redis?.status },
                { name: "Wuzapi", status: health.wuzapi?.status },
                { name: "Backend (Node)", status: health.status },
              ].map((s) => (
                <li key={s.name} className="flex items-center justify-between gap-2">
                  <span>{s.name}</span>
                  <ServiceBadge status={s.status} />
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">{t("vps.servicesHint")}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-sm shadow-soft">
            <p className="flex items-center gap-2 font-medium text-muted-foreground">
              <Server className="size-4" aria-hidden />
              {t("vps.system")}
            </p>
            <dl className="mt-2 space-y-1.5">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{t("vps.sysPlatform")}</dt>
                <dd className="text-right">
                  {health.general.platform} {health.general.release} ({health.general.arch})
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{t("vps.sysNode")}</dt>
                <dd>{health.general.nodeVersion}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{t("vps.sysCpuModel")}</dt>
                <dd className="text-right">{health.cpu.model}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">{t("vps.sysProcessUptime")}</dt>
                <dd>{formatUptime(health.processUptimeSeconds)}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </section>
  );
}
