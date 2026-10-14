import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Activity,
  Building2,
  CheckCircle2,
  Clock3,
  Inbox,
  MessagesSquare,
  Radio,
  ShieldCheck,
  UserCircle,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/shared/components";
import { useSession, setSessionUser } from "@/shared/auth/session-store";
import { fetchMe } from "@/shared/auth/auth-service";
import { queryKeys } from "@/shared/api/query-keys";
import { useApiStatus } from "@/shared/api/api-status";
import { useSocketStatus } from "@/shared/socket/socket-client";
import { cn } from "@/lib/utils";
import { operationalDashboardQuery } from "@/modules/tickets/api";

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span aria-hidden>{icon}</span>
        <h2 className="font-sans text-sm font-medium tracking-normal">{title}</h2>
      </div>
      <div className="mt-3 text-lg font-semibold">{children}</div>
    </section>
  );
}

function StatusDot({ tone }: { tone: "ok" | "warn" | "off" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-2.5 rounded-full",
        tone === "ok" ? "bg-success" : tone === "warn" ? "bg-warning" : "bg-muted-foreground/50",
      )}
    />
  );
}

export function DashboardPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  const { user } = useSession();
  const apiStatus = useApiStatus();
  const socketStatus = useSocketStatus();
  const operations = useQuery(operationalDashboardQuery());

  // Mantém os dados de apresentação do usuário atualizados (TanStack Query + camada central).
  useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: async ({ signal }) => {
      const me = await fetchMe(signal);
      setSessionUser(me);
      return me;
    },
    staleTime: 5 * 60_000,
  });

  if (!user) return null;
  const firstName = user.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader title={t("greeting", { name: firstName })} description={t("subtitle")} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard icon={<Activity className="size-4" />} title={t("api.title")}>
          <span className="flex items-center gap-2">
            <StatusDot
              tone={apiStatus === "online" ? "ok" : apiStatus === "offline" ? "warn" : "off"}
            />
            {t(`api.${apiStatus}`)}
          </span>
        </InfoCard>
        <InfoCard icon={<Radio className="size-4" />} title={t("socket.title")}>
          <span className="flex items-center gap-2">
            <StatusDot
              tone={
                socketStatus === "connected"
                  ? "ok"
                  : socketStatus === "reconnecting"
                    ? "warn"
                    : "off"
              }
            />
            <span className="text-base">{t(`socket.${socketStatus}`)}</span>
          </span>
        </InfoCard>
        <InfoCard icon={<Building2 className="size-4" />} title={t("company")}>
          <span className="break-all">{user.companyId}</span>
        </InfoCard>
        <InfoCard icon={<UserCircle className="size-4" />} title={t("role")}>
          {t(`common:roles.${user.role}`)}
        </InfoCard>
      </div>

      <section className="rounded-2xl border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" aria-hidden />
          <h2 className="text-lg font-semibold">{t("permissions.title")}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t("permissions.description")}</p>
        {user.permissions.length ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {user.permissions.map((p) => (
              <li key={p}>
                <Badge variant="secondary" className="font-mono">
                  {p}
                </Badge>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm">{t("permissions.none")}</p>
        )}
      </section>

      <section aria-labelledby="indicadores">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="indicadores" className="text-lg font-semibold">
              {t("indicators.title")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("indicators.description")}</p>
          </div>
          <Badge variant="outline">{t("indicators.updatedEveryMinute")}</Badge>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCard icon={<Inbox className="size-4" />} title={t("indicators.waiting")}>
            {operations.isPending ? "…" : (operations.data?.pending ?? "—")}
          </InfoCard>
          <InfoCard icon={<MessagesSquare className="size-4" />} title={t("indicators.open")}>
            {operations.isPending ? "…" : (operations.data?.open ?? "—")}
          </InfoCard>
          <InfoCard icon={<CheckCircle2 className="size-4" />} title={t("indicators.closed")}>
            {operations.isPending ? "…" : (operations.data?.closedToday ?? "—")}
          </InfoCard>
          <InfoCard icon={<Clock3 className="size-4" />} title={t("indicators.firstResponse")}>
            {operations.data?.firstResponseMinutes != null
              ? t("indicators.minutes", { count: operations.data.firstResponseMinutes })
              : t("common:states.unavailable")}
            {operations.data?.firstResponseMinutes == null && (
              <p className="mt-1 text-xs font-normal text-muted-foreground">
                {t("indicators.firstResponsePending")}
              </p>
            )}
          </InfoCard>
        </div>
        {operations.error && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          >
            {t("indicators.loadError")}
          </p>
        )}
      </section>

      <section
        className="rounded-2xl border bg-card p-5 shadow-soft"
        aria-labelledby="desempenho-equipe"
      >
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" aria-hidden />
          <h2 id="desempenho-equipe" className="text-lg font-semibold">
            {t("attendants.title")}
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t("attendants.description")}</p>
        {operations.isPending ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("common:states.loading")}</p>
        ) : !operations.data?.attendants.length ? (
          <p className="mt-4 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
            {t("attendants.empty")}
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("attendants.name")}</th>
                  <th className="px-4 py-3 text-right font-medium">
                    {t("attendants.closedToday")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {operations.data.attendants.map((attendant) => (
                  <tr key={attendant.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{attendant.name}</td>
                    <td className="px-4 py-3 text-right text-lg font-semibold tabular-nums">
                      {attendant.closedToday}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {operations.data?.attendantsPartial && (
          <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">
            {t("attendants.partial")}
          </p>
        )}
      </section>
    </div>
  );
}
