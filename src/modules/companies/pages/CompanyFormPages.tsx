import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { PageHeader, QueryBoundary } from "@/shared/components";
import { companyKeys, platformKeys } from "@/shared/api/query-keys";
import { isApiError } from "@/shared/api/errors";
import { errorMessageKey } from "@/shared/errors/handle-error";
import { CompanyForm } from "../components/CompanyForm";
import { companyContracts, companyQuery, createCompany, updateCompany } from "../api";
import type { CompanyFormOutput } from "../schemas";
import type { CompanyStatus } from "../types";

export function CompanyCreatePage() {
  const { t } = useTranslation(["platform", "errors"]);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const m = useMutation({
    mutationFn: (v: CompanyFormOutput) =>
      createCompany({
        ...v,
        status: v.status as CompanyStatus,
        firstAdmin: {
          name: v.firstAdmin.name,
          email: v.firstAdmin.email,
          phone: v.firstAdmin.phone || undefined,
          password: v.firstAdmin.password,
        },
      }),
    onSuccess: async (company) => {
      toast.success(t("companies.form.created"));
      await Promise.all([
        qc.invalidateQueries({ queryKey: companyKeys.lists() }),
        qc.invalidateQueries({ queryKey: platformKeys.dashboard() }),
      ]);
      await navigate({
        to: "/app/plataforma/empresas/$companyId",
        params: { companyId: company.id },
      });
    },
  });
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={t("companies.form.newTitle")}
        description={t("companies.form.newSubtitle")}
      />
      <CompanyForm
        mode="create"
        submitting={m.isPending}
        serverError={m.error ? t(errorMessageKey(m.error)) : null}
        onSubmit={(v) => m.mutate(v)}
      />
    </div>
  );
}

export function CompanyEditPage({ companyId }: { companyId: string }) {
  const { t } = useTranslation(["platform", "errors"]);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const q = useQuery(companyQuery(companyId));
  const m = useMutation({
    mutationFn: (v: CompanyFormOutput) => {
      const {
        firstAdmin: _ignored,
        trialDays: _t,
        ...rest
      } = v as CompanyFormOutput & { firstAdmin?: unknown };
      return updateCompany(companyId, { ...rest, status: rest.status as CompanyStatus });
    },
    onSuccess: async () => {
      toast.success(t("companies.form.updated"));
      await Promise.all([
        qc.invalidateQueries({ queryKey: companyKeys.detail(companyId) }),
        qc.invalidateQueries({ queryKey: companyKeys.lists() }),
      ]);
      await navigate({ to: "/app/plataforma/empresas/$companyId", params: { companyId } });
    },
  });
  const serverError = m.error
    ? isApiError(m.error) && m.error.kind === "conflict"
      ? t("companies.form.conflict")
      : t(errorMessageKey(m.error))
    : null;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title={t("companies.form.editTitle")} description={q.data?.tradeName} />
      <QueryBoundary query={q} contract={companyContracts.detail}>
        {(company) => (
          <CompanyForm
            mode="edit"
            company={company}
            submitting={m.isPending}
            serverError={serverError}
            onSubmit={(v) => m.mutate(v)}
          />
        )}
      </QueryBoundary>
    </div>
  );
}
