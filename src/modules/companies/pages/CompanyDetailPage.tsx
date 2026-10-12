import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateDisplay, EmptyState, LoadingState, MoneyDisplay, PageHeader, QueryBoundary, QueryError } from "@/shared/components";
import { CompanyStatusBadge, InvoiceStatusBadge, SubscriptionStatusBadge } from "@/modules/platform-admin/components/badges";
import { UsageProgress } from "@/modules/platform-admin/components/UsageProgress";
import { PlanFeatureList } from "@/modules/plans/components/PlanFeatureList";
import { planContracts, planQuery } from "@/modules/plans/api";
import { billingContracts, invoicesQuery, subscriptionsQuery } from "@/modules/billing/api";
import { auditContract, auditQuery } from "@/modules/audit/api";
import { AuditEventTable } from "@/modules/audit/components/AuditEventTable";
import { companyContracts, companyQuery, companyUsageQuery } from "../api";
import { SensitiveActionDialog } from "../components/SensitiveActionDialog";
import type { Company, CompanyAction } from "../types";

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words">{children}</dd>
    </div>
  );
}

function availableActions(c: Company): CompanyAction[] {
  const list: CompanyAction[] = [];
  if (c.status === "onboarding" || c.status === "trial") list.push("activate");
  if (c.status === "trial") list.push("endTrial");
  if (c.status === "suspended" || c.status === "overdue") list.push("reactivate");
  if (c.status !== "suspended" && c.status !== "cancelled") list.push("suspend");
  if (c.status !== "cancelled") list.push("changePlan", "changeDueDate", "extendLimits", "cancel");
  return list;
}

function UsagePanel({ companyId }: { companyId: string }) {
  const { t } = useTranslation("platform");
  const q = useQuery(companyUsageQuery(companyId));
  return (
    <QueryBoundary query={q} contract={companyContracts.usage}>
      {(u) => (
        <div className="space-y-5">
          <UsageProgress label={t("usage.users")} used={u.users.used} limit={u.users.limit} />
          <UsageProgress label={t("usage.connections")} used={u.connections.used} limit={u.connections.limit} />
          <UsageProgress label={t("usage.storage")} used={u.storage.usedMb} limit={u.storage.limitMb} unit="mb" />
          {u.updatedAt && (
            <p className="text-xs text-muted-foreground">
              {t("usage.updatedAt")} <DateDisplay value={u.updatedAt} withTime />
            </p>
          )}
        </div>
      )}
    </QueryBoundary>
  );
}

function SummaryPanel({ companyId, kind }: { companyId: string; kind: "users" | "connections" }) {
  const { t } = useTranslation("platform");
  const q = useQuery(companyUsageQuery(companyId));
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t(kind === "users" ? "companies.detail.usersSummary" : "companies.detail.connectionsSummary")}</p>
      <QueryBoundary query={q} contract={companyContracts.usage}>
        {(u) => (
          <UsageProgress label={t(`usage.${kind}`)} used={u[kind].used} limit={u[kind].limit} />
        )}
      </QueryBoundary>
      <Button variant="outline" disabled aria-disabled="true">
        {t(kind === "users" ? "companies.detail.manageUsers" : "companies.detail.manageConnections")}
      </Button>
    </div>
  );
}

