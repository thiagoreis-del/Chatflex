import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { StatusPage } from "./StatusPage";

export function NotFoundPage() {
  const { t } = useTranslation(["errors", "common"]);
  return (
    <StatusPage>
      <section className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="font-display text-6xl font-extrabold text-primary" aria-hidden>
          404
        </p>
        <h1 className="text-xl font-semibold">{t("errors:404.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("errors:404.description")}</p>
        <Button asChild className="mt-2">
          <Link to="/">{t("common:actions.backHome")}</Link>
        </Button>
      </section>
    </StatusPage>
  );
}
