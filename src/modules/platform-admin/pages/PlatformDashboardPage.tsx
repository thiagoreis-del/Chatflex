import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  FlaskConical,
  CalendarX,
  Ban,
  Users,
  Smartphone,
  Wallet,
  Receipt,
  TrendingDown,
  Wifi,
  WifiOff,
  TrendingUp,
  RefreshCw,
  CalendarClock,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { MoneyDisplay, PageHeader, QueryError } from "@/shared/components";
import { Button } from "@/components/ui/button";
import { isApiError } from "@/shared/api/errors";
import { formatNumber } from "@/shared/format/format";
import { dashboardContract, platformDashboardQuery, type CompanyBrief } from "../api";
import { PlatformMetricCard } from "../components/PlatformMetricCard";

const DAY = 864e5;

export function PlatformDashboardPage() {
  const { t } = useTranslation("platform");
  const q = useQuery(platformDashboardQuery());
  const d = q.data;
  const unavailable = !d;
  const hardError = q.error && !(isApiError(q.error) && q.error.kind === "notFound");
  const loading = q.isPending;

  const n = (v: number | undefined) => (v === undefined ? null : formatNumber(v));
  const card = (
    label: string,
    icon: React.ReactNode,
    value: React.ReactNode,
    tone?: "warning" | "danger",
  ) => (
    <PlatformMetricCard
      label={label}
      icon={icon}
      value={loading ? "…" : value}
      unavailable={!loading && unavailable}
      contract={dashboardContract}
      {...(tone ? { tone } : {})}
    />
  );

  const updated = q.dataUpdatedAt
    ? new Date(q.dataUpdatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;
  const offline =
    d?.connectionsOnline !== undefined ? d.connectionsContracted - d.connectionsOnline : undefined;

  const section = (title: string, children: React.ReactNode) => (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">{children}</div>
    </section>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title={t("dashboard.title")} description={t("dashboard.subtitle")} />
        <div className="flex items-center gap-3">
          {updated && (
            <span className="text-xs text-muted-foreground">
              {t("dashboard.updatedAt", { time: updated })}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void q.refetch()}
            disabled={q.isFetching}
          >
            <RefreshCw className={`size-4 ${q.isFetching ? "animate-spin" : ""}`} aria-hidden />
            {t("dashboard.refresh")}
          </Button>
        </div>
      </div>

      {hardError ? (
        <QueryError error={q.error} contract={dashboardContract} onRetry={() => void q.refetch()} />
      ) : (
        <>
          {section(
            t("dashboard.sections.companies"),
            <>
              {card(t("dashboard.metrics.active"), <Building2 className="size-4" />, n(d?.companies.active))}
              {card(t("dashboard.metrics.trial"), <FlaskConical className="size-4" />, n(d?.companies.trial))}
              {card(t("dashboard.metrics.overdue"), <CalendarX className="size-4" />, n(d?.companies.overdue), "warning")}
              {card(t("dashboard.metrics.suspended"), <Ban className="size-4" />, n(d?.companies.suspended), "danger")}
            </>,
          )}
          {section(
            t("dashboard.sections.operation"),
            <>
              {card(t("dashboard.metrics.users"), <Users className="size-4" />, n(d?.usersTotal))}
              {card(t("dashboard.metrics.connections"), <Smartphone className="size-4" />, n(d?.connectionsContracted))}
              {card(t("dashboard.metrics2.online"), <Wifi className="size-4" />, n(d?.connectionsOnline))}
              {card(t("dashboard.metrics2.offline"), <WifiOff className="size-4" />, n(offline), "warning")}
            </>,
          )}
          {section(
            t("dashboard.sections.finance"),
            <>
              {card(t("dashboard.metrics.revenue"), <Wallet className="size-4" />, d ? <MoneyDisplay cents={d.monthlyRevenueInCents} /> : null)}
              {card(
                t("dashboard.metrics2.forecast"),
                <TrendingUp className="size-4" />,
                d?.forecastRevenueInCents !== undefined ? <MoneyDisplay cents={d.forecastRevenueInCents} /> : null,
              )}
              {card(t("dashboard.metrics.pendingInvoices"), <Receipt className="size-4" />, n(d?.pendingInvoices), "warning")}
              {card(
                t("dashboard.metrics.delinquency"),
                <TrendingDown className="size-4" />,
                d
                  ? `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(d.delinquencyPercent)}%`
                  : null,
                "danger",
              )}
            </>,
          )}

          {d && (
            <div className="grid gap-4 lg:grid-cols-3">
              <CompanyList
                title={t("dashboard.overdueList")}
                empty={t("dashboard.overdueEmpty")}
                icon={<AlertTriangle className="size-4 text-destructive" />}
                items={d.overdueList}
                meta={(c) => {
                  const days = Math.max(1, Math.floor((Date.now() - new Date(c.dueDate ?? 0).getTime()) / DAY));
                  return t("dashboard.daysLate", { count: days });
                }}
              />
              <CompanyList
                title={t("dashboard.dueSoon")}
                empty={t("dashboard.dueSoonEmpty")}
                icon={<CalendarClock className="size-4 text-primary" />}
                items={d.dueSoon}
                meta={(c) => {
                  const days = Math.ceil((new Date(c.dueDate ?? 0).getTime() - Date.now()) / DAY);
                  return days <= 0 ? t("dashboard.today") : t("dashboard.daysLeft", { count: days });
                }}
              />
              <CompanyList
                title={t("dashboard.recent")}
                empty={t("dashboard.recentEmpty")}
                icon={<Sparkles className="size-4 text-primary" />}
                items={d.recent}
                meta={(c) => (c.createdAt ? new Date(c.createdAt).toLocaleDateString("pt-BR") : "")}
              />
            </div>
          )}

          <section className="rounded-xl border bg-card p-5 shadow-soft">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">{t("dashboard.usageByPlan")}</h2>
              {d?.totalCompanies !== undefined && (
                <span className="text-sm text-muted-foreground">
                  {t("dashboard.totalCompanies", { count: d.totalCompanies })}
                </span>
              )}
            </div>
            {loading ? null : !d ? (
              <PlatformMetricCard label="" icon={null} unavailable contract={dashboardContract} />
            ) : d.usageByPlan.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t("dashboard.usageByPlanEmpty")}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {(() => {
                  const max = Math.max(...d.usageByPlan.map((u) => u.companies), 1);
                  return d.usageByPlan.map((u) => (
                    <li key={u.planId}>
                      <div className="flex flex-wrap justify-between gap-x-3 text-sm">
                        <span className="font-medium">{u.planName}</span>
                        <span className="text-muted-foreground">
                          {t("dashboard.companiesCount", { count: u.companies })}
                          {u.revenueInCents ? (
                            <>
                              {" · "}
                              <MoneyDisplay cents={u.revenueInCents} />
                            </>
                          ) : null}
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-muted" aria-hidden>
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(u.companies / max) * 100}%` }}
                        />
                      </div>
                    </li>
                  ));
                })()}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function CompanyList({
  title,
  empty,
  icon,
  items,
  meta,
}: {
  title: string;
  empty: string;
  icon: React.ReactNode;
  items: CompanyBrief[] | undefined;
  meta: (c: CompanyBrief) => string;
}) {
  return (
    <section className="rounded-xl border bg-card p-4 shadow-soft">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </h3>
      {!items || items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-3 divide-y">
          {items.map((c) => (
            <li key={c.id}>
              <Link
                to="/app/plataforma/empresas/$companyId"
                params={{ companyId: c.id }}
                className="flex items-center justify-between gap-3 py-2 text-sm hover:text-primary"
              >
                <span className="min-w-0 truncate font-medium">{c.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{meta(c)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
