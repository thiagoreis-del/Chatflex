import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ListOrdered, Users, History, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLogo, AppName, DemoBanner, ThemeToggle } from "@/shared/components";

const benefits = [
  { key: "queues", icon: ListOrdered },
  { key: "team", icon: Users },
  { key: "history", icon: History },
  { key: "secure", icon: ShieldCheck },
] as const;

export function LandingPage() {
  const { t } = useTranslation(["landing", "common"]);
  return (
    <div className="min-h-screen">
      <DemoBanner />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-8">
        <div className="flex items-center gap-2">
          <AppLogo />
          <AppName className="text-xl" />
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="outline">
            <Link to="/login">{t("common:actions.login")}</Link>
          </Button>
        </div>
      </header>

      <main id="conteudo">
        <section className="bg-hero">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:py-24">
            <div>
              <p className="inline-flex rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
                {t("eyebrow")}
              </p>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
                {t("title")}
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground">{t("subtitle")}</p>
              <Button asChild size="lg" className="mt-8 h-12 px-6 text-base shadow-brand">
                <Link to="/login">
                  {t("cta")} <ArrowRight className="size-4" aria-hidden />
                </Link>
              </Button>
            </div>

            <div aria-hidden className="relative mx-auto w-full max-w-sm">
              <div className="absolute -inset-4 -z-10 rotate-3 rounded-[2rem] bg-primary/15" />
              <div className="rounded-[1.75rem] border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-sm font-semibold">{t("preview.customer")}</span>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">
                    {t("preview.queue")}
                  </span>
                </div>
                <div className="space-y-3 py-4">
                  <p className="max-w-[80%] rounded-2xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm">
                    {t("preview.msg1")}
                  </p>
                  <p className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                    {t("preview.msg2")}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                  <span className="size-2 rounded-full bg-success" /> {t("preview.agent")}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
          <h2 className="text-2xl font-bold sm:text-3xl">{t("benefitsTitle")}</h2>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ key, icon: Icon }) => (
              <li key={key} className="rounded-2xl border bg-card p-6">
                <span
                  className="grid size-10 place-items-center rounded-xl bg-secondary text-secondary-foreground"
                  aria-hidden
                >
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{t(`benefits.${key}.title`)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(`benefits.${key}.text`)}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted-foreground sm:px-8">
          {t("footer", { year: new Date().getFullYear() })}
        </p>
      </footer>
    </div>
  );
}
