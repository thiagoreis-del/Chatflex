import { Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateDisplay, EmptyState, LoadingState, MoneyDisplay, PageHeader, Pagination, QueryError } from "@/shared/components";
import { InvoiceStatusBadge } from "@/modules/platform-admin/components/badges";
import { FilterBar, SelectFilter, TextFilter } from "@/modules/platform-admin/components/FilterBar";
import { billingContracts, invoicesQuery } from "../api";
import { invoiceStatuses, type InvoiceFilters, type InvoiceStatus } from "../types";

/** Somente consulta: o frontend nunca define valor nem marca fatura como paga. */
export function InvoicesPage({ search, setSearch }: { search: InvoiceFilters; setSearch: (s: Partial<InvoiceFilters>) => void }) {
  const { t } = useTranslation("platform");
  const q = useQuery({ ...invoicesQuery(search), placeholderData: keepPreviousData });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title={t("invoices.title")} description={t("invoices.subtitle")} />
      <FilterBar
        onClear={() =>
          setSearch({ companyId: undefined, status: undefined, dueFrom: undefined, dueTo: undefined, createdFrom: undefined, createdTo: undefined, page: 1 })
        }
      >
        <TextFilter id="inv-company" label={t("subscriptions.companyIdFilter")} value={search.companyId} onChange={(v) => setSearch({ companyId: v, page: 1 })} />
        <SelectFilter
          id="inv-status"
          label={t("invoices.columns.status")}
          value={search.status}
          options={invoiceStatuses.map((s) => ({ value: s, label: t(`invoiceStatus.${s}`) }))}
          onChange={(v) => setSearch({ status: v as InvoiceStatus | undefined, page: 1 })}
        />
        <TextFilter id="inv-due-from" type="date" label={t("invoices.filters.dueFrom")} value={search.dueFrom} onChange={(v) => setSearch({ dueFrom: v, page: 1 })} />
        <TextFilter id="inv-due-to" type="date" label={t("invoices.filters.dueTo")} value={search.dueTo} onChange={(v) => setSearch({ dueTo: v, page: 1 })} />
        <TextFilter id="inv-created-from" type="date" label={t("invoices.filters.createdFrom")} value={search.createdFrom} onChange={(v) => setSearch({ createdFrom: v, page: 1 })} />
        <TextFilter id="inv-created-to" type="date" label={t("invoices.filters.createdTo")} value={search.createdTo} onChange={(v) => setSearch({ createdTo: v, page: 1 })} />
      </FilterBar>
      {q.isPending ? (
        <LoadingState />
      ) : q.error ? (
        <QueryError error={q.error} contract={billingContracts.invoices} onRetry={() => void q.refetch()} />
      ) : !q.data.data.length ? (
        <EmptyState title={t("invoices.empty")} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("invoices.columns.id")}</TableHead>
                  <TableHead>{t("invoices.columns.company")}</TableHead>
                  <TableHead className="text-right">{t("invoices.columns.amount")}</TableHead>
                  <TableHead>{t("invoices.columns.status")}</TableHead>
                  <TableHead>{t("invoices.columns.dueDate")}</TableHead>
                  <TableHead>{t("invoices.columns.paidAt")}</TableHead>
                  <TableHead>{t("invoices.columns.createdAt")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.data.data.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-mono text-xs">{i.id}</TableCell>
                    <TableCell>
                      <Link to="/app/plataforma/empresas/$companyId" params={{ companyId: i.companyId }} className="hover:text-primary hover:underline">
                        {i.companyName ?? i.companyId}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
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
                    <TableCell>
                      <DateDisplay value={i.createdAt} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination page={q.data.page} pageSize={q.data.pageSize} total={q.data.total} onPageChange={(page) => setSearch({ page })} />
        </>
      )}
    </div>
  );
}
