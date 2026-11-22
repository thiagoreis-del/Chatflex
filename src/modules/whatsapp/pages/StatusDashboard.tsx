import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CircleDot,
  History,
  Images,
  ImageOff,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { ApiError } from "@/shared/api/errors";
import { whatsappKeys } from "@/shared/api/query-keys";
import {
  cancelStatusSchedule,
  removePublishedStatus,
  statusDashboardQuery,
  statusPhotoQuery,
  type StatusDashboardView,
  type StatusSchedule,
} from "../status";
import { StatusImage } from "./StatusImage";

const views = [
  { key: "online", icon: CircleDot },
  { key: "scheduled", icon: CalendarClock },
  { key: "library", icon: Images },
  { key: "history", icon: History },
] as const;

type ReusePhoto = (entry: StatusSchedule, photo: Blob) => void;

function StatusCard({
  connectionId,
  entry,
  canReuse,
  pending,
  onReuse,
  onRemove,
  onCancel,
}: {
  connectionId: number;
  entry: StatusSchedule;
  canReuse: boolean;
  pending: boolean;
  onReuse: ReusePhoto;
  onRemove: (entry: StatusSchedule) => void;
  onCancel: (entry: StatusSchedule) => void;
}) {
  const { t, i18n } = useTranslation("whatsapp");
  const { data: photo, isFetching, isError } = useQuery(statusPhotoQuery(connectionId, entry));
  const [previewOpen, setPreviewOpen] = useState(false);
  const title = entry.caption || entry.filename || t("status.dashboard.photo");
  const timestamp = entry.publishedAt ?? entry.publishAt;
  const timeFormat = { dateStyle: "short", timeStyle: "short" } as const;
  const expires = entry.expiresAt ? new Date(entry.expiresAt) : null;
  const onAir = entry.status === "published" && expires !== null && expires.getTime() > Date.now();
  const statusLabel =
    entry.status === "published" && !onAir
      ? t("status.dashboard.expired")
      : t(`status.agenda.state.${entry.status}`);

  return (
    <li className="flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card">
      {photo ? (
        <button
          type="button"
          aria-label={t("status.dashboard.viewPhoto", { name: title })}
          className="grid aspect-video w-full place-items-center overflow-hidden bg-muted focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => setPreviewOpen(true)}
        >
          <StatusImage photo={photo} title={title} className="size-full object-cover" />
        </button>
      ) : (
        <div className="grid aspect-video place-items-center bg-muted px-3 text-center text-xs text-muted-foreground">
          {isFetching ? (
            t("status.dashboard.loadingPhoto")
          ) : (
            <div className="grid justify-items-center gap-1">
              <ImageOff className="size-5" aria-hidden />
              {isError ? t("status.dashboard.photoError") : t("status.dashboard.noPhoto")}
            </div>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <time dateTime={timestamp} className="text-xs tabular-nums text-muted-foreground">
            {new Date(timestamp).toLocaleString(i18n.language, timeFormat)}
          </time>
          <span
            className={
              onAir
                ? "rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300"
                : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            }
          >
            {statusLabel}
          </span>
        </div>
        <p className="line-clamp-2 break-words text-sm font-medium" title={title}>
          {title}
        </p>
        {expires && onAir && (
          <p className="text-xs text-muted-foreground">
            {t("status.dashboard.expires", {
              time: expires.toLocaleString(i18n.language, timeFormat),
            })}
          </p>
        )}
        {entry.errorCode && (
          <p className="text-xs text-muted-foreground">
            {t(`status.dashboard.errors.${entry.errorCode}`, {
              defaultValue: t("status.dashboard.entryError"),
            })}
          </p>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {entry.hasPhoto && (
            <Button
              size="sm"
              variant="outline"
              disabled={!canReuse || !photo}
              onClick={() => photo && onReuse(entry, photo)}
            >
              <RotateCcw className="size-3.5" aria-hidden />
              {t("status.dashboard.reuse")}
            </Button>
          )}
          {entry.status === "scheduled" && (
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => onCancel(entry)}>
              {t("status.agenda.cancel")}
            </Button>
          )}
          {entry.canRemove && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              disabled={pending}
              onClick={() => onRemove(entry)}
            >
              <Trash2 className="size-3.5" aria-hidden />
              {t("status.dashboard.delete")}
            </Button>
          )}
        </div>
      </div>
      {photo && previewOpen && (
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="break-words pr-5">{title}</DialogTitle>
            </DialogHeader>
            <StatusImage
              photo={photo}
              title={title}
              className="mx-auto max-h-[72dvh] w-auto max-w-full object-contain"
            />
          </DialogContent>
        </Dialog>
      )}
    </li>
  );
}

export function StatusDashboard({
  connectionId,
  canReuse,
  onReuse,
}: {
  connectionId: number;
  canReuse: boolean;
  onReuse: ReusePhoto;
}) {
  const { t } = useTranslation("whatsapp");
  const queryClient = useQueryClient();
  const [view, setView] = useState<StatusDashboardView>("online");
  const [page, setPage] = useState(1);
  const [day, setDay] = useState("");
  const [confirmation, setConfirmation] = useState<{
    entry: StatusSchedule;
    kind: "cancel" | "delete";
  }>();
  const query = useQuery(statusDashboardQuery(connectionId, view, page, day));
  const mutation = useMutation({
    mutationFn: ({ entry, kind }: NonNullable<typeof confirmation>) =>
      kind === "delete"
        ? removePublishedStatus(connectionId, entry.id)
        : cancelStatusSchedule(connectionId, entry.id),
    onSuccess: (_, { kind }) =>
      toast.success(
        t(kind === "delete" ? "status.dashboard.deleted" : "status.dashboard.cancelled"),
      ),
    onError: (error) => {
      const body =
        error instanceof ApiError ? (error.body as { error?: string } | undefined) : undefined;
      toast.error(
        t(`status.dashboard.errors.${body?.error ?? ""}`, {
          defaultValue: t("status.dashboard.actionError"),
        }),
      );
    },
    onSettled: () =>
      void queryClient.invalidateQueries({ queryKey: whatsappKeys.statusDashboard(connectionId) }),
  });

  return (
    <section className="space-y-4" aria-label={t("status.dashboard.title")}>
      <div className="flex flex-wrap gap-2 border-b pb-3" aria-label={t("status.dashboard.title")}>
        {views.map(({ key, icon: Icon }) => (
          <Button
            key={key}
            size="sm"
            type="button"
            variant={key === view ? "default" : "outline"}
            aria-pressed={key === view}
            onClick={() => {
              setView(key);
              setPage(1);
            }}
          >
            <Icon className="size-4" aria-hidden />
            {t(`status.dashboard.view.${key}`)}
            {key !== "history" && query.data && (
              <span className="rounded-full bg-background/20 px-1.5 text-xs tabular-nums">
                {query.data.counts[key]}
              </span>
            )}
          </Button>
        ))}
      </div>

      {view === "scheduled" && (
        <label className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {t("status.dashboard.filterDay")}
          <Input
            type="date"
            className="w-44"
            value={day}
            onChange={(event) => {
              setDay(event.target.value);
              setPage(1);
            }}
          />
          {day && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDay("");
                setPage(1);
              }}
            >
              {t("status.dashboard.allDays")}
            </Button>
          )}
        </label>
      )}

      {query.isPending ? (
        <p role="status" className="py-6 text-sm text-muted-foreground">
          {t("status.dashboard.loading")}
        </p>
      ) : query.isError ? (
        <Button variant="outline" onClick={() => void query.refetch()}>
          {t("status.dashboard.retry")}
        </Button>
      ) : query.data.entries.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          {t(`status.dashboard.empty.${view}`)}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {query.data.entries.map((entry) => (
            <StatusCard
              key={entry.id}
              connectionId={connectionId}
              entry={entry}
              canReuse={canReuse}
              pending={mutation.isPending}
              onReuse={onReuse}
              onRemove={(target) => setConfirmation({ entry: target, kind: "delete" })}
              onCancel={(target) => setConfirmation({ entry: target, kind: "cancel" })}
            />
          ))}
        </ul>
      )}
      {(page > 1 || (query.data && page * query.data.pageSize < query.data.total)) && (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((current) => current - 1)}
          >
            {t("status.dashboard.previous")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!query.data || page * query.data.pageSize >= query.data.total}
            onClick={() => setPage((current) => current + 1)}
          >
            {t("status.dashboard.next")}
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(confirmation)}
        onOpenChange={(open) => {
          if (!open) setConfirmation(undefined);
        }}
        title={t(
          confirmation?.kind === "cancel"
            ? "status.dashboard.confirmCancel"
            : "status.dashboard.confirmDelete",
        )}
        description={t("status.dashboard.photoKept")}
        confirmLabel={t(
          confirmation?.kind === "cancel" ? "status.agenda.cancel" : "status.dashboard.delete",
        )}
        onConfirm={() => {
          if (confirmation && !mutation.isPending) mutation.mutate(confirmation);
        }}
      />
    </section>
  );
}
