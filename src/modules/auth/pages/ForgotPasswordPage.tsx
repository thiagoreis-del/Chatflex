import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "@/shared/auth/auth-service";
import { isApiError } from "@/shared/api/errors";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { forgotSchema, type ForgotValues } from "../schemas/auth-schemas";

export function ForgotPasswordPage() {
  const { t } = useTranslation(["auth", "errors"]);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (error) {
      // Resposta neutra para não revelar se o e-mail existe, exceto falhas de serviço.
      if (isApiError(error) && ["network", "server", "rateLimited"].includes(error.kind)) {
        setFormError(t(`errors:${error.messageKey}`));
      } else setSent(true);
    }
  });

  return (
    <AuthLayout title={t("auth:forgot.title")} subtitle={t("auth:forgot.subtitle")}>
      {sent ? (
        <p role="status" className="rounded-md bg-success/10 px-3 py-3 text-sm">
          {t("auth:forgot.success")}
        </p>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormField label={t("auth:login.email")} type="email" autoComplete="email" error={formState.errors.email?.message} {...register("email")} />
          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
          <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? t("auth:forgot.submitting") : t("auth:forgot.submit")}
          </Button>
        </form>
      )}
      <div className="mt-4 text-center">
        <Link to="/login" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          {t("auth:forgot.backToLogin")}
        </Link>
      </div>
    </AuthLayout>
  );
}
