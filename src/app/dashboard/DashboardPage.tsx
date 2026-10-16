import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Activity,
  Building2,
  Radio,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/shared/components";
import { useSession, setSessionUser } from "@/shared/auth/session-store";
import { fetchMe } from "@/shared/auth/auth-service";
import { queryKeys } from "@/shared/api/query-keys";
import { useApiStatus } from "@/shared/api/api-status";
import { useSocketStatus } from "@/shared/socket/socket-client";
import { cn } from "@/lib/utils";
import { OperationsPanel } from "./OperationsPanel";
import { SlaReportPanel } from "./SlaReportPanel";

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

      <OperationsPanel />
      <SlaReportPanel />
    </div>
  );
}
