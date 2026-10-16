import { useEffect, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { CheckCircle2, Clock3, Hourglass, Inbox, MessagesSquare, Timer, Users, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ticketKeys } from "@/shared/api/query-keys";
import { socketClient } from "@/shared/socket/socket-client";
import { operationalDashboardQuery } from "@/modules/tickets/api";

function Metric({ icon, title, value, hint }: { icon: ReactNode; title: string; value: ReactNode; hint?: string | undefined }) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span aria-hidden>{icon}</span>
        <h3 className="font-sans text-sm font-medium tracking-normal">{title}</h3>
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </section>
  );
}

export function OperationsPanel() {
  const { t } = useTranslation(["dashboard", "common"]);
  const qc = useQueryClient();
  const q = useQuery(operationalDashboardQuery());
  const d = q.data;

  // Eventos de ticket via Socket atualizam os indicadores (com atraso mínimo agrupado).
  useEffect(() => {
    socketClient.connect();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void qc.invalidateQueries({ queryKey: ticketKeys.operationalDashboard() }), 2000);
    };
    const off = socketClient.onCompany("ticket", refresh);
    return () => {
      off();
      clearTimeout(timer);
    };
  }, [qc]);

  const mins = (v: number | null | undefined) =>
    q.isPending ? "…" : v == null ? t("indicators.none") : t("indicators.minutes", { count: v });
  const num = (v: number | undefined) => (q.isPending ? "…" : (v ?? "—"));

  const config = {
    created: { label: t("hourly.created"), color: "var(--primary)" },
    closed: { label: t("hourly.closed"), color: "var(--muted-foreground)" },
  } satisfies ChartConfig;
  const startHour = d ? Math.min(8, ...d.hourly.filter((h) => h.created || h.closed).map((h) => h.hour)) : 8;
  const chart = (d?.hourly ?? []).filter((h) => h.hour >= startHour).map((h) => ({ ...h, label: `${h.hour}h` }));

  return (
    <>
      <section aria-labelledby="indicadores">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="indicadores" className="text-lg font-semibold">{t("indicators.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("indicators.description")}</p>
          </div>
          <Badge variant="outline">{t("indicators.updatedEveryMinute")}</Badge>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Metric icon={<Inbox className="size-4" />} title={t("indicators.waiting")} value={num(d?.pending)} />
          <Metric icon={<MessagesSquare className="size-4" />} title={t("indicators.open")} value={num(d?.open)} />
          <Metric icon={<CheckCircle2 className="size-4" />} title={t("indicators.closed")} value={num(d?.closedToday)} />
          <Metric icon={<Hourglass className="size-4" />} title={t("indicators.tme")} value={mins(d?.waitMinutes)} hint={t("indicators.tmeHint")} />
          <Metric icon={<Timer className="size-4" />} title={t("indicators.tma")} value={mins(d?.handleMinutes)} hint={t("indicators.tmaHint")} />
          <Metric
            icon={<Clock3 className="size-4" />}
            title={t("indicators.firstResponse")}
            value={mins(d?.firstResponseMinutes)}
            hint={d && d.firstResponseMinutes == null ? t("indicators.firstResponsePending") : undefined}
          />
        </div>
        {q.error && (
          <p role="alert" className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {t("indicators.loadError")}
          </p>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-soft">
        <h2 className="text-lg font-semibold">{t("hourly.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("hourly.description")}</p>
        <ChartContainer config={config} className="mt-4 aspect-auto h-64 w-full">
          <BarChart data={chart}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="created" fill="var(--color-created)" radius={4} />
            <Bar dataKey="closed" fill="var(--color-closed)" radius={4} />
          </BarChart>
        </ChartContainer>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-primary" aria-hidden />
            <h2 className="text-lg font-semibold">{t("attendants.title")}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t("attendants.description")}</p>
          {!d?.attendants.length ? (
            <p className="mt-4 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
              {q.isPending ? t("common:states.loading") : t("attendants.empty")}
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">{t("attendants.name")}</th>
                    <th className="px-3 py-2 text-right font-medium">{t("attendants.open")}</th>
                    <th className="px-3 py-2 text-right font-medium">{t("attendants.closedToday")}</th>
                    <th className="px-3 py-2 text-right font-medium">{t("attendants.tma")}</th>
                  </tr>
                </thead>
                <tbody>
                  {d.attendants.map((a) => (
                    <tr key={a.id} className="border-t">
                      <td className="px-3 py-2 font-medium">{a.name}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{a.open}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{a.closedToday}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{a.avgHandleMinutes == null ? "—" : `${a.avgHandleMinutes} min`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-primary" aria-hidden />
            <h2 className="text-lg font-semibold">{t("queues.title")}</h2>
          </div>
          {!d?.queues.length ? (
            <p className="mt-4 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
              {q.isPending ? t("common:states.loading") : t("queues.empty")}
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">{t("queues.name")}</th>
                    <th className="px-3 py-2 text-right font-medium">{t("queues.waiting")}</th>
                    <th className="px-3 py-2 text-right font-medium">{t("queues.closedToday")}</th>
                    <th className="px-3 py-2 text-right font-medium">{t("queues.tme")}</th>
                  </tr>
                </thead>
                <tbody>
                  {d.queues.map((x) => (
                    <tr key={x.id} className="border-t">
                      <td className="px-3 py-2 font-medium">
                        <span className="mr-2 inline-block size-2.5 rounded-full" style={{ backgroundColor: x.color }} aria-hidden />
                        {x.name}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{x.waiting}</td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{x.closedToday}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{x.waitMinutes == null ? "—" : `${x.waitMinutes} min`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
      {d?.attendantsPartial && <p className="text-xs text-muted-foreground">{t("attendants.partial")}</p>}
    </>
  );
}
