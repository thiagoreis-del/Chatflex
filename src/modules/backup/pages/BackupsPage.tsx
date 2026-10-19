/** Tela de backups da plataforma (superadmin). */
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Download, RotateCcw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  ConfirmDialog,
  DateDisplay,
  LoadingState,
  PageHeader,
  QueryError,
} from "@/shared/components";
import { notifyError } from "@/shared/errors/handle-error";
import {
  backupsQuery,
  createBackup,
  downloadBackup,
  restoreBackup,
  saveBackupSchedule,
  type Backup,
  type BackupSchedule,
} from "../api";

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} ${units[i]}`;
}

export function BackupsPage() {
  const { t } = useTranslation("backups");
  const qc = useQueryClient();
  const q = useQuery(backupsQuery());
  const [schedule, setSchedule] = useState<BackupSchedule | null>(null);
  const [restoring, setRestoring] = useState<Backup | null>(null);
  const [confirmWord, setConfirmWord] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (q.data && !schedule) setSchedule(q.data.schedule);
  }, [q.data, schedule]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["backups"] });
  const create = useMutation({
    mutationFn: createBackup,
    onSuccess: () => {
      toast.success(t("created"));
      void refresh();
    },
    onError: notifyError,
  });
  const restore = useMutation({
    mutationFn: (id: string) => restoreBackup(id),
    onSuccess: () => toast.success(t("restored")),
    onError: notifyError,
  });
  const save = useMutation({
    mutationFn: saveBackupSchedule,
    onSuccess: () => {
      toast.success(t("schedule.saved"));
      void refresh();
    },
    onError: notifyError,
  });

  async function onDownload(b: Backup) {
    setDownloading(b.id);
    try {
      await downloadBackup(b);
    } catch (e) {
      notifyError(e);
    } finally {
      setDownloading(null);
    }
  }

  const statusVariant = (s: Backup["status"]) =>
    s === "failed" ? "destructive" : s === "completed" ? "secondary" : "outline";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            <Plus className="size-4" />
            {create.isPending ? t("creating") : t("create")}
          </Button>
        }
      />

      {schedule && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("schedule.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                id="bk-enabled"
                checked={schedule.enabled}
                onCheckedChange={(v) => setSchedule({ ...schedule, enabled: v })}
              />
              <Label htmlFor="bk-enabled">{t("schedule.enabled")}</Label>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="bk-freq">{t("schedule.frequency")}</Label>
                <select
                  id="bk-freq"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={schedule.frequency}
                  disabled={!schedule.enabled}
                  onChange={(e) =>
                    setSchedule({
                      ...schedule,
                      frequency: e.target.value as BackupSchedule["frequency"],
                    })
                  }
                >
                  <option value="daily">{t("schedule.daily")}</option>
                  <option value="weekly">{t("schedule.weekly")}</option>
                  <option value="monthly">{t("schedule.monthly")}</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bk-time">{t("schedule.time")}</Label>
                <Input
                  id="bk-time"
                  type="time"
                  value={schedule.time}
                  disabled={!schedule.enabled}
                  onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bk-ret">
                  {t("schedule.retention")} ({t("schedule.retentionHint")})
                </Label>
                <Input
                  id="bk-ret"
                  type="number"
                  min={1}
                  max={365}
                  value={schedule.retention}
                  disabled={!schedule.enabled}
                  onChange={(e) =>
                    setSchedule({
                      ...schedule,
                      retention: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => save.mutate(schedule)}
              disabled={save.isPending}
            >
              {t("schedule.save")}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("listTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          {q.isPending ? (
            <LoadingState />
          ) : q.isError ? (
            <QueryError error={q.error} onRetry={() => void q.refetch()} />
          ) : q.data.backups.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr className="border-b">
                    <th className="py-2 pr-3 font-medium">{t("columns.file")}</th>
                    <th className="py-2 pr-3 font-medium">{t("columns.date")}</th>
                    <th className="py-2 pr-3 font-medium">{t("columns.size")}</th>
                    <th className="py-2 pr-3 font-medium">{t("columns.status")}</th>
                    <th className="py-2 text-right font-medium">{t("columns.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {q.data.backups.map((b) => (
                    <tr key={b.id} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium break-all">{b.filename}</td>
                      <td className="py-2 pr-3">
                        <DateDisplay value={b.createdAt} withTime />
                      </td>
                      <td className="py-2 pr-3 tabular-nums">{formatSize(b.sizeBytes)}</td>
                      <td className="py-2 pr-3">
                        <Badge variant={statusVariant(b.status)} title={b.error ?? undefined}>
                          {t(`status.${b.status}`)}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={b.status !== "completed" || downloading === b.id}
                            onClick={() => void onDownload(b)}
                          >
                            <Download className="size-4" />
                            {t("download")}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={b.status !== "completed" || restore.isPending}
                            onClick={() => {
                              setConfirmWord("");
                              setRestoring(b);
                            }}
                          >
                            <RotateCcw className="size-4" />
                            {t("restore")}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!restoring}
        onOpenChange={(o) => !o && setRestoring(null)}
        title={t("restoreTitle")}
        description={t("restoreDescription", { file: restoring?.filename ?? "" })}
        confirmLabel={t("restore")}
        onConfirm={() => {
          if (restoring && confirmWord.trim().toUpperCase() === t("restoreConfirmWord")) {
            restore.mutate(restoring.id);
            setRestoring(null);
          } else {
            toast.error(t("restoreConfirmLabel"));
          }
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="bk-confirm">{t("restoreConfirmLabel")}</Label>
          <Input
            id="bk-confirm"
            value={confirmWord}
            onChange={(e) => setConfirmWord(e.target.value)}
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}
