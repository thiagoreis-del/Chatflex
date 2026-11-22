import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CalendarClock, ImagePlus, Plus, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { whatsappKeys } from "@/shared/api/query-keys";
import { useSession } from "@/shared/auth/session-store";
import { connectionsQuery } from "../api";
import {
  isStatusConnection,
  localStatusDay,
  mergeStatusFiles,
  publishStatusBatch,
  StatusPublishError,
  STATUS_MAX_PHOTOS,
  STATUS_PHOTO_FORMATS,
  type StatusItem,
  type StatusSchedule,
} from "../status";
import { StatusDashboard } from "./StatusDashboard";

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
  const { user } = useSession();
  return <StatusWorkspace key={`${user?.companyId ?? ""}:${user?.id ?? ""}:${user?.role ?? ""}`} />;
}

function StatusWorkspace() {
  const { t } = useTranslation("whatsapp");
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
  const [composerOpen, setComposerOpen] = useState(false);
  const [items, setItems] = useState<StatusItem[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLElement>(null);
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
  const reuse = (entry: StatusSchedule, photo: Blob) => {
    if (sending.current || items.length >= STATUS_MAX_PHOTOS) return;
    setItems((current) =>
      [
        ...current,
        {
          id: crypto.randomUUID(),
          file: new File([photo], entry.filename || "status.jpg", { type: "image/jpeg" }),
          caption: entry.caption,
          sourceId: entry.id,
        },
      ].slice(0, STATUS_MAX_PHOTOS),
    );
    setComposerOpen(true);
    requestAnimationFrame(() => composerRef.current?.scrollIntoView({ block: "start" }));
  };

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
      if (items.length === pending.length) setComposerOpen(false);
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
      void queryClient.invalidateQueries({ queryKey: whatsappKeys.statusDashboard(connection.id) });
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("status.dashboard.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("status.dashboard.description")}</p>
        </div>
        <Button
          disabled={!connection || busy}
          aria-expanded={composerOpen}
          aria-controls="status-composer"
          onClick={() => setComposerOpen((open) => !open)}
        >
          <Plus className="size-4" aria-hidden />
          {t(composerOpen ? "status.dashboard.closeComposer" : "status.dashboard.new")}
        </Button>
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
            onChange={(event) => {
              setWhatsappId(event.target.value ? Number(event.target.value) : "");
              setItems((current) => current.filter((item) => !item.sourceId));
            }}
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

      <section
        id="status-composer"
        ref={composerRef}
        hidden={!composerOpen}
        className="space-y-4 rounded-xl border bg-card p-4"
      >
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
        <StatusDashboard
          key={connection.id}
          connectionId={connection.id}
          canReuse={!busy && items.length < STATUS_MAX_PHOTOS}
          onReuse={reuse}
        />
      )}
    </div>
  );
}
