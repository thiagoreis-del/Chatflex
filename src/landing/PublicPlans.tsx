import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/shared/format/format";
import { apiRequest } from "@/shared/api/client";
import { env } from "@/shared/config/env";
import { fromBackendPlan } from "@/modules/plans/api";
import { defaultPublicPlans, toPublicPlans } from "@/modules/plans/commercial";

export function PublicPlans() {
  const { t } = useTranslation("landing");
  const { data } = useQuery({
    queryKey: ["public-plans"],
    enabled: !env.useMocks,
    retry: false,
    staleTime: 300_000,
    // Lista pública (sem login); se o servidor não expor, usa os planos padrão.
    queryFn: async () =>
      (await apiRequest<Parameters<typeof fromBackendPlan>[0][]>("/plans/list", { anonymous: true, skipRefresh: true })).map(fromBackendPlan),
  });
  const plans = data ? toPublicPlans(data) : defaultPublicPlans;
  const items = ["unlimitedTickets", "unlimitedUsers", "unlimitedQueues", "support"] as const;

  return (
    <section id="planos" className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
      <h2 className="text-2xl font-bold sm:text-3xl">{t("plans.title")}</h2>
      <p className="mt-2 text-muted-foreground">{t("plans.subtitle")}</p>
      <ul className="mt-8 grid gap-5 md:grid-cols-3">
        {plans.map((p) => (
          <li
            key={p.id}
            className={`relative flex flex-col rounded-2xl border bg-card p-6 ${p.recommended ? "border-primary shadow-brand" : ""}`}
          >
            {p.recommended && (
              <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                {t("plans.recommended")}
              </span>
            )}
            <h3 className="text-lg font-semibold">{p.name}</h3>
            <p className="mt-3 text-3xl font-extrabold">
              {formatCents(p.monthlyPrice)}
              <span className="text-base font-medium text-muted-foreground">{t("plans.perMonth")}</span>
            </p>
            <ul className="mt-5 flex-1 space-y-2 text-sm">
              <li className="flex gap-2">
                <Check className="size-4 text-success" aria-hidden />
                {t("plans.connections", { count: p.connections })}
              </li>
              {items.map((k) => (
                <li key={k} className="flex gap-2">
                  <Check className="size-4 text-success" aria-hidden />
                  {t(`plans.${k}`)}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6" variant={p.recommended ? "default" : "outline"}>
              <Link to="/login">{t("plans.start")}</Link>
            </Button>
            <Button asChild variant="ghost" className="mt-2">
              <a href={`mailto:contato@chatbotflex.com.br?subject=${encodeURIComponent(p.name)}`}>
                {t("plans.sales")}
              </a>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
