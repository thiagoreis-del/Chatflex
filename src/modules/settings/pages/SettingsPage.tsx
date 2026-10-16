import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LoadingState, PageHeader, QueryError } from "@/shared/components";
import { notifyError } from "@/shared/errors/handle-error";
import { useSession } from "@/shared/auth/session-store";
import { ClosingMessageCard } from "../ClosingMessageCard";
import { SlaSettingsCard } from "@/modules/sla/components/SlaSettingsCard";
import {
  businessHoursQuery,
  defaultBusinessHours,
  isWithinBusinessHours,
  saveBusinessHours,
  type BusinessHoursSetting,
} from "../business-hours";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export function SettingsPage() {
  const { t } = useTranslation("settings");
  const qc = useQueryClient();
  const companyId = String(useSession().user?.companyId ?? "");
  const q = useQuery(businessHoursQuery(companyId));
  const [form, setForm] = useState<BusinessHoursSetting | null>(null);

  useEffect(() => {
    if (q.data && !form) setForm(q.data);
  }, [q.data, form]);

  const save = useMutation({
    mutationFn: (s: BusinessHoursSetting) => saveBusinessHours(companyId, s),
    onSuccess: () => {
      toast.success(t("saved"));
      void qc.invalidateQueries({ queryKey: ["settings", companyId] });
    },
    onError: notifyError,
  });

  const invalidDay = form?.days.findIndex((d) => d.enabled && d.start >= d.end) ?? -1;
  const missingMessage = !!form?.outOfHoursEnabled && !form.outOfHoursMessage.trim();

  function submit() {
    if (!form) return;
    if (invalidDay >= 0) {
      toast.error(t("hours.invalid", { day: t(`days.${DAY_KEYS[invalidDay]}`) }));
      return;
    }
    if (missingMessage) {
      toast.error(t("outOfHours.required"));
      return;
    }
    save.mutate({ ...form, outOfHoursMessage: form.outOfHoursMessage.trim() });
  }

  const updateDay = (i: number, patch: Partial<BusinessHoursSetting["days"][number]>) =>
    form && setForm({ ...form, days: form.days.map((d, j) => (j === i ? { ...d, ...patch } : d)) });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title={t("title")} description={t("subtitle")} />

      {q.isPending ? (
        <LoadingState />
      ) : q.isError ? (
        <QueryError error={q.error} onRetry={() => void q.refetch()} />
      ) : form ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{t("hours.title")}</CardTitle>
                <Badge variant={isWithinBusinessHours(form) ? "secondary" : "outline"}>
                  {isWithinBusinessHours(form) ? t("hours.openNow") : t("hours.closedNow")}
                </Badge>
              </div>
              <CardDescription>{t("hours.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {form.days.map((d, i) => (
                <div
                  key={DAY_KEYS[i]}
                  className="flex flex-wrap items-center gap-3 rounded-lg border p-3 sm:flex-nowrap"
                >
                  <div className="flex w-36 items-center gap-2">
                    <Switch
                      id={`day-${i}`}
                      checked={d.enabled}
                      onCheckedChange={(v) => updateDay(i, { enabled: v })}
                    />
                    <Label htmlFor={`day-${i}`}>{t(`days.${DAY_KEYS[i]}`)}</Label>
                  </div>
                  {d.enabled ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        aria-label={t("hours.start")}
                        className="w-28"
                        value={d.start}
                        onChange={(e) => updateDay(i, { start: e.target.value })}
                      />
                      <span className="text-sm text-muted-foreground">{t("hours.to")}</span>
                      <Input
                        type="time"
                        aria-label={t("hours.end")}
                        className="w-28"
                        value={d.end}
                        onChange={(e) => updateDay(i, { end: e.target.value })}
                      />
                      {d.start >= d.end && (
                        <span className="text-xs text-destructive">{t("hours.endBeforeStart")}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t("hours.closed")}</span>
                  )}
                </div>
              ))}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const first = form.days.find((d) => d.enabled);
                    if (first)
                      setForm({
                        ...form,
                        days: form.days.map((d) => (d.enabled ? { ...d, start: first.start, end: first.end } : d)),
                      });
                  }}
                >
                  {t("hours.copyFirst")}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setForm({ ...defaultBusinessHours(), outOfHoursEnabled: form.outOfHoursEnabled, outOfHoursMessage: form.outOfHoursMessage })}>
                  {t("hours.reset")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("outOfHours.title")}</CardTitle>
              <CardDescription>{t("outOfHours.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch
                  id="ooh-enabled"
                  checked={form.outOfHoursEnabled}
                  onCheckedChange={(v) => setForm({ ...form, outOfHoursEnabled: v })}
                />
                <Label htmlFor="ooh-enabled">{t("outOfHours.enabled")}</Label>
              </div>
              <Textarea
                rows={4}
                maxLength={1000}
                placeholder={t("outOfHours.placeholder")}
                value={form.outOfHoursMessage}
                disabled={!form.outOfHoursEnabled}
                onChange={(e) => setForm({ ...form, outOfHoursMessage: e.target.value })}
              />
              {missingMessage && <p className="text-xs text-destructive">{t("outOfHours.required")}</p>}
              <p className="text-xs text-muted-foreground">{t("outOfHours.backendNote")}</p>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending ? t("saving") : t("save")}
            </Button>
          </div>
        </>
      ) : null}

      <SlaSettingsCard />

      <ClosingMessageCard />
    </div>
  );
}
