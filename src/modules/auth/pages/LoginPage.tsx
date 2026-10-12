import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { login } from "@/shared/auth/auth-service";
import { isApiError } from "@/shared/api/errors";
import { env } from "@/shared/config/env";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { loginSchema, type LoginValues } from "../schemas/auth-schemas";

export function LoginPage({ redirectTo }: { redirectTo?: string }) {
  const { t } = useTranslation(["auth", "errors"]);
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values.email, values.password);
      const target = redirectTo && redirectTo.startsWith("/app") ? redirectTo : "/app/dashboard";
      await navigate({ to: target, replace: true });
    } catch (error) {
      if (isApiError(error) && error.kind === "network") {
        await navigate({ to: "/indisponivel" });
        return;
      }
      setFormError(
        isApiError(error) && (error.kind === "unauthorized" || error.kind === "validation")
          ? t("auth:login.invalidCredentials")
          : t(isApiError(error) ? `errors:${error.messageKey}` : "errors:api.unknown"),
      );
    }
  });

  return (
    <AuthLayout title={t("auth:login.title")} subtitle={t("auth:login.subtitle")}>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormField label={t("auth:login.email")} type="email" autoComplete="email" error={formState.errors.email?.message} {...register("email")} />
        <FormField label={t("auth:login.password")} type="password" autoComplete="current-password" error={formState.errors.password?.message} {...register("password")} />
        {formError && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {formError}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? t("auth:login.submitting") : t("auth:login.submit")}
        </Button>
        <div className="text-center">
          <Link to="/esqueci-minha-senha" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            {t("auth:login.forgot")}
          </Link>
        </div>
        {env.useMocks && <p className="text-center text-xs text-muted-foreground">{t("auth:login.demoHint")}</p>}
      </form>
    </AuthLayout>
  );
}
