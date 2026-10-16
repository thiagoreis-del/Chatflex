import { useQueryClient } from "@tanstack/react-query";
import { UserFormDialog, AccessDialog } from "@/modules/users/pages/UsersPage";
import type { AccessData } from "@/modules/users/access";
import { queuesQuery } from "@/modules/queues/api";
import { companyKeys } from "@/shared/api/query-keys";
import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { enterCompany } from "@/shared/auth/auth-service";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LogIn, MessagesSquare, Pencil, Plus, ShieldAlert, Smartphone, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImpersonationLogTable } from "@/modules/audit/components/ImpersonationLogTable";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DateDisplay,
  EmptyState,
  LoadingState,
  MoneyDisplay,
  PageHeader,
  QueryBoundary,
  QueryError,
} from "@/shared/components";
import {
  CompanyStatusBadge,
  InvoiceStatusBadge,
  SubscriptionStatusBadge,
} from "@/modules/platform-admin/components/badges";
import { UsageProgress } from "@/modules/platform-admin/components/UsageProgress";
import { PlanFeatureList } from "@/modules/plans/components/PlanFeatureList";
import { planContracts, planQuery } from "@/modules/plans/api";
import { billingContracts, invoicesQuery, subscriptionsQuery } from "@/modules/billing/api";
import { env } from "@/shared/config/env";
import { auditContract, auditQuery } from "@/modules/audit/api";
import { AuditEventTable } from "@/modules/audit/components/AuditEventTable";
import {
  companyConnectionsQuery,
  companyContracts,
  companyQuery,
  companyUsageQuery,
  companyUsersQuery,
} from "../api";
import type { WhatsAppStatus } from "@/modules/whatsapp/types";
import { SensitiveActionDialog } from "../components/SensitiveActionDialog";
import type { Company, CompanyAction } from "../types";

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 [overflow-wrap:anywhere]">{children}</dd>
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
          <UsageProgress
            label={t("usage.connections")}
            used={u.connections.used}
            limit={u.connections.limit}
          />
          {u.storage.limitMb > 0 && (
            <UsageProgress
              label={t("usage.storage")}
              used={u.storage.usedMb}
              limit={u.storage.limitMb}
              unit="mb"
            />
          )}
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

const connStatusVariant: Record<
  WhatsAppStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  CONNECTED: "default",
  DISCONNECTED: "destructive",
  qrcode: "secondary",
  OPENING: "secondary",
  PAIRING: "secondary",
  PENDING: "secondary",
  TIMEOUT: "outline",
};

