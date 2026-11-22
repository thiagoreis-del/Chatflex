import { useDeferredValue, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ImagePlus, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { contactsQuery } from "@/modules/contacts/api";
import type { Contact } from "@/modules/contacts/types";
import { connectionsQuery } from "../api";
import {
  isStatusConnection,
  mergeStatusFiles,
  publishStatusBatch,
  StatusPublishError,
  STATUS_MAX_CONTACTS,
  STATUS_MAX_PHOTOS,
  STATUS_PHOTO_FORMATS,
  type StatusItem,
} from "../status";

const statusErrors = {
  ERR_STATUS_AUDIENCE: "status.invalidAudience",
  ERR_STATUS_PHOTO_FORMAT: "status.onlyImages",
  ERR_STATUS_PHOTO_SIZE: "status.sizeLimit",
  ERR_STATUS_DISCONNECTED: "status.disconnected",
  ERR_STATUS_UNSUPPORTED_CONNECTION: "status.unsupportedConnection",
  ERR_STATUS_BUSY: "status.connectionBusy",
  ERR_STATUS_REJECTED: "status.rejected",
  ERR_STATUS_UNCONFIRMED: "status.unconfirmed",
} as const;

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
  const { t } = useTranslation("whatsapp");
  const connections = useQuery(connectionsQuery());
  const connected = (connections.data ?? []).filter(isStatusConnection);
  const [whatsappId, setWhatsappId] = useState<number | "">("");
  const connection =
    connected.find((item) => item.id === whatsappId) ??
    (connected.length === 1 ? connected[0] : undefined);
  const [audience, setAudience] = useState<Contact[]>([]);
  const [search, setSearch] = useState({ text: "", page: 1 });
  const deferredSearch = useDeferredValue(search);
  const people = useQuery({
    ...contactsQuery({ search: deferredSearch.text.trim(), page: deferredSearch.page }),
    enabled: !!connection && deferredSearch.text.trim().length >= 2,
  });
  const matches = (people.data?.data ?? []).filter(
    (person) =>
      !person.isGroup &&
      person.active !== false &&
      person.channel === "whatsapp" &&
      /^\d{8,15}$/.test(person.number),
  );
  const moreContacts =
    people.data &&
    (people.data.hasMore ?? deferredSearch.page * people.data.pageSize < people.data.total);
  const [items, setItems] = useState<StatusItem[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sending = useRef(false);
  const pendingItems = items.filter((item) => !item.unconfirmed);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const r = mergeStatusFiles(items, Array.from(files));
    if (r.rejectedNonImage) toast.warning(t("status.onlyImages"));
    if (r.rejectedSize) toast.warning(t("status.sizeLimit"));
    if (r.overflow) toast.warning(t("status.tooMany"));
    setItems(r.items);
    if (inputRef.current) inputRef.current.value = "";
  };

  const publish = async () => {
    if (sending.current || !connection || !audience.length || !pendingItems.length) return;
    sending.current = true;
    setProgress(0);
    let confirmed = 0;
    try {
      await publishStatusBatch(
        connection.id,
        audience.map((person) => person.id),
        pendingItems,
        (fraction) => setProgress(Math.round(fraction * 100)),
        (photoId) => {
          confirmed += 1;
          setItems((current) => current.filter((item) => item.id !== photoId));
        },
      );
      toast.success(t("status.success", { count: confirmed }));
    } catch (error) {
      const code = error instanceof StatusPublishError ? error.code : "";
      const unconfirmed = code === "ERR_STATUS_UNCONFIRMED";
      if (unconfirmed && error instanceof StatusPublishError) {
        setItems((current) =>
          current.map((item) =>
            item.id === error.photoId ? { ...item, unconfirmed: true } : item,
          ),
        );
      }
      toast.error(t(statusErrors[code as keyof typeof statusErrors] ?? "status.error"), {
        description: confirmed ? t("status.partial", { count: confirmed }) : undefined,
      });
    } finally {
      sending.current = false;
      setProgress(null);
    }
  };

  const busy = progress !== null;

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
        ) : connected.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("status.noConnected")}</p>
        ) : (
          <select
            id="status-conn"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={connection?.id ?? ""}
            disabled={busy}
            onChange={(e) => {
              setWhatsappId(e.target.value ? Number(e.target.value) : "");
              setAudience([]);
            }}
          >
            <option value="">{t("status.selectConnection")}</option>
            {connected.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.number ? ` — ${c.number}` : ""}
              </option>
            ))}
          </select>
        )}
      </section>

      {connection && (
        <section className="space-y-3 rounded-xl border bg-card p-4">
          <label htmlFor="status-audience" className="text-sm font-medium">
            {t("status.audience")}
          </label>
          <p className="text-sm text-muted-foreground">{t("status.audienceHelp")}</p>
          <Input
            id="status-audience"
            placeholder={t("status.searchContacts")}
            value={search.text}
            disabled={busy}
            onChange={(event) => setSearch({ text: event.target.value, page: 1 })}
          />
          {audience.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {audience.map((person) => (
                <li key={person.id}>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    aria-label={t("status.removeContact", { name: person.name })}
                    onClick={() =>
                      setAudience((current) => current.filter(({ id }) => id !== person.id))
                    }
                  >
                    {person.name || person.number} <X className="size-3" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {search.text.trim().length >= 2 && (
            <>
              {people.isFetching ? (
                <p className="text-sm text-muted-foreground">{t("status.searchingContacts")}</p>
              ) : people.isError ? (
                <button className="text-sm underline" onClick={() => void people.refetch()}>
                  {t("status.retryContacts")}
                </button>
              ) : matches.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("status.noContacts")}</p>
              ) : (
                <ul className="max-h-52 overflow-auto rounded-lg border">
                  {matches.map((person) => (
                    <li key={person.id} className="border-b last:border-b-0">
                      <Button
                        variant="ghost"
                        className="w-full justify-between rounded-none"
                        disabled={
                          busy ||
                          audience.length >= STATUS_MAX_CONTACTS ||
                          audience.some((selected) => selected.id === person.id)
                        }
                        onClick={() => setAudience((current) => [...current, person])}
                      >
                        <span className="truncate">{person.name || person.number}</span>
                        <span className="text-muted-foreground">+{person.number}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {(search.page > 1 || moreContacts) && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy || people.isFetching || search.page < 2}
                    onClick={() => setSearch((current) => ({ ...current, page: current.page - 1 }))}
                  >
                    {t("status.previousContacts")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy || people.isFetching || !moreContacts}
                    onClick={() => setSearch((current) => ({ ...current, page: current.page + 1 }))}
                  >
                    {t("status.nextContacts")}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      <section className="space-y-4 rounded-xl border bg-card p-4">
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
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("status.empty")}</p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((it, i) => (
              <li key={it.id} className="space-y-2 rounded-lg border bg-background p-2">
                <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                  <PhotoPreview file={it.file} />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute right-1 top-1 size-7"
                    disabled={busy}
                    aria-label={t("status.remove")}
                    onClick={() => setItems(items.filter((_, j) => j !== i))}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
                <Input
                  placeholder={t("status.caption")}
                  value={it.caption}
                  maxLength={700}
                  disabled={busy || it.unconfirmed}
                  onChange={(e) =>
                    setItems(items.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))
                  }
                />
                {it.unconfirmed && (
                  <p className="text-xs text-muted-foreground">{t("status.unconfirmedHint")}</p>
                )}
              </li>
            ))}
          </ul>
        )}

        {busy && (
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        <Button
          className="w-full"
          disabled={busy || !connection || !audience.length || !pendingItems.length}
          onClick={publish}
        >
          <Send className="size-4" aria-hidden />
          {busy ? t("status.publishing", { percent: progress }) : t("status.publish")}
        </Button>
      </section>
    </div>
  );
}
