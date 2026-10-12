import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
} from "lucide-react";
import { MoneyDisplay, PageHeader, QueryError } from "@/shared/components";
import { isApiError } from "@/shared/api/errors";
import { formatNumber } from "@/shared/format/format";
import { dashboardContract, platformDashboardQuery } from "../api";
import { PlatformMetricCard } from "../components/PlatformMetricCard";

export function PlatformDashboardPage() {
  const { t } = useTranslation("platform");
  const q = useQuery(platformDashboardQuery());
  const d = q.data;
  // Sem endpoint confirmado (404) os cards mostram "Dados indisponíveis" com o contrato.
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

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title={t("dashboard.title")} description={t("dashboard.subtitle")} />
      {hardError ? (
        <QueryError error={q.error} contract={dashboardContract} onRetry={() => void q.refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {card(
              t("dashboard.metrics.active"),
              <Building2 className="size-4" />,
              n(d?.companies.active),
            )}
            {card(
              t("dashboard.metrics.trial"),
              <FlaskConical className="size-4" />,
              n(d?.companies.trial),
            )}
            {card(
              t("dashboard.metrics.overdue"),
              <CalendarX className="size-4" />,
              n(d?.companies.overdue),
              "warning",
            )}
            {card(
              t("dashboard.metrics.suspended"),
              <Ban className="size-4" />,
              n(d?.companies.suspended),
              "danger",
            )}
            {card(t("dashboard.metrics.users"), <Users className="size-4" />, n(d?.usersTotal))}
            {card(
              t("dashboard.metrics.connections"),
              <Smartphone className="size-4" />,
              n(d?.connectionsContracted),
            )}
            {card(
              t("dashboard.metrics.revenue"),
              <Wallet className="size-4" />,
              d ? <MoneyDisplay cents={d.monthlyRevenueInCents} /> : null,
            )}
            {card(
              t("dashboard.metrics.pendingInvoices"),
              <Receipt className="size-4" />,
              n(d?.pendingInvoices),
              "warning",
            )}
            {card(
              t("dashboard.metrics.delinquency"),
              <TrendingDown className="size-4" />,
              d
                ? `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(d.delinquencyPercent)}%`
                : null,
              "danger",
            )}
          </div>

          <section className="rounded-xl border bg-card p-5 shadow-soft">
            <h2 className="text-lg font-semibold">{t("dashboard.usageByPlan")}</h2>
            {loading ? null : !d ? (
              <PlatformMetricCard label="" icon={null} unavailable contract={dashboardContract} />
            ) : d.usageByPlan.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {t("dashboard.usageByPlanEmpty")}
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {(() => {
                  const max = Math.max(...d.usageByPlan.map((u) => u.companies), 1);
                  return d.usageByPlan.map((u) => (
                    <li key={u.planId}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{u.planName}</span>
                        <span className="text-muted-foreground">
                          {t("dashboard.companiesCount", { count: u.companies })}
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
