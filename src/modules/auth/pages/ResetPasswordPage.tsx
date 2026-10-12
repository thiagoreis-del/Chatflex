import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/shared/auth/auth-service";
import { isApiError } from "@/shared/api/errors";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { resetSchema, type ResetValues } from "../schemas/auth-schemas";

export function ResetPasswordPage({ token }: { token?: string }) {
  const { t } = useTranslation(["auth", "errors"]);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  const onSubmit = handleSubmit(async ({ password }) => {
    if (!token) return;
    setFormError(null);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (error) {
      setFormError(
        isApiError(error) && ["validation", "notFound", "unauthorized"].includes(error.kind)
          ? t("auth:reset.invalidToken")
          : t(isApiError(error) ? `errors:${error.messageKey}` : "errors:api.unknown"),
      );
    }
  });

  const backLink = (
    <div className="mt-4 text-center">
      <Link to={done ? "/login" : "/esqueci-minha-senha"} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
        {done ? t("auth:forgot.backToLogin") : t("auth:forgot.title")}
      </Link>
    </div>
  );

  return (
    <AuthLayout title={t("auth:reset.title")} subtitle={t("auth:reset.subtitle")}>
      {!token ? (
        <p role="alert" className="text-sm text-destructive">{t("auth:reset.missingToken")}</p>
      ) : done ? (
        <p role="status" className="rounded-md bg-success/10 px-3 py-3 text-sm">{t("auth:reset.success")}</p>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormField label={t("auth:reset.password")} type="password" autoComplete="new-password" error={formState.errors.password?.message} {...register("password")} />
          <FormField label={t("auth:reset.confirm")} type="password" autoComplete="new-password" error={formState.errors.confirm?.message} {...register("confirm")} />
          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? t("auth:reset.submitting") : t("auth:reset.submit")}
          </Button>
        </form>
      )}
      {backLink}
    </AuthLayout>
  );
}
