import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { LoadingState, PageHeader, Pagination, QueryError } from "@/shared/components";
import { FilterBar, SelectFilter, TextFilter } from "@/modules/platform-admin/components/FilterBar";
import { auditContract, auditQuery } from "../api";
import { AuditEventTable } from "../components/AuditEventTable";
import { ImpersonationLogTable } from "../components/ImpersonationLogTable";
import { auditResults, type AuditFilters, type AuditResult } from "../types";

export function AuditPage({
  search,
  setSearch,
}: {
  search: AuditFilters;
  setSearch: (s: Partial<AuditFilters>) => void;
}) {
  const { t } = useTranslation("platform");
  const q = useQuery({ ...auditQuery(search), placeholderData: keepPreviousData });
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title={t("audit.title")} description={t("audit.subtitle")} />
      <ImpersonationLogTable />
      <FilterBar
        onClear={() =>
          setSearch({
            from: undefined,
            to: undefined,
            companyId: undefined,
            userId: undefined,
            action: undefined,
            result: undefined,
            page: 1,
          })
        }
      >
        <TextFilter
          id="au-from"
          type="date"
          label={t("audit.filters.from")}
          value={search.from}
          onChange={(v) => setSearch({ from: v, page: 1 })}
        />
        <TextFilter
          id="au-to"
          type="date"
          label={t("audit.filters.to")}
          value={search.to}
          onChange={(v) => setSearch({ to: v, page: 1 })}
        />
        <TextFilter
          id="au-company"
          label={t("audit.filters.companyId")}
          value={search.companyId}
          onChange={(v) => setSearch({ companyId: v, page: 1 })}
        />
        <TextFilter
          id="au-user"
          label={t("audit.filters.userId")}
          value={search.userId}
          onChange={(v) => setSearch({ userId: v, page: 1 })}
        />
        <TextFilter
          id="au-action"
          label={t("audit.filters.action")}
          value={search.action}
          onChange={(v) => setSearch({ action: v, page: 1 })}
        />
        <SelectFilter
          id="au-result"
          label={t("audit.filters.result")}
          value={search.result}
          options={auditResults.map((r) => ({ value: r, label: t(`auditResult.${r}`) }))}
          onChange={(v) => setSearch({ result: v as AuditResult | undefined, page: 1 })}
        />
      </FilterBar>
      {q.isPending ? (
        <LoadingState />
      ) : q.error ? (
        <QueryError error={q.error} contract={auditContract} onRetry={() => void q.refetch()} />
      ) : (
        <>
          <AuditEventTable events={q.data.data} />
          {q.data.total > 0 && (
            <Pagination
              page={q.data.page}
              pageSize={q.data.pageSize}
              total={q.data.total}
              onPageChange={(page) => setSearch({ page })}
            />
          )}
        </>
      )}
    </div>
  );
}
