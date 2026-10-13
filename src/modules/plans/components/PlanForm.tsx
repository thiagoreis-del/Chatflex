import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Field, FormSection } from "@/shared/components/Field";
import { centsToInput, parseMoneyToCents } from "@/shared/format/format";
import { planFeatureKeys, type Plan, type PlanInput } from "../types";

const money = z
  .string()
  .trim()
  .refine((v) => parseMoneyToCents(v) !== null, "invalidPrice");
const int = (min = 0) => z.coerce.number().int().min(min);

const schema = z.object({
  name: z.string().trim().min(1, "required").max(80),
  description: z.string().trim().max(500),
  monthlyPrice: money,
  annualPrice: z
    .string()
    .trim()
    .refine((v) => v === "" || parseMoneyToCents(v) !== null, "invalidPrice"),
  userLimit: int(1),
  connectionLimit: int(0),
  storageLimitMb: int(0),
  trialDays: int(0).max(365),
  active: z.boolean(),
  features: z.object(
    Object.fromEntries(planFeatureKeys.map((k) => [k, z.boolean()])) as Record<
      keyof Plan["features"],
      z.ZodBoolean
    >,
  ),
});
type Values = z.input<typeof schema>;
type Output = z.output<typeof schema>;

export function PlanForm({
  plan,
  submitting,
  serverError,
  onSubmit,
}: {
  plan?: Plan;
  submitting: boolean;
  serverError?: string | null;
  onSubmit: (input: PlanInput) => void;
}) {
  const { t } = useTranslation(["platform", "common"]);
  const { register, handleSubmit, control, formState } = useForm<Values, unknown, Output>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: plan?.name ?? "",
      description: plan?.description ?? "",
      monthlyPrice: plan ? centsToInput(plan.monthlyPrice) : "",
      annualPrice: plan?.annualPrice != null ? centsToInput(plan.annualPrice) : "",
      userLimit: plan?.userLimit ?? 1,
      connectionLimit: plan?.connectionLimit ?? 1,
      storageLimitMb: plan?.storageLimitMb ?? 1024,
      trialDays: plan?.trialDays ?? 15,
      active: plan?.active ?? true,
      features:
        plan?.features ??
        (Object.fromEntries(planFeatureKeys.map((k) => [k, false])) as unknown as Plan["features"]),
    },
  });
  const e = formState.errors;
  const err = (m?: string) =>
    m === "invalidPrice"
      ? t("plans.form.priceInvalid")
      : m
        ? t("common:validation.required")
        : undefined;
  const numErr = (has: boolean) => (has ? t("common:validation.min") : undefined);

  const submit = (v: Output) =>
    onSubmit({
      name: v.name,
      description: v.description,
      monthlyPrice: parseMoneyToCents(v.monthlyPrice) ?? 0,
      annualPrice: v.annualPrice ? parseMoneyToCents(v.annualPrice) : null,
      userLimit: v.userLimit,
      connectionLimit: v.connectionLimit,
      storageLimitMb: v.storageLimitMb,
      trialDays: v.trialDays,
      active: v.active,
      features: v.features,
    });

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-6">
      <FormSection title={t("plans.columns.name")}>
        <Field id="name" label={t("plans.form.name")} error={err(e.name?.message)}>
          {(a) => <Input {...a} {...register("name")} />}
        </Field>
        <div className="flex items-end pb-2">
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Switch id="active" checked={field.value} onCheckedChange={field.onChange} />
                <Label htmlFor="active">{t("plans.form.active")}</Label>
              </div>
            )}
          />
        </div>
        <Field
          id="description"
          label={t("plans.form.description")}
          className="space-y-1.5 sm:col-span-2"
        >
          {(a) => <Textarea {...a} rows={3} {...register("description")} />}
        </Field>
        <Field
          id="monthlyPrice"
          label={t("plans.form.monthlyPrice")}
          hint={t("plans.form.priceHint")}
          error={err(e.monthlyPrice?.message)}
        >
          {(a) => (
            <Input {...a} inputMode="decimal" placeholder="0,00" {...register("monthlyPrice")} />
          )}
        </Field>
        <Field
          id="annualPrice"
          label={t("plans.form.annualPrice")}
          error={err(e.annualPrice?.message)}
        >
          {(a) => (
            <Input {...a} inputMode="decimal" placeholder="0,00" {...register("annualPrice")} />
          )}
        </Field>
      </FormSection>

      <FormSection title={t("companies.form.sections.limits")}>
        <Field id="userLimit" label={t("companies.form.userLimit")} error={numErr(!!e.userLimit)}>
          {(a) => <Input {...a} type="number" min={1} {...register("userLimit")} />}
        </Field>
        <Field
          id="connectionLimit"
          label={t("companies.form.connectionLimit")}
          error={numErr(!!e.connectionLimit)}
        >
          {(a) => <Input {...a} type="number" min={0} {...register("connectionLimit")} />}
        </Field>
        <Field
          id="storageLimitMb"
          label={t("companies.form.storageLimitMb")}
          error={numErr(!!e.storageLimitMb)}
        >
          {(a) => <Input {...a} type="number" min={0} {...register("storageLimitMb")} />}
        </Field>
        <Field id="trialDays" label={t("plans.form.trialDays")} error={numErr(!!e.trialDays)}>
          {(a) => <Input {...a} type="number" min={0} {...register("trialDays")} />}
        </Field>
      </FormSection>

      <FormSection title={t("plans.form.features")}>
        {planFeatureKeys.map((k) => (
          <Controller
            key={k}
            control={control}
            name={`features.${k}`}
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <Checkbox
                  id={`feat-${k}`}
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
                <Label htmlFor={`feat-${k}`}>{t(`features.${k}`)}</Label>
              </div>
            )}
          />
        ))}
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
            : plan
              ? t("plans.form.submitEdit")
              : t("plans.form.submitCreate")}
        </Button>
      </div>
    </form>
  );
}
