import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateDisplay, EmptyState, LoadingState, PageHeader, Pagination, QueryBoundary, QueryError } from "@/shared/components";
import { SubscriptionStatusBadge } from "@/modules/platform-admin/components/badges";
import { FilterBar, SelectFilter, TextFilter } from "@/modules/platform-admin/components/FilterBar";
import { auditContract, auditQuery } from "@/modules/audit/api";
import { AuditEventTable } from "@/modules/audit/components/AuditEventTable";
import { billingContracts, subscriptionsQuery } from "../api";
import { subscriptionStatuses, type Subscription, type SubscriptionFilters, type SubscriptionStatus } from "../types";

function HistoryDialog({ sub, onClose }: { sub: Subscription | null; onClose: () => void }) {
  const { t } = useTranslation("platform");
  const q = useQuery({
    ...auditQuery({ page: 1, pageSize: 50, resource: "subscription", resourceId: sub?.id, companyId: sub?.companyId }),
    enabled: !!sub,
  });
  return (
    <Dialog open={!!sub} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t("subscriptions.historyTitle")}</DialogTitle>
          <DialogDescription>{sub?.companyName ?? sub?.companyId}</DialogDescription>
        </DialogHeader>
        <QueryBoundary query={q} contract={auditContract}>
          {(page) => <AuditEventTable events={page.data} hideCompany />}
        </QueryBoundary>
      </DialogContent>
    </Dialog>
  );
}

export function SubscriptionsPage({
  search,
  setSearch,
}: {
  search: SubscriptionFilters;
  setSearch: (s: Partial<SubscriptionFilters>) => void;
}) {
  const { t } = useTranslation("platform");
  const q = useQuery({ ...subscriptionsQuery(search), placeholderData: keepPreviousData });
  const [historyOf, setHistoryOf] = useState<Subscription | null>(null);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title={t("subscriptions.title")} description={t("subscriptions.subtitle")} />
      <FilterBar onClear={() => setSearch({ companyId: undefined, status: undefined, page: 1 })}>
        <TextFilter id="sub-company" label={t("subscriptions.companyIdFilter")} value={search.companyId} onChange={(v) => setSearch({ companyId: v, page: 1 })} />
        <SelectFilter
          id="sub-status"
          label={t("subscriptions.columns.status")}
          value={search.status}
          options={subscriptionStatuses.map((s) => ({ value: s, label: t(`subscriptionStatus.${s}`) }))}
          onChange={(v) => setSearch({ status: v as SubscriptionStatus | undefined, page: 1 })}
        />
      </FilterBar>
      {q.isPending ? (
        <LoadingState />
      ) : q.error ? (
        <QueryError error={q.error} contract={billingContracts.subscriptions} onRetry={() => void q.refetch()} />
      ) : !q.data.data.length ? (
        <EmptyState title={t("subscriptions.empty")} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("subscriptions.columns.company")}</TableHead>
                  <TableHead>{t("subscriptions.columns.plan")}</TableHead>
                  <TableHead>{t("subscriptions.columns.cycle")}</TableHead>
                  <TableHead>{t("subscriptions.columns.status")}</TableHead>
                  <TableHead>{t("subscriptions.columns.period")}</TableHead>
                  <TableHead>{t("subscriptions.columns.nextCharge")}</TableHead>
                  <TableHead className="text-right">{t("subscriptions.columns.history")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.data.data.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link to="/app/plataforma/empresas/$companyId" params={{ companyId: s.companyId }} className="font-medium hover:text-primary hover:underline">
                        {s.companyName ?? s.companyId}
                      </Link>
                    </TableCell>
                    <TableCell>{s.planName ?? s.planId}</TableCell>
                    <TableCell>{t(`billingCycle.${s.billingCycle}`)}</TableCell>
                    <TableCell>
                      <SubscriptionStatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <DateDisplay value={s.currentPeriodStart} /> – <DateDisplay value={s.currentPeriodEnd} />
                    </TableCell>
                    <TableCell>
                      <DateDisplay value={s.nextChargeAt ?? null} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setHistoryOf(s)}>
                        <History className="size-4" aria-hidden /> {t("subscriptions.historyButton")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination page={q.data.page} pageSize={q.data.pageSize} total={q.data.total} onPageChange={(page) => setSearch({ page })} />
        </>
      )}
      <HistoryDialog sub={historyOf} onClose={() => setHistoryOf(null)} />
    </div>
  );
}
