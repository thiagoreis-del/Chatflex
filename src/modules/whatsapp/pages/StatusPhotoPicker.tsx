import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ImagePlus, Search, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  statusDashboardQuery,
  statusPhotoQuery,
  type SavedStatusPhoto,
  type StatusSchedule,
} from "../status";
import { StatusImage } from "./StatusImage";

interface PickerProps {
  connectionId: number | undefined;
  disabled: boolean;
  remaining: number;
  draftSourceIds: ReadonlySet<string>;
  onDevice: () => void;
  onAdd: (photos: SavedStatusPhoto[]) => void;
}

export function StatusPhotoPicker({
  connectionId,
  disabled,
  remaining,
  draftSourceIds,
  onDevice,
  onAdd,
}: PickerProps) {
  const { t } = useTranslation("whatsapp");
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={disabled || !remaining}>
          <ImagePlus className="size-4" aria-hidden /> {t("status.add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("status.add")}</DialogTitle>
          <DialogDescription>{t("status.picker.description")}</DialogDescription>
        </DialogHeader>
        <Button
          type="button"
          variant="outline"
          className="justify-self-start"
          onClick={() => {
            setOpen(false);
            onDevice();
          }}
        >
          <Upload className="size-4" aria-hidden /> {t("status.picker.device")}
        </Button>
        {open && connectionId && (
          <PublishedPhotos
            connectionId={connectionId}
            remaining={remaining}
            draftSourceIds={draftSourceIds}
            onAdd={(photos) => {
              onAdd(photos);
              setOpen(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PublishedPhotos({
  connectionId,
  remaining,
  draftSourceIds,
  onAdd,
}: Pick<PickerProps, "remaining" | "draftSourceIds" | "onAdd"> & { connectionId: number }) {
  const { t } = useTranslation("whatsapp");
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<SavedStatusPhoto[]>([]);
  const query = useQuery(statusDashboardQuery(connectionId, "published", page, "", search));
  const entries = query.data?.entries ?? [];
  const hasNextPage = Boolean(query.data && page * query.data.pageSize < query.data.total);

  return (
    <>
      <section className="space-y-3 border-t pt-4" aria-labelledby="published-status-photos">
        <h3 id="published-status-photos" className="text-sm font-semibold">
          {t("status.picker.published")}
        </h3>
        <form
          role="search"
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setSearch(input.trim());
            setPage(1);
          }}
        >
          <Input
            type="search"
            aria-label={t("status.picker.search")}
            placeholder={t("status.picker.placeholder")}
            maxLength={120}
            value={input}
            onChange={(event) => {
              const value = event.target.value;
              setInput(value);
              if (!value) {
                setSearch("");
                setPage(1);
              }
            }}
          />
          <Button type="submit" variant="outline">
            <Search className="size-4" aria-hidden /> {t("status.picker.searchButton")}
          </Button>
        </form>
        {query.isPending ? (
          <p role="status" className="text-sm text-muted-foreground">
            {t("status.dashboard.loading")}
          </p>
        ) : query.isError ? (
          <Button type="button" variant="outline" onClick={() => void query.refetch()}>
            {t("status.dashboard.retry")}
          </Button>
        ) : entries.length === 0 ? (
          <p
            role="status"
            className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground"
          >
            {t(search ? "status.picker.noMatches" : "status.picker.empty")}
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {entries.map((entry) => (
              <li key={entry.id} className="min-w-0">
                <PublishedPhoto
                  connectionId={connectionId}
                  entry={entry}
                  selected={selected.some(({ entry: item }) => item.id === entry.id)}
                  full={selected.length >= remaining}
                  alreadyInDraft={draftSourceIds.has(entry.id)}
                  onToggle={(photo) => {
                    setSelected((current) => {
                      if (current.some(({ entry: item }) => item.id === entry.id)) {
                        return current.filter(({ entry: item }) => item.id !== entry.id);
                      }
                      return current.length < remaining ? [...current, { entry, photo }] : current;
                    });
                  }}
                />
              </li>
            ))}
          </ul>
        )}
        {(page > 1 || hasNextPage) && (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              {t("status.dashboard.previous")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={!hasNextPage}
              onClick={() => setPage(page + 1)}
            >
              {t("status.dashboard.next")}
            </Button>
          </div>
        )}
      </section>
      <DialogFooter>
        <Button type="button" disabled={selected.length === 0} onClick={() => onAdd(selected)}>
          {selected.length
            ? t("status.picker.addCount", { count: selected.length })
            : t("status.picker.addToDraft")}
        </Button>
      </DialogFooter>
    </>
  );
}

function PublishedPhoto({
  connectionId,
  entry,
  selected,
  full,
  alreadyInDraft,
  onToggle,
}: {
  connectionId: number;
  entry: StatusSchedule;
  selected: boolean;
  full: boolean;
  alreadyInDraft: boolean;
  onToggle: (photo: Blob) => void;
}) {
  const { t, i18n } = useTranslation("whatsapp");
  const { data: photo, isFetching } = useQuery(statusPhotoQuery(connectionId, entry));
  const title = entry.caption || entry.filename || t("status.dashboard.photo");

  return (
    <button
      type="button"
      aria-pressed={selected || alreadyInDraft}
      disabled={alreadyInDraft || !photo || (full && !selected)}
      className="relative w-full overflow-hidden rounded-lg border bg-card text-left hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary aria-pressed:ring-1 aria-pressed:ring-primary enabled:cursor-pointer"
      onClick={() => photo && onToggle(photo)}
    >
      <span className="grid aspect-video place-items-center bg-muted px-1 text-center text-xs text-muted-foreground">
        {photo ? (
          <StatusImage photo={photo} title="" className="size-full object-contain" />
        ) : (
          t(isFetching ? "status.dashboard.loadingPhoto" : "status.dashboard.photoError")
        )}
      </span>
      {(selected || alreadyInDraft) && (
        <Check
          className="absolute right-1 top-1 size-5 rounded-full bg-primary p-0.5 text-primary-foreground"
          aria-hidden
        />
      )}
      <span className="block space-y-0.5 p-2">
        <span className="block truncate text-sm font-medium">{title}</span>
        {alreadyInDraft ? (
          <span className="text-xs text-muted-foreground">{t("status.picker.inDraft")}</span>
        ) : (
          entry.publishedAt && (
            <time dateTime={entry.publishedAt} className="text-xs text-muted-foreground">
              {new Date(entry.publishedAt).toLocaleString(i18n.language, {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </time>
          )
        )}
      </span>
    </button>
  );
}
