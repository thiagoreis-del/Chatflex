import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Check, Copy, Minus, Plus, Sparkles, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState, MoneyDisplay, PageHeader, QueryBoundary } from "@/shared/components";
import { companyKeys, planKeys } from "@/shared/api/query-keys";
import { errorMessageKey } from "@/shared/errors/handle-error";
import { CompanyStatusBadge } from "@/modules/platform-admin/components/badges";
import { companiesQuery, companyContracts } from "@/modules/companies/api";
import { createPlan, deletePlan, suggestedPlans, planContracts, planQuery, plansQuery, updatePlan } from "../api";
import { PlanForm } from "../components/PlanForm";
import { planFeatureKeys } from "../types";

export function PlansListPage() {
  const { t } = useTranslation(["platform", "common"]);
  const q = useQuery(plansQuery());
  const qc = useQueryClient();
  const [toDelete, setToDelete] = useState<string | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: planKeys.lists() });
  const onErr = (e: unknown) => toast.error(t(errorMessageKey(e)));
  const toggle = useMutation({
    mutationFn: (p: { id: string; active: boolean }) => updatePlan(p.id, { active: p.active }),
    onSuccess: refresh,
    onError: onErr,
  });
  const duplicate = useMutation({
    mutationFn: (p: Parameters<typeof createPlan>[0]) =>
      createPlan({ ...p, name: t("plans.copyName", { name: p.name }) }),
    onSuccess: async () => {
      toast.success(t("plans.form.created"));
      await refresh();
    },
    onError: onErr,
  });
  const remove = useMutation({
    mutationFn: deletePlan,
    onSuccess: async () => {
      toast.success(t("plans.deleted"));
      setToDelete(null);
      await refresh();
    },
    onError: (e) => {
      setToDelete(null);
      toast.error(t("plans.deleteError"));
      console.warn(e);
    },
  });
  const seed = useMutation({
    mutationFn: async (existing: string[]) => {
      const names = new Set(existing.map((n) => n.toUpperCase()));
      let created = 0;
      for (const p of suggestedPlans) {
        if (names.has(p.name)) continue;
        await createPlan(p);
        created++;
      }
      return created;
    },
    onSuccess: async (n) => {
      toast.success(t("plans.seeded", { count: n }));
      await refresh();
    },
    onError: onErr,
  });
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={t("plans.title")}
        description={t("plans.subtitle")}
        actions={
          <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={seed.isPending || !q.data}
            onClick={() => seed.mutate((q.data ?? []).map((p) => p.name))}
          >
            <Sparkles className="size-4" aria-hidden /> {t("plans.seed")}
          </Button>
          <Button asChild>
            <Link to="/app/plataforma/planos/novo">
              <Plus className="size-4" aria-hidden /> {t("plans.new")}
            </Link>
          </Button>
          </div>
        }
      />
      <QueryBoundary query={q} contract={planContracts.list}>
        {(plans) =>
          plans.length === 0 ? (
            <EmptyState title={t("plans.empty")} />
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("plans.columns.name")}</TableHead>
                      <TableHead>{t("plans.columns.monthly")}</TableHead>
                      <TableHead>{t("plans.columns.annual")}</TableHead>
                      <TableHead>{t("plans.columns.limits")}</TableHead>
                      <TableHead>{t("plans.columns.trial")}</TableHead>
                      <TableHead>{t("plans.columns.status")}</TableHead>
                      <TableHead className="text-right">{t("plans.columns.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <Link
                            to="/app/plataforma/planos/$planId"
                            params={{ planId: p.id }}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {p.name}
                          </Link>
                          <p className="max-w-64 truncate text-xs text-muted-foreground">
                            {p.description}
                          </p>
                        </TableCell>
                        <TableCell>
                          <MoneyDisplay cents={p.monthlyPrice} />
                        </TableCell>
                        <TableCell>
                          <MoneyDisplay cents={p.annualPrice} />
                        </TableCell>
                        <TableCell className="text-sm">
                          {t("plans.limitsShort", {
                            users: p.userLimit,
                            connections: p.connectionLimit,
                            storage: p.storageLimitMb,
                          })}
                          <span className="block text-xs text-muted-foreground">
                            {t("plans.queuesShort", { count: p.queueLimit })}
                          </span>
                        </TableCell>
                        <TableCell>{t("plans.trialDays", { count: p.trialDays })}</TableCell>
                        <TableCell>
                          <button
                            type="button"
                            disabled={toggle.isPending}
                            onClick={() => toggle.mutate({ id: p.id, active: !p.active })}
                            title={p.active ? t("plans.deactivate") : t("plans.activate")}
                          >
                            <Badge variant={p.active ? "default" : "outline"}>
                              {p.active ? t("plans.active") : t("plans.inactive")}
                            </Badge>
                          </button>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right">
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={t("plans.duplicate")}
                            title={t("plans.duplicate")}
                            disabled={duplicate.isPending}
                            onClick={() => {
                              const { id: _id, ...rest } = p;
                              duplicate.mutate(rest);
                            }}
                          >
                            <Copy className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            aria-label={t("plans.delete")}
                            title={t("plans.delete")}
                            onClick={() => setToDelete(p.id)}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <section aria-labelledby="comparacao" className="space-y-3">
                <h2 id="comparacao" className="text-lg font-semibold">
                  {t("plans.compare")}
                </h2>
                <div className="overflow-x-auto rounded-xl border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("plans.form.features")}</TableHead>
                        {plans.map((p) => (
                          <TableHead key={p.id} className="text-center">
                            {p.name}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {planFeatureKeys.map((k) => (
                        <TableRow key={k}>
                          <TableCell>{t(`features.${k}`)}</TableCell>
                          {plans.map((p) => (
                            <TableCell key={p.id} className="text-center">
                              {p.features[k] ? (
                                <Check
                                  className="mx-auto size-4 text-success"
                                  aria-label={t("features.enabled")}
                                />
                              ) : (
                                <Minus
                                  className="mx-auto size-4 text-muted-foreground"
                                  aria-label={t("features.disabled")}
                                />
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            </>
          )
        }
      </QueryBoundary>
      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t("plans.deleteTitle")}
        description={t("plans.deleteDescription")}
        confirmLabel={t("plans.delete")}
        onConfirm={() => toDelete && remove.mutate(toDelete)}
      />
    </div>
  );
}

export function PlanCreatePage() {
  const { t } = useTranslation(["platform", "errors"]);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const m = useMutation({
    mutationFn: createPlan,
    onSuccess: async (plan) => {
      toast.success(t("plans.form.created"));
      await qc.invalidateQueries({ queryKey: planKeys.lists() });
      await navigate({ to: "/app/plataforma/planos/$planId", params: { planId: plan.id } });
    },
  });
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title={t("plans.new")} description={t("plans.subtitle")} />
      <PlanForm
        submitting={m.isPending}
        serverError={m.error ? t(errorMessageKey(m.error)) : null}
        onSubmit={(v) => m.mutate(v)}
      />
    </div>
  );
}

export function PlanDetailPage({ planId }: { planId: string }) {
  const { t } = useTranslation(["platform", "errors"]);
  const qc = useQueryClient();
  const q = useQuery(planQuery(planId));
  const linked = useQuery(companiesQuery({ page: 1, pageSize: 50, planId }));
  const invalidate = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: planKeys.detail(planId) }),
      qc.invalidateQueries({ queryKey: planKeys.lists() }),
    ]);
  const save = useMutation({
    mutationFn: (v: Parameters<typeof updatePlan>[1]) => updatePlan(planId, v),
    onSuccess: async () => {
      toast.success(t("plans.form.updated"));
      await invalidate();
    },
  });
  const toggle = useMutation({
    mutationFn: (active: boolean) => updatePlan(planId, { active }),
    onSuccess: async (p) => {
      toast.success(p.active ? t("plans.activated") : t("plans.deactivated"));
      await Promise.all([invalidate(), qc.invalidateQueries({ queryKey: companyKeys.lists() })]);
    },
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <QueryBoundary query={q} contract={planContracts.detail}>
        {(plan) => (
          <>
            <PageHeader
              title={plan.name}
              description={plan.description}
              actions={
                <Button
                  variant={plan.active ? "outline" : "default"}
                  disabled={toggle.isPending}
                  onClick={() => toggle.mutate(!plan.active)}
                >
                  {plan.active ? t("plans.deactivate") : t("plans.activate")}
                </Button>
              }
            />
            <PlanForm
              key={JSON.stringify(plan)}
              plan={plan}
              submitting={save.isPending}
              serverError={save.error ? t(errorMessageKey(save.error)) : null}
              onSubmit={(v) => save.mutate(v)}
            />
          </>
        )}
      </QueryBoundary>
      <section className="rounded-xl border bg-card p-5 shadow-soft" aria-labelledby="vinculadas">
        <h2 id="vinculadas" className="mb-3 text-lg font-semibold">
          {t("plans.linkedCompanies")}
        </h2>
        <QueryBoundary query={linked} contract={companyContracts.list}>
          {(page) =>
            page.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("plans.linkedEmpty")}</p>
            ) : (
              <ul className="divide-y">
                {page.data.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 py-2">
                    <Link
                      to="/app/plataforma/empresas/$companyId"
                      params={{ companyId: c.id }}
                      className="font-medium hover:text-primary hover:underline"
                    >
                      {c.tradeName}
                    </Link>
                    <CompanyStatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            )
          }
        </QueryBoundary>
      </section>
    </div>
  );
}
