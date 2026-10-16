import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { notifyError } from "@/shared/errors/handle-error";
import { useSession } from "@/shared/auth/session-store";
import { usersQuery } from "@/modules/users/api";
import {
  playSlaTone,
  saveSlaConfig,
  slaConfigQuery,
  validateSla,
  type SlaConfig,
  type SlaTone,
} from "../sla";

const TONES: SlaTone[] = ["classic", "double", "urgent", "soft"];

export function SlaSettingsCard() {
  const { t } = useTranslation("settings");
  const qc = useQueryClient();
  const companyId = String(useSession().user?.companyId ?? "");
  const q = useQuery(slaConfigQuery(companyId));
  const users = useQuery(usersQuery({ search: "", page: 1 }));
  const [form, setForm] = useState<SlaConfig | null>(null);
  const [holiday, setHoliday] = useState("");

  useEffect(() => {
    if (q.data && !form) setForm(q.data);
  }, [q.data, form]);

  const save = useMutation({
    mutationFn: (next: SlaConfig) => saveSlaConfig(q.data ?? next, next),
    onSuccess: () => {
      toast.success(t("sla.saved"));
      setForm(null);
      void qc.invalidateQueries({ queryKey: ["settings", companyId, "sla"] });
    },
    onError: notifyError,
  });

  if (!form) return null;
  const set = (patch: Partial<SlaConfig>) => setForm({ ...form, ...patch });
  const off = !form.enabled;
  const supervisors = (users.data?.data ?? []).filter((u) => u.profile !== "user");

  const toggle = (id: keyof SlaConfig, label: string, disabled = off) => (
    <div className="flex items-center gap-3">
      <Switch
        id={`sla-${id}`}
        checked={Boolean(form[id])}
        disabled={disabled}
        onCheckedChange={(v) => set({ [id]: v } as Partial<SlaConfig>)}
      />
      <Label htmlFor={`sla-${id}`}>{label}</Label>
    </div>
  );

  const minutes = (id: "warningMinutes" | "urgentMinutes" | "violatedMinutes") => (
    <div className="space-y-1.5">
      <Label htmlFor={`sla-${id}`}>{t(`sla.${id}`)}</Label>
      <Input
        id={`sla-${id}`}
        type="number"
        min={1}
        max={240}
        disabled={off}
        value={form[id]}
        onChange={(e) => set({ [id]: Math.max(1, Number(e.target.value) || 1) })}
      />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("sla.title")}</CardTitle>
        <CardDescription>{t("sla.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {toggle("enabled", t("sla.enabled"), false)}
        {off && <p className="text-sm text-muted-foreground">{t("sla.disabledInfo")}</p>}

        <div className="grid gap-4 sm:grid-cols-3">
          {minutes("warningMinutes")}
          {minutes("urgentMinutes")}
          {minutes("violatedMinutes")}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {toggle("sound", t("sla.sound"))}
          {toggle("desktop", t("sla.desktop"))}
          {toggle("supervisorAlerts", t("sla.supervisorAlerts"))}
          {toggle("highlight", t("sla.highlight"))}
          {toggle("onlyBusinessHours", t("sla.onlyBusinessHours"))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sla-tone">{t("sla.tone")}</Label>
            <div className="flex gap-2">
              <select
                id="sla-tone"
                className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                value={form.tone}
                disabled={off || !form.sound}
                onChange={(e) => set({ tone: e.target.value as SlaTone })}
              >
                {TONES.map((x) => (
                  <option key={x} value={x}>
                    {t(`sla.tones.${x}`)}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                disabled={off || !form.sound}
                onClick={() => playSlaTone(form.tone, form.volume)}
              >
                {t("sla.test")}
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sla-volume">
              {t("sla.volume")}: {form.volume}%
            </Label>
            <input
              id="sla-volume"
              type="range"
              min={0}
              max={100}
              className="w-full accent-primary"
              disabled={off || !form.sound}
              value={form.volume}
              onChange={(e) => set({ volume: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("sla.supervisors")}</Label>
          {supervisors.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("sla.noSupervisors")}</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {supervisors.map((u) => (
                <label key={u.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-primary"
                    disabled={off || !form.supervisorAlerts}
                    checked={form.supervisorIds.includes(u.id)}
                    onChange={(e) =>
                      set({
                        supervisorIds: e.target.checked
                          ? [...form.supervisorIds, u.id]
                          : form.supervisorIds.filter((x) => x !== u.id),
                      })
                    }
                  />
                  {u.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sla-holiday">{t("sla.holidays")}</Label>
          <div className="flex gap-2">
            <Input
              id="sla-holiday"
              type="date"
              className="w-48"
              disabled={off}
              value={holiday}
              onChange={(e) => setHoliday(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              disabled={off || !holiday || form.holidays.includes(holiday)}
              onClick={() => {
                set({ holidays: [...form.holidays, holiday].sort() });
                setHoliday("");
              }}
            >
              {t("sla.addHoliday")}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.holidays.map((d) => (
              <span key={d} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                {new Date(`${d}T12:00:00`).toLocaleDateString("pt-BR")}
                <button
                  type="button"
                  aria-label={t("sla.removeHoliday")}
                  onClick={() => set({ holidays: form.holidays.filter((x) => x !== d) })}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{t("sla.backendNote")}</p>

        <div className="flex justify-end">
          <Button
            disabled={save.isPending}
            onClick={() => {
              if (validateSla(form)) {
                toast.error(t("sla.orderError"));
                return;
              }
              save.mutate(form);
            }}
          >
            {t("sla.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
