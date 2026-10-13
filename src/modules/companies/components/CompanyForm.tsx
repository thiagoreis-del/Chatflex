import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { lookupCnpj } from "../cnpj-lookup";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FormSection } from "@/shared/components/Field";
import { plansQuery } from "@/modules/plans/api";
import {
  companyBaseSchema,
  createCompanySchema,
  type CompanyFormOutput,
  type CompanyFormValues,
} from "../schemas";
import { companyStatuses, type Company } from "../types";

export function CompanyForm({
  mode,
  company,
  submitting,
  serverError,
  onSubmit,
}: {
  mode: "create" | "edit";
  company?: Company;
  submitting: boolean;
  serverError?: string | null;
  onSubmit: (values: CompanyFormOutput) => void;
}) {
  const { t } = useTranslation(["platform", "common"]);
  const plans = useQuery(plansQuery());
  const schema = mode === "create" ? createCompanySchema : companyBaseSchema;

  const form = useForm<CompanyFormValues, unknown, CompanyFormOutput>({
    resolver: zodResolver(schema as typeof createCompanySchema),
    defaultValues: {
      legalName: company?.legalName ?? "",
      tradeName: company?.tradeName ?? "",
      document: company?.document ?? "",
      email: company?.email ?? "",
      phone: company?.phone ?? "",
      responsibleName: company?.responsibleName ?? "",
      planId: company?.planId ?? "",
      trialDays: 0,
      userLimit: company?.userLimit ?? 1,
      connectionLimit: company?.connectionLimit ?? 1,
      storageLimitMb: company?.storageLimitMb ?? 1024,
      status: company?.status ?? "onboarding",
      internalNotes: company?.internalNotes ?? "",
      ...(mode === "create" ? { firstAdmin: { name: "", email: "", phone: "" } } : {}),
    },
  });
  const { register, handleSubmit, control, formState, setValue, getValues } = form;
  const e = formState.errors;
  const msg = (m?: string) => (m ? t(`common:${m}`) : undefined);
  const [lookingUp, setLookingUp] = useState(false);

  const runCnpjLookup = async () => {
    const digits = (getValues("document") ?? "").replace(/\D/g, "");
    if (digits.length !== 14) {
      toast.error(t("companies.form.cnpjLookupInvalid"));
      return;
    }
    setLookingUp(true);
    try {
      const d = await lookupCnpj(digits);
      const opts = { shouldValidate: true, shouldDirty: true };
      (Object.keys(d) as (keyof typeof d)[]).forEach((k) => {
        if (d[k]) setValue(k, d[k], opts);
      });
      toast.success(t("companies.form.cnpjLookupOk"));
    } catch {
      toast.error(t("companies.form.cnpjLookupFail"));
    } finally {
      setLookingUp(false);
    }
  };

  const applyPlanDefaults = (planId: string) => {
    const p = plans.data?.find((x) => x.id === planId);
    if (!p || mode !== "create") return;
    setValue("userLimit", p.userLimit);
    setValue("connectionLimit", p.connectionLimit);
    setValue("storageLimitMb", p.storageLimitMb);
    setValue("trialDays", p.trialDays);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <FormSection title={t("companies.form.sections.company")}>
        <Field
          id="legalName"
          label={t("companies.detail.fields.legalName")}
          error={msg(e.legalName?.message)}
        >
          {(a) => <Input {...a} {...register("legalName")} />}
        </Field>
        <Field
          id="tradeName"
          label={t("companies.detail.fields.tradeName")}
          error={msg(e.tradeName?.message)}
        >
          {(a) => <Input {...a} {...register("tradeName")} />}
        </Field>
        <Field
          id="document"
          label={t("companies.detail.fields.document")}
          error={msg(e.document?.message)}
        >
          {(a) => (
            <div className="flex gap-2">
              <Input {...a} inputMode="numeric" {...register("document")} />
              <Button
                type="button"
                variant="outline"
                disabled={lookingUp}
                onClick={runCnpjLookup}
              >
                {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="hidden sm:inline">{t("companies.form.cnpjLookup")}</span>
              </Button>
            </div>
          )}
        </Field>
        <Field
          id="responsibleName"
          label={t("companies.detail.fields.responsibleName")}
          error={msg(e.responsibleName?.message)}
        >
          {(a) => <Input {...a} {...register("responsibleName")} />}
        </Field>
        <Field id="email" label={t("companies.detail.fields.email")} error={msg(e.email?.message)}>
          {(a) => <Input {...a} type="email" autoComplete="off" {...register("email")} />}
        </Field>
        <Field id="phone" label={t("companies.detail.fields.phone")} error={msg(e.phone?.message)}>
          {(a) => <Input {...a} type="tel" {...register("phone")} />}
        </Field>
      </FormSection>

      <FormSection title={t("companies.form.sections.plan")}>
        <Field
          id="planId"
          label={t("companies.detail.fields.plan")}
          error={
            msg(e.planId?.message) ??
            (plans.isError ? t("companies.form.plansUnavailable") : undefined)
          }
        >
          {(a) => (
            <Controller
              control={control}
              name="planId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    applyPlanDefaults(v);
                  }}
                >
                  <SelectTrigger {...a}>
                    <SelectValue placeholder={t("companies.form.selectPlan")} />
                  </SelectTrigger>
                  <SelectContent>
                    {(plans.data ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id} disabled={!p.active}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </Field>
        {mode === "create" && (
          <Field
            id="trialDays"
            label={t("companies.form.trialDays")}
            hint={t("companies.form.trialHint")}
            error={msg(e.trialDays?.message)}
          >
            {(a) => <Input {...a} type="number" min={0} {...register("trialDays")} />}
          </Field>
        )}
        <Field id="status" label={t("companies.form.status")}>
          {(a) => (
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger {...a}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {companyStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {t(`companyStatus.${s}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </Field>
      </FormSection>

      <FormSection title={t("companies.form.sections.limits")}>
        <Field
          id="userLimit"
          label={t("companies.form.userLimit")}
          error={msg(e.userLimit?.message)}
        >
          {(a) => <Input {...a} type="number" min={1} {...register("userLimit")} />}
        </Field>
        <Field
          id="connectionLimit"
          label={t("companies.form.connectionLimit")}
          error={msg(e.connectionLimit?.message)}
        >
          {(a) => <Input {...a} type="number" min={0} {...register("connectionLimit")} />}
        </Field>
        <Field
          id="storageLimitMb"
          label={t("companies.form.storageLimitMb")}
          error={msg(e.storageLimitMb?.message)}
        >
          {(a) => <Input {...a} type="number" min={0} {...register("storageLimitMb")} />}
        </Field>
      </FormSection>

      {mode === "create" && (
        <FormSection
          title={t("companies.form.sections.admin")}
          description={t("companies.form.adminHint")}
        >
          <Field
            id="adminName"
            label={t("companies.form.adminName")}
            error={msg(e.firstAdmin?.name?.message)}
          >
            {(a) => <Input {...a} {...register("firstAdmin.name")} />}
          </Field>
          <Field
            id="adminEmail"
            label={t("companies.form.adminEmail")}
            error={msg(e.firstAdmin?.email?.message)}
          >
            {(a) => (
              <Input {...a} type="email" autoComplete="off" {...register("firstAdmin.email")} />
            )}
          </Field>
          <Field
            id="adminPhone"
            label={t("companies.form.adminPhone")}
            error={msg(e.firstAdmin?.phone?.message)}
          >
            {(a) => <Input {...a} type="tel" {...register("firstAdmin.phone")} />}
          </Field>
        </FormSection>
      )}

      <FormSection
        title={t("companies.form.sections.notes")}
        description={t("companies.form.notesHint")}
      >
        <Field
          id="internalNotes"
          label={t("companies.detail.fields.internalNotes")}
          className="space-y-1.5 sm:col-span-2"
          error={msg(e.internalNotes?.message)}
        >
          {(a) => <Textarea {...a} rows={4} {...register("internalNotes")} />}
        </Field>
      </FormSection>

      {serverError && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? t("common:actions.saving")
            : mode === "create"
              ? t("companies.form.submitCreate")
              : t("companies.form.submitEdit")}
        </Button>
      </div>
    </form>
  );
}
