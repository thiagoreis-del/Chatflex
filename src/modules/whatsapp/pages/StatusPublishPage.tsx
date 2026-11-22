import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CalendarClock, ImagePlus, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { whatsappKeys } from "@/shared/api/query-keys";
import { connectionsQuery } from "../api";
import {
  cancelStatusSchedule,
  isStatusConnection,
  localStatusDay,
  mergeStatusFiles,
  publishStatusBatch,
  statusSchedulesQuery,
  StatusPublishError,
  STATUS_MAX_PHOTOS,
  STATUS_PHOTO_FORMATS,
  type StatusItem,
} from "../status";

const statusErrors = {
  ERR_STATUS_AUDIENCE: "status.invalidAudience",
  ERR_STATUS_AUDIENCE_UNAVAILABLE: "status.audienceUnavailable",
  ERR_STATUS_PRIVACY: "status.privacy",
  ERR_STATUS_PHOTO_FORMAT: "status.onlyImages",
  ERR_STATUS_PHOTO_SIZE: "status.sizeLimit",
  ERR_STATUS_DISCONNECTED: "status.disconnected",
  ERR_STATUS_UNSUPPORTED_CONNECTION: "status.unsupportedConnection",
  ERR_STATUS_BUSY: "status.connectionBusy",
  ERR_STATUS_REJECTED: "status.rejected",
  ERR_STATUS_UNCONFIRMED: "status.unconfirmed",
  ERR_STATUS_DATE: "status.invalidDate",
  ERR_STATUS_SCHEDULE_UNCONFIRMED: "status.agenda.unconfirmed",
  ERR_STATUS_SCHEDULE_CONFLICT: "status.agenda.conflict",
  ERR_STATUS_MISSED_TIME: "status.agenda.missedTime",
} as const;

function errorLabel(code: string | null) {
  return statusErrors[code as keyof typeof statusErrors] ?? "status.error";
}

function PhotoPreview({ file }: { file: File }) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const url = URL.createObjectURL(file);
    if (image.current) image.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <img ref={image} alt={file.name} className="size-full object-cover" />;
}

