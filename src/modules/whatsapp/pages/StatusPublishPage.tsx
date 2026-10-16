import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ImagePlus, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { connectionsQuery } from "../api";
import { mergeStatusFiles, publishStatusBatch, STATUS_MAX_PHOTOS, type StatusItem } from "../status";

export function StatusPublishPage() {
  const { t } = useTranslation("whatsapp");
  const { data: connections = [] } = useQuery(connectionsQuery());
  const connected = useMemo(() => connections.filter((c) => c.status === "CONNECTED"), [connections]);
  const [whatsappId, setWhatsappId] = useState<number | "">("");
  const [items, setItems] = useState<StatusItem[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const previews = useMemo(() => items.map((it) => URL.createObjectURL(it.file)), [items]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  useEffect(() => {
    if (whatsappId === "" && connected.length === 1 && connected[0]) setWhatsappId(connected[0].id);
  }, [connected, whatsappId]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const r = mergeStatusFiles(items, Array.from(files));
    if (r.rejectedNonImage) toast.warning(t("status.onlyImages"));
    if (r.overflow) toast.warning(t("status.tooMany"));
    setItems(r.items);
    if (inputRef.current) inputRef.current.value = "";
  };

  const publish = async () => {
    if (whatsappId === "" || !items.length) return;
    setProgress(0);
    try {
      await publishStatusBatch(whatsappId, items, (f) => setProgress(Math.round(f * 100)));
      toast.success(t("status.success"));
      setItems([]);
    } catch {
      toast.error(t("status.error"));
    } finally {
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
        <label htmlFor="status-conn" className="text-sm font-medium">{t("status.connection")}</label>
        {connected.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("status.noConnected")}</p>
        ) : (
          <select
            id="status-conn"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={whatsappId}
            disabled={busy}
            onChange={(e) => setWhatsappId(e.target.value ? Number(e.target.value) : "")}
          >
            <option value="">{t("status.selectConnection")}</option>
            {connected.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}{c.number ? ` — ${c.number}` : ""}
              </option>
            ))}
          </select>
        )}
      </section>

      <section className="space-y-4 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">{t("status.limit", { count: items.length })}</span>
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
            accept="image/*"
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
              <li key={previews[i]} className="space-y-2 rounded-lg border bg-background p-2">
                <div className="relative aspect-square overflow-hidden rounded-md bg-muted">
                  <img src={previews[i]} alt={it.file.name} className="size-full object-cover" />
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
                  disabled={busy}
                  onChange={(e) =>
                    setItems(items.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))
                  }
                />
              </li>
            ))}
          </ul>
        )}

        {busy && (
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}

        <Button className="w-full" disabled={busy || whatsappId === "" || !items.length} onClick={publish}>
          <Send className="size-4" aria-hidden />
          {busy ? t("status.publishing", { percent: progress }) : t("status.publish")}
        </Button>
      </section>
    </div>
  );
}
