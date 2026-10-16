import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/shared/api/client";
import { slaEndpoints } from "@/shared/config/endpoints";

interface SlaViolation {
  id: number;
  ticketId: number;
  level: "warning" | "urgent" | "violated";
  waitedMinutes: number;
  contactName?: string | null;
  createdAt: string;
}
interface SlaReport {
  total: number;
  warnings: number;
  avgMinutes: number;
  maxMinutes: number;
  recent: SlaViolation[];
}

export function SlaReportPanel() {
  const { t } = useTranslation("dashboard");
  const q = useQuery({
    queryKey: ["sla", "report", "today"],
    queryFn: ({ signal }) => apiRequest<SlaReport>(`${slaEndpoints.report}?period=today`, { signal }),
    retry: false,
    refetchInterval: 60_000,
  });

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold">{t("slaReport.title")}</h2>
      <p className="text-sm text-muted-foreground">{t("slaReport.description")}</p>
      {q.isError ? (
        <p className="mt-4 text-sm text-muted-foreground">{t("slaReport.unavailable")}</p>
      ) : q.data ? (
        <>
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(["total", "warnings", "avgMinutes", "maxMinutes"] as const).map((k) => (
              <div key={k} className="rounded-xl bg-muted/50 p-3">
                <dt className="text-xs text-muted-foreground">{t(`slaReport.${k}`)}</dt>
                <dd className="text-2xl font-semibold">{Math.round(q.data[k] ?? 0)}</dd>
              </div>
            ))}
          </dl>
          <h3 className="mt-5 text-sm font-medium">{t("slaReport.recent")}</h3>
          {q.data.recent?.length ? (
            <ul className="mt-2 divide-y text-sm">
              {q.data.recent.map((v) => (
                <li key={v.id} className="flex justify-between gap-3 py-2">
                  <span className="truncate">
                    {v.contactName || t("slaReport.ticket", { id: v.ticketId })}
                  </span>
                  <span className="shrink-0 text-destructive">
                    {t("slaReport.minutes", { count: v.waitedMinutes })} ·{" "}
                    {new Date(v.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">{t("slaReport.none")}</p>
          )}
        </>
      ) : null}
    </section>
  );
}