export function StatusPublishPage() {
  const { t, i18n } = useTranslation("whatsapp");
  const queryClient = useQueryClient();
  const connections = useQuery(connectionsQuery());
  const available = (connections.data ?? []).filter(isStatusConnection);
  const [whatsappId, setWhatsappId] = useState<number | "">("");
  const connection =
    available.find((item) => item.id === whatsappId) ??
    (available.length === 1 ? available[0] : undefined);
  const [mode, setMode] = useState<"now" | "schedule">("now");
  const [date, setDate] = useState(localStatusDay);
  const [time, setTime] = useState("");
  const [agendaDay, setAgendaDay] = useState(localStatusDay);
  const [items, setItems] = useState<StatusItem[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sending = useRef(false);
  const pending = items.filter((item) => !item.unconfirmed);
  const busy = progress !== null;
  const scheduled = mode === "schedule";
  const canSubmit = Boolean(
    connection &&
    pending.length &&
    !busy &&
    (scheduled ? date && time : connection.status === "CONNECTED"),
  );
  const agenda = useQuery(statusSchedulesQuery(connection?.id ?? 0, agendaDay));
  const cancel = useMutation({
    mutationFn: ({ numberId, statusId }: { numberId: number; statusId: string }) =>
      cancelStatusSchedule(numberId, statusId),
    onSuccess: () => void agenda.refetch(),
    onError: () => toast.error(t("status.agenda.conflict")),
  });

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const result = mergeStatusFiles(items, Array.from(files));
    if (result.rejectedNonImage) toast.warning(t("status.onlyImages"));
    if (result.rejectedSize) toast.warning(t("status.sizeLimit"));
    if (result.overflow) toast.warning(t("status.tooMany"));
    setItems(result.items);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = async () => {
    if (sending.current || !canSubmit || !connection) return;
    const when = scheduled ? new Date(`${date}T${time}`) : undefined;
    if (when && (!Number.isFinite(when.getTime()) || when.getTime() <= Date.now())) {
      toast.error(t("status.invalidDate"));
      return;
    }
    sending.current = true;
    setProgress(0);
    let confirmed = 0;
    try {
      await publishStatusBatch(
        connection.id,
        pending,
        (fraction) => setProgress(Math.round(fraction * 100)),
        (photoId) => {
          confirmed += 1;
          setItems((current) => current.filter((item) => item.id !== photoId));
        },
        when?.toISOString(),
      );
      toast.success(t(scheduled ? "status.agenda.added" : "status.success", { count: confirmed }));
    } catch (error) {
      const code = error instanceof StatusPublishError ? error.code : null;
      if (
        error instanceof StatusPublishError &&
        (code === "ERR_STATUS_UNCONFIRMED" || code === "ERR_STATUS_SCHEDULE_UNCONFIRMED")
      ) {
        setItems((current) =>
          current.map((item) =>
            item.id === error.photoId
              ? { ...item, unconfirmed: scheduled ? "schedule" : "send" }
              : item,
          ),
        );
      }
      toast.error(t(errorLabel(code)), {
        description: confirmed
          ? t(scheduled ? "status.agenda.added" : "status.partial", { count: confirmed })
          : undefined,
      });
    } finally {
      sending.current = false;
      setProgress(null);
      if (scheduled) {
        setAgendaDay(date);
        void queryClient.invalidateQueries({
          queryKey: whatsappKeys.statusSchedules(connection.id, date),
        });
      }
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
      <header>
        <h1 className="font-display text-2xl font-semibold">{t("status.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("status.description")}</p>
      </header>

      <section className="space-y-2 rounded-xl border bg-card p-4">
        <label htmlFor="status-conn" className="text-sm font-medium">
          {t("status.connection")}
        </label>
        {connections.isPending ? (
          <p className="text-sm text-muted-foreground">{t("status.loadingConnections")}</p>
        ) : connections.isError ? (
          <button className="text-sm underline" onClick={() => void connections.refetch()}>
            {t("status.retryConnections")}
          </button>
        ) : available.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("status.noConnected")}</p>
        ) : (
          <select
            id="status-conn"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={connection?.id ?? ""}
            disabled={busy}
            onChange={(event) =>
              setWhatsappId(event.target.value ? Number(event.target.value) : "")
            }
          >
            <option value="">{t("status.selectConnection")}</option>
            {available.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.number ? ` — ${item.number}` : ""}
              </option>
            ))}
          </select>
        )}
        {connection && (
          <p className="text-sm text-muted-foreground">{t("status.automaticAudience")}</p>
        )}
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap gap-2">
          <Button
            aria-pressed={!scheduled}
            variant={!scheduled ? "default" : "outline"}
            disabled={busy}
            onClick={() => setMode("now")}
          >
            {t("status.now")}
          </Button>
          <Button
            aria-pressed={scheduled}
            variant={scheduled ? "default" : "outline"}
            disabled={busy}
            onClick={() => setMode("schedule")}
          >
            <CalendarClock className="size-4" aria-hidden /> {t("status.agenda.mode")}
          </Button>
        </div>
        {scheduled && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span>{t("status.agenda.date")}</span>
              <Input
                type="date"
                value={date}
                min={localStatusDay()}
                disabled={busy}
                onChange={(event) => setDate(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span>{t("status.agenda.time")}</span>
              <Input
                type="time"
                value={time}
                disabled={busy}
                onChange={(event) => setTime(event.target.value)}
              />
            </label>
          </div>
        )}
        {!scheduled && connection && connection.status !== "CONNECTED" && (
          <p role="status" className="text-sm text-muted-foreground">
            {t("status.disconnected")}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            {t("status.limit", { count: items.length })}
          </span>
          <div className="flex gap-2">
            {items.length > 0 && (
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => setItems([])}>
                {t("status.clear")}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={busy || items.length >= STATUS_MAX_PHOTOS}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="size-4" aria-hidden /> {t("status.add")}
            </Button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={STATUS_PHOTO_FORMATS}
            multiple
            hidden
            onChange={(event) => addFiles(event.target.files)}
          />
        </div>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("status.empty")}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <li key={item.id} className="space-y-2 rounded-lg border bg-background p-2">
                <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                  <PhotoPreview file={item.file} />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute right-1 top-1 size-7"
                    disabled={busy}
                    aria-label={t("status.remove")}
                    onClick={() =>
                      setItems((current) => current.filter(({ id }) => id !== item.id))
                    }
                  >
                    <X className="size-4" aria-hidden />
                  </Button>
                </div>
                <Input
                  aria-label={t("status.caption")}
                  placeholder={t("status.caption")}
                  value={item.caption}
                  maxLength={700}
                  disabled={busy || Boolean(item.unconfirmed)}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((photo) =>
                        photo.id === item.id ? { ...photo, caption: event.target.value } : photo,
                      ),
                    )
                  }
                />
                {item.unconfirmed && (
                  <p className="text-xs text-muted-foreground">
                    {t(
                      item.unconfirmed === "schedule"
                        ? "status.agenda.check"
                        : "status.unconfirmedHint",
                    )}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        {busy && <progress className="h-2 w-full" value={progress ?? 0} max={100} />}
        <Button className="w-full" disabled={!canSubmit} onClick={() => void submit()}>
          <Send className="size-4" aria-hidden />
          {busy
            ? t(scheduled ? "status.agenda.saving" : "status.publishing", { percent: progress })
            : t(scheduled ? "status.agenda.submit" : "status.publish")}
        </Button>
      </section>

      {connection && (
        <section className="space-y-3 rounded-xl border bg-card p-4">
          <h2 className="text-base font-semibold">{t("status.agenda.title")}</h2>
          <label className="block w-fit space-y-1 text-sm">
            <span>{t("status.agenda.chooseDay")}</span>
            <Input
              type="date"
              value={agendaDay}
              onChange={(event) => setAgendaDay(event.target.value)}
            />
          </label>
          {agendaDay &&
            (agenda.isPending ? (
              <p className="text-sm text-muted-foreground">{t("status.agenda.loading")}</p>
            ) : agenda.isError ? (
              <button className="text-sm underline" onClick={() => void agenda.refetch()}>
                {t("status.agenda.retry")}
              </button>
            ) : !agenda.data.schedules.length ? (
              <p className="text-sm text-muted-foreground">{t("status.agenda.empty")}</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {agenda.data.schedules.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-2 p-3"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium">
                        {new Date(entry.publishAt).toLocaleTimeString(i18n.language, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {entry.caption || entry.filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(`status.agenda.state.${entry.status}`)}
                        {entry.errorCode && ` · ${t(errorLabel(entry.errorCode))}`}
                      </p>
                    </div>
                    {entry.status === "scheduled" && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={cancel.isPending}
                        onClick={() =>
                          cancel.mutate({ numberId: connection.id, statusId: entry.id })
                        }
                      >
                        {t("status.agenda.cancel")}
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ))}
        </section>
      )}
    </div>
  );
}
