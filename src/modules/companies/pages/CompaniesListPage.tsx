import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  PageHeader,
  Pagination,
  QueryError,
} from "@/shared/components";
import { formatNumber } from "@/shared/format/format";
import { CompanyStatusBadge } from "@/modules/platform-admin/components/badges";
import { FilterBar, SelectFilter, TextFilter } from "@/modules/platform-admin/components/FilterBar";
import { plansQuery } from "@/modules/plans/api";
import { CompanyQuickActions } from "../components/CompanyAdminActions";
import { EnterCompanyButton } from "../components/EnterCompanyButton";
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
        <div className="min-w-0 flex-1 sm:min-w-64">
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
        <QueryError
          error={q.error}
          contract={companyContracts.list}
          onRetry={() => void q.refetch()}
        />
      ) : !q.data.data.length ? (
        <EmptyState title={t("companies.empty")} />
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {q.data.data.map((c) => (
              <li key={c.id} className="space-y-3 rounded-xl border bg-card p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                  <div className="min-w-0">
                    <Link
                      to="/app/plataforma/empresas/$companyId"
                      params={{ companyId: c.id }}
                      className="block truncate font-medium text-foreground hover:text-primary"
                    >
                      {c.tradeName}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {c.planName ?? plans.data?.find((p) => p.id === c.planId)?.name ?? c.planId}
                    </p>
                  </div>
                  <CompanyStatusBadge status={c.status} />
                </div>
                <dl className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">{t("companies.columns.dueDate")}</dt>
                    <dd>
                      <DateDisplay value={c.dueDate} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("companies.columns.users")}</dt>
                    <dd className="tabular-nums">{formatNumber(c.usersCount ?? c.userLimit)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">{t("companies.columns.connections")}</dt>
                    <dd className="tabular-nums">
                      {formatNumber(c.connectionsCount ?? c.connectionLimit)}
                    </dd>
                    {c.connectionConfigured !== undefined && (
                      <dd
                        className={
                          c.connectionConfigured
                            ? "flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                            : "flex items-center gap-1 text-muted-foreground"
                        }
                      >
                        <span
                          className={`inline-block size-1.5 rounded-full ${c.connectionConfigured ? "bg-emerald-500" : "bg-muted-foreground/50"}`}
                          aria-hidden
                        />
                        {c.connectionConfigured
                          ? t("companies.connectionConfigured")
                          : t("companies.connectionNotConfigured")}
                      </dd>
                    )}
                  </div>
                </dl>
                <div className="flex flex-wrap items-center gap-1">
                  <EnterCompanyButton companyId={c.id} />
                  <Button asChild variant="ghost" size="icon" title={t("companies.manage")}>
                    <Link
                      to="/app/plataforma/empresas/$companyId"
                      params={{ companyId: c.id }}
                      aria-label={t("companies.manage")}
                    >
                      <Settings2 className="size-4" aria-hidden />
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" size="icon" title={t("common:actions.edit")}>
                    <Link
                      to="/app/plataforma/empresas/$companyId/editar"
                      params={{ companyId: c.id }}
                      aria-label={t("common:actions.edit")}
                    >
                      <Pencil className="size-4" aria-hidden />
                    </Link>
                  </Button>
                  <CompanyQuickActions company={c} compact />
                </div>
              </li>
            ))}
          </ul>
          <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("companies.columns.company")}</TableHead>
                  <TableHead>{t("companies.columns.status")}</TableHead>
                  <TableHead>{t("companies.columns.plan")}</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    {t("companies.columns.dueDate")}
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">
                    {t("companies.columns.trialEndsAt")}
                  </TableHead>
                  <TableHead className="text-right">{t("companies.columns.users")}</TableHead>
                  <TableHead className="text-right">{t("companies.columns.connections")}</TableHead>
                  <TableHead className="text-right">{t("companies.columns.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {q.data.data.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="max-w-56">
                      <Link
                        to="/app/plataforma/empresas/$companyId"
                        params={{ companyId: c.id }}
                        className="block truncate font-medium text-foreground hover:text-primary hover:underline"
                        title={c.tradeName}
                      >
                        {c.tradeName}
                      </Link>
                      {c.legalName !== c.tradeName && (
                        <p className="truncate text-xs text-muted-foreground">{c.legalName}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <CompanyStatusBadge status={c.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {c.planName ?? plans.data?.find((p) => p.id === c.planId)?.name ?? c.planId}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap lg:table-cell">
                      <DateDisplay value={c.dueDate} />
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap xl:table-cell">
                      <DateDisplay value={c.trialEndsAt} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.usersCount !== undefined
                        ? `${formatNumber(c.usersCount)} / ${formatNumber(c.userLimit)}`
                        : formatNumber(c.userLimit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {c.connectionsCount !== undefined
                        ? `${formatNumber(c.connectionsCount)} / ${formatNumber(c.connectionLimit)}`
                        : formatNumber(c.connectionLimit)}
                      {c.connectionConfigured !== undefined && (
                        <p
                          className={
                            c.connectionConfigured
                              ? "flex items-center justify-end gap-1 text-xs font-normal text-emerald-600 dark:text-emerald-400"
                              : "flex items-center justify-end gap-1 text-xs font-normal text-muted-foreground"
                          }
                        >
                          <span
                            className={`inline-block size-1.5 rounded-full ${c.connectionConfigured ? "bg-emerald-500" : "bg-muted-foreground/50"}`}
                            aria-hidden
                          />
                          {c.connectionConfigured
                            ? t("companies.connectionConfigured")
                            : t("companies.connectionNotConfigured")}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <EnterCompanyButton companyId={c.id} />
                        <Button asChild variant="ghost" size="icon" title={t("companies.manage")}>
                          <Link
                            to="/app/plataforma/empresas/$companyId"
                            params={{ companyId: c.id }}
                            aria-label={t("companies.manage")}
                          >
                            <Settings2 className="size-4" aria-hidden />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          title={t("common:actions.edit")}
                        >
                          <Link
                            to="/app/plataforma/empresas/$companyId/editar"
                            params={{ companyId: c.id }}
                            aria-label={t("common:actions.edit")}
                          >
                            <Pencil className="size-4" aria-hidden />
                          </Link>
                        </Button>
                        <CompanyQuickActions company={c} compact />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Pagination
            page={q.data.page}
            pageSize={q.data.pageSize}
            total={q.data.total}
            onPageChange={(page) => setSearch({ page })}
          />
        </>
      )}
    </div>
  );
}