export function CompanyDetailPage({ companyId }: { companyId: string }) {
  const { t } = useTranslation(["platform", "common"]);
  const q = useQuery(companyQuery(companyId));
  const [action, setAction] = useState<CompanyAction | null>(null);
  const [tab, setTab] = useState("overview");
  const plan = useQuery({ ...planQuery(q.data?.planId ?? ""), enabled: !!q.data?.planId });
  const subs = useQuery({ ...subscriptionsQuery({ page: 1, pageSize: 10, companyId }), enabled: tab === "subscription" });
  const invoices = useQuery({ ...invoicesQuery({ page: 1, pageSize: 20, companyId }), enabled: tab === "invoices" });
  const audit = useQuery({ ...auditQuery({ page: 1, pageSize: 20, companyId }), enabled: tab === "audit" });

  if (q.isPending) return <LoadingState />;
  if (q.error || !q.data) return <QueryError error={q.error} contract={companyContracts.detail} onRetry={() => void q.refetch()} />;
  const c = q.data;
  const tabs = ["overview", "subscription", "limits", "users", "connections", "features", "invoices", "audit"] as const;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={c.tradeName}
        description={c.legalName}
        actions={
          <Button asChild variant="outline">
            <Link to="/app/plataforma/empresas/$companyId/editar" params={{ companyId }}>
              <Pencil className="size-4" aria-hidden /> {t("common:actions.edit")}
            </Link>
          </Button>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <CompanyStatusBadge status={c.status} />
        <span className="text-sm text-muted-foreground">{plan.data?.name ?? c.planName ?? c.planId}</span>
      </div>

      <section className="rounded-xl border bg-card p-4" aria-labelledby="acoes">
        <h2 id="acoes" className="mb-3 text-sm font-semibold">
          {t("companies.detail.actionsTitle")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {availableActions(c).map((a) => (
            <Button key={a} size="sm" variant={a === "suspend" || a === "cancel" ? "destructive" : "outline"} onClick={() => setAction(a)}>
              {t(`actions.${a}`)}
            </Button>
          ))}
        </div>
      </section>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto">
          <TabsList className="w-max">
            {tabs.map((k) => (
              <TabsTrigger key={k} value={k}>
                {t(`companies.detail.tabs.${k}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="mt-4 rounded-xl border bg-card p-5 shadow-soft">
          <TabsContent value="overview" className="mt-0">
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <Info label={t("companies.detail.fields.legalName")}>{c.legalName}</Info>
              <Info label={t("companies.detail.fields.tradeName")}>{c.tradeName}</Info>
              <Info label={t("companies.detail.fields.document")}>{c.document}</Info>
              <Info label={t("companies.detail.fields.email")}>{c.email}</Info>
              <Info label={t("companies.detail.fields.phone")}>{c.phone}</Info>
              <Info label={t("companies.detail.fields.responsibleName")}>{c.responsibleName}</Info>
              <Info label={t("companies.detail.fields.dueDate")}>
                <DateDisplay value={c.dueDate} />
              </Info>
              <Info label={t("companies.detail.fields.trialEndsAt")}>
                <DateDisplay value={c.trialEndsAt} />
              </Info>
              <Info label={t("companies.detail.fields.createdAt")}>
                <DateDisplay value={c.createdAt} withTime />
              </Info>
              {c.internalNotes && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <Info label={t("companies.detail.fields.internalNotes")}>
                    <span className="whitespace-pre-wrap text-sm">{c.internalNotes}</span>
                  </Info>
                </div>
              )}
            </dl>
          </TabsContent>

          <TabsContent value="subscription" className="mt-0">
            <QueryBoundary query={subs} contract={billingContracts.subscriptions}>
              {(page) =>
                page.data.length === 0 ? (
                  <EmptyState title={t("companies.detail.noSubscription")} />
                ) : (
                  <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {page.data.slice(0, 1).map((s) => (
                      <div key={s.id} className="contents">
                        <Info label={t("subscriptions.columns.status")}>
                          <SubscriptionStatusBadge status={s.status} />
                        </Info>
                        <Info label={t("subscriptions.columns.cycle")}>{t(`billingCycle.${s.billingCycle}`)}</Info>
                        <Info label={t("subscriptions.columns.plan")}>{s.planName ?? s.planId}</Info>
                        <Info label={t("subscriptions.columns.period")}>
                          <DateDisplay value={s.currentPeriodStart} /> – <DateDisplay value={s.currentPeriodEnd} />
                        </Info>
                        <Info label={t("subscriptions.columns.nextCharge")}>
                          <DateDisplay value={s.nextChargeAt ?? null} />
                        </Info>
                      </div>
                    ))}
                  </dl>
                )
              }
            </QueryBoundary>
          </TabsContent>

          <TabsContent value="limits" className="mt-0">
            <UsagePanel companyId={companyId} />
          </TabsContent>
          <TabsContent value="users" className="mt-0">
            <SummaryPanel companyId={companyId} kind="users" />
          </TabsContent>
          <TabsContent value="connections" className="mt-0">
            <SummaryPanel companyId={companyId} kind="connections" />
          </TabsContent>

          <TabsContent value="features" className="mt-0">
            <QueryBoundary query={plan} contract={planContracts.detail}>
              {(p) => <PlanFeatureList features={p.features} />}
            </QueryBoundary>
          </TabsContent>

          <TabsContent value="invoices" className="mt-0">
            <QueryBoundary query={invoices} contract={billingContracts.invoices}>
              {(page) =>
                page.data.length === 0 ? (
                  <EmptyState title={t("invoices.empty")} />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("invoices.columns.id")}</TableHead>
                          <TableHead>{t("invoices.columns.amount")}</TableHead>
                          <TableHead>{t("invoices.columns.status")}</TableHead>
                          <TableHead>{t("invoices.columns.dueDate")}</TableHead>
                          <TableHead>{t("invoices.columns.paidAt")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {page.data.map((i) => (
                          <TableRow key={i.id}>
                            <TableCell className="font-mono text-xs">{i.id}</TableCell>
                            <TableCell>
                              <MoneyDisplay cents={i.amountInCents} currency={i.currency} />
                            </TableCell>
                            <TableCell>
                              <InvoiceStatusBadge status={i.status} />
                            </TableCell>
                            <TableCell>
                              <DateDisplay value={i.dueDate} />
                            </TableCell>
                            <TableCell>
                              <DateDisplay value={i.paidAt} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              }
            </QueryBoundary>
          </TabsContent>

          <TabsContent value="audit" className="mt-0">
            <QueryBoundary query={audit} contract={auditContract}>
              {(page) => <AuditEventTable events={page.data} hideCompany />}
            </QueryBoundary>
          </TabsContent>
        </div>
      </Tabs>

      <SensitiveActionDialog key={action ?? "none"} company={c} action={action} onClose={() => setAction(null)} />
    </div>
  );
}
