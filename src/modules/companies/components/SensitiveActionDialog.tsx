import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { auditKeys, companyKeys, platformKeys, subscriptionKeys } from "@/shared/api/query-keys";
import { plansQuery } from "@/modules/plans/api";
import { runCompanyStatusAction, updateCompany, updateCompanyLimits } from "../api";
import type { Company, CompanyAction } from "../types";

const doubleConfirm: CompanyAction[] = ["suspend", "cancel"];

/**
 * Ação administrativa sensível: confirmação, motivo obrigatório, empresa afetada,
 * aviso de impacto e confirmação extra para suspensão/cancelamento.
 * Sem atualização otimista — a interface só muda após a resposta do servidor.
 */
export function SensitiveActionDialog({
  company,
  action,
  onClose,
}: {
  company: Company;
  action: CompanyAction | null;
  onClose: () => void;
}) {
  const { t } = useTranslation(["platform", "common"]);
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [typed, setTyped] = useState("");
  const [planId, setPlanId] = useState(company.planId);
  const [dueDate, setDueDate] = useState(company.dueDate?.slice(0, 10) ?? "");
  const [limits, setLimits] = useState({
    userLimit: company.userLimit,
    connectionLimit: company.connectionLimit,
    storageLimitMb: company.storageLimitMb,
  });
  const [touched, setTouched] = useState(false);
  const plans = useQuery({ ...plansQuery(), enabled: action === "changePlan" });

  const reset = () => {
    setReason("");
    setStep(1);
    setTyped("");
    setTouched(false);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!action) throw new Error("no action");
      switch (action) {
        case "changePlan":
          return updateCompany(company.id, { planId, reason });
        case "changeDueDate":
          return updateCompany(company.id, { reason, ...({ dueDate } as object) });
        case "extendLimits":
          return updateCompanyLimits(company.id, { ...limits, reason });
        default:
          return runCompanyStatusAction(company.id, action, reason);
      }
    },
    onSuccess: async () => {
      toast.success(t("platform:actions.dialog.done"));
      await Promise.all([
        qc.invalidateQueries({ queryKey: companyKeys.detail(company.id) }),
        qc.invalidateQueries({ queryKey: companyKeys.lists() }),
        qc.invalidateQueries({ queryKey: platformKeys.dashboard() }),
        qc.invalidateQueries({ queryKey: subscriptionKeys.all }),
        qc.invalidateQueries({ queryKey: auditKeys.all }),
      ]);
      reset();
      onClose();
    },
  });

  if (!action) return null;
  const reasonOk = reason.trim().length >= 10;
  const extraOk =
    action === "changePlan" ? !!planId : action === "changeDueDate" ? !!dueDate : true;
  const needsSecond = doubleConfirm.includes(action);

  const submit = () => {
    setTouched(true);
    if (!reasonOk || !extraOk) return;
    if (needsSecond && step === 1) {
      setStep(2);
      return;
    }
    if (needsSecond && typed.trim() !== company.tradeName) return;
    mutation.mutate();
  };

  const destructive = action === "suspend" || action === "cancel";

  return (
    <Dialog
      open={!!action}
      onOpenChange={(o) => {
        if (!o && !mutation.isPending) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{step === 2 ? t("platform:actions.dialog.secondTitle") : t(`platform:actions.${action}`)}</DialogTitle>
          <DialogDescription>
            {t("platform:actions.dialog.affected")}: <strong className="text-foreground">{company.tradeName}</strong> ({company.legalName})
          </DialogDescription>
        </DialogHeader>

        <div
          role="note"
          className={
            destructive
              ? "flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              : "flex gap-2 rounded-lg border bg-muted p-3 text-sm"
          }
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            <span className="font-semibold">{t("platform:actions.dialog.impactTitle")}: </span>
            {t(`platform:actions.impact.${action}`)}
          </p>
        </div>

        {step === 1 ? (
          <div className="space-y-4">
            {action === "changePlan" && (
              <div className="space-y-1.5">
                <Label htmlFor="sa-plan">{t("platform:actions.dialog.newPlan")}</Label>
                <Select value={planId} onValueChange={setPlanId}>
                  <SelectTrigger id="sa-plan">
                    <SelectValue placeholder={t("platform:companies.form.selectPlan")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(plans.data ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id} disabled={!p.active}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {plans.isError && <p className="text-sm text-destructive">{t("platform:companies.form.plansUnavailable")}</p>}
              </div>
            )}
            {action === "changeDueDate" && (
              <div className="space-y-1.5">
                <Label htmlFor="sa-due">{t("platform:actions.dialog.newDueDate")}</Label>
                <Input id="sa-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                {touched && !dueDate && <p className="text-sm text-destructive">{t("platform:actions.dialog.required")}</p>}
              </div>
            )}
            {action === "extendLimits" && (
              <div className="grid gap-3 sm:grid-cols-3">
                {(["userLimit", "connectionLimit", "storageLimitMb"] as const).map((k) => (
                  <div key={k} className="space-y-1.5">
                    <Label htmlFor={`sa-${k}`}>{t(`platform:companies.form.${k}`)}</Label>
                    <Input
                      id={`sa-${k}`}
                      type="number"
                      min={company[k]}
                      value={limits[k]}
                      onChange={(e) => setLimits((l) => ({ ...l, [k]: Math.max(company[k], Number(e.target.value) || 0) }))}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="sa-reason">{t("platform:actions.dialog.reason")}</Label>
              <Textarea
                id="sa-reason"
                value={reason}
                maxLength={500}
                placeholder={t("platform:actions.dialog.reasonPlaceholder")}
                aria-invalid={touched && !reasonOk}
                aria-describedby={touched && !reasonOk ? "sa-reason-err" : undefined}
                onChange={(e) => setReason(e.target.value)}
              />
              {touched && !reasonOk && (
                <p id="sa-reason-err" className="text-sm text-destructive">
                  {t("platform:actions.dialog.reasonMin")}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="text-sm">{t("platform:actions.dialog.secondDescription", { name: company.tradeName })}</p>
            <Label htmlFor="sa-typed">{t("platform:actions.dialog.secondLabel")}</Label>
            <Input id="sa-typed" value={typed} autoComplete="off" onChange={(e) => setTyped(e.target.value)} />
            {typed && typed.trim() !== company.tradeName && (
              <p className="text-sm text-destructive">{t("platform:actions.dialog.secondMismatch")}</p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => {
              reset();
              onClose();
            }}
          >
            {t("common:actions.cancel")}
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={mutation.isPending || (step === 2 && typed.trim() !== company.tradeName)}
            onClick={submit}
          >
            {mutation.isPending
              ? t("platform:actions.dialog.running")
              : step === 2
                ? t("platform:actions.dialog.confirmFinal")
                : t("platform:actions.dialog.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