function ConnectionsPanel({ companyId }: { companyId: string }) {
  const { t } = useTranslation(["platform", "whatsapp"]);
  const usage = useQuery(companyUsageQuery(companyId));
  const conns = useQuery(companyConnectionsQuery(companyId));
  return (
    <div className="space-y-4">
      <QueryBoundary query={usage} contract={companyContracts.usage}>
        {(u) => (
          <UsageProgress
            label={t("platform:usage.connections")}
            used={u.connections.used}
            limit={u.connections.limit}
          />
        )}
      </QueryBoundary>
      <QueryBoundary query={conns} contract="GET /whatsapp/all">
        {(list) =>
          list.length === 0 ? (
            <EmptyState title={t("platform:companies.detail.noConnections")} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("platform:companies.detail.connectionColumns.name")}</TableHead>
                    <TableHead>{t("platform:companies.detail.connectionColumns.number")}</TableHead>
                    <TableHead>{t("platform:companies.detail.connectionColumns.status")}</TableHead>
                    <TableHead>
                      {t("platform:companies.detail.connectionColumns.default")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.name}</TableCell>
                      <TableCell>{w.number ?? t("whatsapp:noNumber")}</TableCell>
                      <TableCell>
                        <Badge variant={connStatusVariant[w.status]}>
                          {t(`whatsapp:status.${w.status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {w.isDefault ? (
                          <Badge variant="secondary">{t("whatsapp:default")}</Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        }
      </QueryBoundary>
    </div>
  );
}

function UsersPanel({
  companyId,
  companyName,
}: {
  companyId: string;
  companyName?: string | undefined;
}) {
  const { t } = useTranslation("platform");
  const qc = useQueryClient();
  const usage = useQuery(companyUsageQuery(companyId));
  const users = useQuery(companyUsersQuery(companyId));
  const queues = useQuery(queuesQuery());
  const [creating, setCreating] = useState(false);
  const [access, setAccess] = useState<AccessData | null>(null);
  const limit = usage.data?.users.limit ?? 0;
  const used = users.data?.length ?? 0;
  const remaining = limit > 0 ? Math.max(0, limit - used) : null;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {remaining === null
            ? t("companies.detail.usersNoLimit")
            : t("companies.detail.usersRemaining", { count: remaining })}
        </p>
        <Button size="sm" disabled={remaining === 0} onClick={() => setCreating(true)}>
          <Plus className="size-4" aria-hidden />
          {t("companies.detail.newUser")}
        </Button>
      </div>
      {creating && (
        <UserFormDialog
          value="new"
          queues={queues.data ?? []}
          companyId={Number(companyId)}
          companyName={companyName}
          onClose={() => setCreating(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: companyKeys.usage(companyId) })}
          onAccess={setAccess}
        />
      )}
      {access && <AccessDialog access={access} onClose={() => setAccess(null)} />}
      <QueryBoundary query={usage} contract={companyContracts.usage}>
        {(u) =>
          u.users.limit > 0 ? (
            <UsageProgress
              label={t("usage.users")}
              used={users.data?.length ?? 0}
              limit={u.users.limit}
            />
          ) : null
        }
      </QueryBoundary>
      <QueryBoundary query={users} contract="GET /users/list">
        {(list) =>
          list.length === 0 ? (
            <EmptyState title={t("platform:companies.detail.noUsers")} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("platform:companies.detail.userColumns.name")}</TableHead>
                    <TableHead>{t("platform:companies.detail.userColumns.email")}</TableHead>
                    <TableHead>{t("platform:companies.detail.userColumns.queues")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.queues.length === 0 ? "—" : u.queues.join(", ")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        }
      </QueryBoundary>
    </div>
  );
}

export function CompanyDetailPage({ companyId }: { companyId: string }) {
  const { t } = useTranslation(["platform", "common"]);
  const q = useQuery(companyQuery(companyId));
  const [action, setAction] = useState<CompanyAction | null>(null);
  const [tab, setTab] = useState("overview");
  const [entering, setEntering] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const handleEnter = async () => {
    setEntering(true);
    try {
      await enterCompany(companyId);
      queryClient.clear();
      await navigate({ to: "/app/atendimento" });
    } catch {
      toast.error(t("companies.detail.enterError"));
    } finally {
      setEntering(false);
    }
  };
  const plan = useQuery({ ...planQuery(q.data?.planId ?? ""), enabled: !!q.data?.planId });
  const subs = useQuery({
    ...subscriptionsQuery({ page: 1, pageSize: 10, companyId }),
    enabled: tab === "subscription" && env.useMocks,
  });
  const invoices = useQuery({
    ...invoicesQuery({ page: 1, pageSize: 20, companyId }),
    enabled: tab === "invoices",
  });
  const audit = useQuery({
    ...auditQuery({ page: 1, pageSize: 20, companyId }),
    enabled: tab === "audit",
  });

  if (q.isPending) return <LoadingState />;
  if (q.error || !q.data)
    return (
      <QueryError
        error={q.error}
        contract={companyContracts.detail}
        onRetry={() => void q.refetch()}
      />
    );
  const c = q.data;
  const tabs = [
    "overview",
    "users",
    "connections",
    "limits",
    "subscription",
    "features",
    "invoices",
    "audit",
  ] as const;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={c.tradeName}
        description={c.legalName}
        actions={
          <div className="flex flex-wrap gap-2">
            {!env.useMocks && (
              <Button onClick={() => void handleEnter()} disabled={entering}>
                <LogIn className="size-4" aria-hidden /> {t("companies.detail.enter")}
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/app/plataforma/empresas/$companyId/editar" params={{ companyId }}>
                <Pencil className="size-4" aria-hidden /> {t("common:actions.edit")}
              </Link>
            </Button>
          </div>
        }
      />
      <div className="flex flex-wrap items-center gap-3">
        <CompanyStatusBadge status={c.status} />
        <span className="text-sm text-muted-foreground">
          {plan.data?.name ?? c.planName ?? c.planId}
        </span>
      </div>

      <section className="space-y-3" aria-labelledby="gestao-empresa">
        <div>
          <h2 id="gestao-empresa" className="text-lg font-semibold">
            {t("companies.detail.management.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("companies.detail.management.description", { company: c.tradeName })}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={() => setTab("users")}
            className="rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/40"
          >
            <Users className="mb-3 size-5 text-primary" aria-hidden />
            <span className="block font-semibold">{t("companies.detail.management.team")}</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {t("companies.detail.management.teamDescription")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("connections")}
            className="rounded-xl border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/40"
          >
            <Smartphone className="mb-3 size-5 text-primary" aria-hidden />
            <span className="block font-semibold">
              {t("companies.detail.management.connections")}
            </span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {t("companies.detail.management.connectionsDescription")}
            </span>
          </button>
          <div className="rounded-xl border border-dashed bg-muted/30 p-4">
            <MessagesSquare className="mb-3 size-5 text-muted-foreground" aria-hidden />
            <span className="block font-semibold">{t("companies.detail.management.service")}</span>
            <span className="mt-1 block text-sm text-muted-foreground">
              {t("companies.detail.management.serviceDescription")}
            </span>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">{t("companies.detail.management.accessTitle")}</p>
            <p className="mt-1 text-sm opacity-80">
              {t("companies.detail.management.accessDescription")}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-card p-4" aria-labelledby="acoes">
        <h2 id="acoes" className="mb-3 text-sm font-semibold">
          {t("companies.detail.actionsTitle")}
        </h2>
        <div className="flex flex-wrap gap-2">
          {availableActions(c).map((a) => (
            <Button
              key={a}
              size="sm"
              variant={a === "suspend" || a === "cancel" ? "destructive" : "outline"}
              onClick={() => setAction(a)}
            >
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
            {!env.useMocks ? (
              <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <Info label={t("subscriptions.columns.status")}>
                  <CompanyStatusBadge status={c.status} />
                </Info>
                <Info label={t("subscriptions.columns.plan")}>
                  {plan.data?.name ?? c.planName ?? c.planId}
                </Info>
                <Info label={t("subscriptions.columns.cycle")}>{t("billingCycle.monthly")}</Info>
                <Info label={t("subscriptions.columns.nextCharge")}>
                  <DateDisplay value={c.dueDate} />
                </Info>
              </dl>
            ) : (
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
                          <Info label={t("subscriptions.columns.cycle")}>
                            {t(`billingCycle.${s.billingCycle}`)}
                          </Info>
                          <Info label={t("subscriptions.columns.plan")}>
                            {s.planName ?? s.planId}
                          </Info>
                          <Info label={t("subscriptions.columns.period")}>
                            <DateDisplay value={s.currentPeriodStart} /> –{" "}
                            <DateDisplay value={s.currentPeriodEnd} />
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
            )}
          </TabsContent>

          <TabsContent value="limits" className="mt-0">
            <UsagePanel companyId={companyId} />
          </TabsContent>
          <TabsContent value="users" className="mt-0">
            <UsersPanel
              companyId={companyId}
              companyName={q.data?.tradeName || q.data?.legalName}
            />
            <div className="mt-6">
              <ImpersonationLogTable companyId={companyId} />
            </div>
          </TabsContent>
          <TabsContent value="connections" className="mt-0">
            <ConnectionsPanel companyId={companyId} />
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

      <SensitiveActionDialog
        key={action ?? "none"}
        company={c}
        action={action}
        onClose={() => setAction(null)}
      />
    </div>
  );
}
