import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Activity, Cpu, HardDrive, MemoryStick, Server, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  VPS_LIMITS,
  connectionLevel,
  levelOf,
  serverHealthContract,
  serverHealthQuery,
  type HealthLevel,
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

export function VpsHealthSection({ dashboard }: { dashboard: PlatformDashboard | undefined }) {
  const { t } = useTranslation("platform");
  const q = useQuery(serverHealthQuery());
  const health = q.data ?? null;

  const online = dashboard?.connectionsOnline ?? 0;
  const companies = dashboard?.companies.active ?? 0;
  const connLevel = connectionLevel(online);

  const alerts: string[] = [];
  if (health) {
    if (levelOf(health.cpu.percent, VPS_LIMITS.cpuPercent) === "danger")
      alerts.push(t("vps.alertCpu", { limit: VPS_LIMITS.cpuPercent }));
    if (levelOf(health.memory.percent, VPS_LIMITS.memoryPercent) === "danger")
      alerts.push(t("vps.alertMemory", { limit: VPS_LIMITS.memoryPercent }));
    if (health.disk && levelOf(health.disk.percent, VPS_LIMITS.diskPercent) === "danger")
      alerts.push(t("vps.alertDisk", { limit: VPS_LIMITS.diskPercent }));
    const crashed = health.pm2?.filter((p) => p.status !== "online") ?? [];
    if (crashed.length > 0)
      alerts.push(t("vps.alertPm2", { names: crashed.map((p) => p.name).join(", ") }));
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
            ? t("vps.live", { host: health.hostname, uptime: formatUptime(health.uptimeSeconds) })
            : t("vps.estimated", { contract: serverHealthContract })}
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
              percent={health.cpu.percent}
              detail={t("vps.cpuDetail", { load: health.cpu.loadAvg1m, cores: health.cpu.cores })}
              level={levelOf(health.cpu.percent, VPS_LIMITS.cpuPercent)}
            />
            <Gauge
              label={t("vps.memory")}
              icon={<MemoryStick className="size-4" />}
              percent={health.memory.percent}
              detail={t("vps.memoryDetail", {
                used: health.memory.usedMB,
                total: health.memory.totalMB,
              })}
              level={levelOf(health.memory.percent, VPS_LIMITS.memoryPercent)}
            />
            {health.disk ? (
              <Gauge
                label={t("vps.disk")}
                icon={<HardDrive className="size-4" />}
                percent={health.disk.percent}
                detail={t("vps.diskDetail", { used: health.disk.usedGB, total: health.disk.totalGB })}
                level={levelOf(health.disk.percent, VPS_LIMITS.diskPercent)}
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

      {health?.pm2 && health.pm2.length > 0 && (
        <div className="overflow-x-auto rounded-xl border bg-card shadow-soft">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2.5 font-medium">{t("vps.pm2Process")}</th>
                <th className="px-4 py-2.5 font-medium">{t("vps.pm2Status")}</th>
                <th className="px-4 py-2.5 font-medium">{t("vps.pm2Cpu")}</th>
                <th className="px-4 py-2.5 font-medium">{t("vps.pm2Memory")}</th>
                <th className="px-4 py-2.5 font-medium">{t("vps.pm2Restarts")}</th>
                <th className="px-4 py-2.5 font-medium">{t("vps.pm2Uptime")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {health.pm2.map((p) => (
                <tr key={p.name}>
                  <td className="px-4 py-2.5 font-medium">{p.name}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        p.status === "online"
                          ? "bg-success/15 text-success"
                          : "bg-destructive/15 text-destructive",
                      )}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums">{p.cpuPercent}%</td>
                  <td className="px-4 py-2.5 tabular-nums">{p.memoryMB} MB</td>
                  <td className="px-4 py-2.5 tabular-nums">{p.restarts}</td>
                  <td className="px-4 py-2.5 tabular-nums">
                    {p.uptimeSeconds != null ? formatUptime(p.uptimeSeconds) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
