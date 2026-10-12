import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateDisplay, EmptyState, LoadingState, PageHeader, Pagination, QueryError } from "@/shared/components";
import { formatNumber } from "@/shared/format/format";
import { CompanyStatusBadge } from "@/modules/platform-admin/components/badges";
import { FilterBar, SelectFilter, TextFilter } from "@/modules/platform-admin/components/FilterBar";
import { plansQuery } from "@/modules/plans/api";
import { companiesQuery, companyContracts } from "../api";
import { companyStatuses, type CompanyFilters, type CompanyStatus } from "../types";

export function CompaniesListPage({
  search,
  setSearch,
}: {
  search: CompanyFilters;
  setSearch: (s: Partial<CompanyFilters>) => void;
}) {
  const { t } = useTranslation(["platform", "common"]);
  const [term, setTerm] = useState(search.search ?? "");
  useEffect(() => {
    const id = setTimeout(() => {
      if ((search.search ?? "") !== term) setSearch({ search: term || undefined, page: 1 });
    }, 350);
    return () => clearTimeout(id);
  }, [term, search.search, setSearch]);

  const q = useQuery({ ...companiesQuery(search), placeholderData: keepPreviousData });
  const plans = useQuery(plansQuery());

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={t("companies.title")}
        description={t("companies.subtitle")}
        actions={
          <Button asChild>
            <Link to="/app/plataforma/empresas/nova">
              <Plus className="size-4" aria-hidden /> {t("companies.new")}
            </Link>
          </Button>
        }
      />
      <FilterBar
        onClear={() => {
          setTerm("");
          setSearch({ search: undefined, status: undefined, planId: undefined, page: 1 });
        }}
      >
        <div className="min-w-64 flex-1">
          <TextFilter
            id="company-search"
            type="search"
            label={t("companies.searchLabel")}
            placeholder={t("companies.searchPlaceholder")}
            value={term}
            onChange={(v) => setTerm(v ?? "")}
          />
        </div>
        <SelectFilter
          id="company-status"
          label={t("companies.filterStatus")}
          value={search.status}
          options={companyStatuses.map((s) => ({ value: s, label: t(`companyStatus.${s}`) }))}
          onChange={(v) => setSearch({ status: v as CompanyStatus | undefined, page: 1 })}
        />
        <SelectFilter
          id="company-plan"
          label={t("companies.filterPlan")}
          value={search.planId}
          options={(plans.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
          onChange={(v) => setSearch({ planId: v, page: 1 })}
        />
      </FilterBar>

      {q.isPending ? (
        <LoadingState />
      ) : q.error ? (
        <QueryError error={q.error} contract={companyContracts.list} onRetry={() => void q.refetch()} />
      ) : !q.data.data.length ? (
        <EmptyState title={t("companies.empty")} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("companies.columns.company")}</TableHead>
                  <TableHead>{t("companies.columns.status")}</TableHead>
                  <TableHead>{t("companies.columns.plan")}</TableHead>
                  <TableHead>{t("companies.columns.dueDate")}</TableHead>
                  <TableHead>{t("companies.columns.trialEndsAt")}</TableHead>
                  <TableHead className="text-right">{t("companies.columns.users")}</TableHead>
                  <TableHead className="text-right">{t("companies.columns.connections")}</TableHead>
                  <TableHead className="text-right">{t("companies.columns.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.data.data.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        to="/app/plataforma/empresas/$companyId"
                        params={{ companyId: c.id }}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {c.tradeName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{c.legalName}</p>
                    </TableCell>
                    <TableCell>
                      <CompanyStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell>{c.planName ?? plans.data?.find((p) => p.id === c.planId)?.name ?? c.planId}</TableCell>
                    <TableCell>
                      <DateDisplay value={c.dueDate} />
                    </TableCell>
                    <TableCell>
                      <DateDisplay value={c.trialEndsAt} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.usersCount !== undefined ? `${formatNumber(c.usersCount)} / ${formatNumber(c.userLimit)}` : formatNumber(c.userLimit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.connectionsCount !== undefined
                        ? `${formatNumber(c.connectionsCount)} / ${formatNumber(c.connectionLimit)}`
                        : formatNumber(c.connectionLimit)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="sm">
                          <Link to="/app/plataforma/empresas/$companyId" params={{ companyId: c.id }}>
                            {t("common:actions.view")}
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link to="/app/plataforma/empresas/$companyId/editar" params={{ companyId: c.id }}>
                            {t("common:actions.edit")}
                          </Link>
                        </Button>
                      </div>
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
