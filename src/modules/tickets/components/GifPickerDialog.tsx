import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchGifs, type GifCatalogItem } from "../api";
import { cn } from "@/lib/utils";

interface GifPickerDialogProps {
  open: boolean;
  sending: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (gif: GifCatalogItem, requestId: string) => void;
}

export function GifPickerDialog({
  open,
  sending,
  onOpenChange,
  onSend,
}: GifPickerDialogProps) {
  const { t } = useTranslation("tickets");
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<GifCatalogItem | null>(null);
  const [requestId, setRequestId] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(input.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [input]);

  const gifs = useInfiniteQuery({
    queryKey: ["gif-catalog", query],
    queryFn: ({ pageParam, signal }) => searchGifs(query, pageParam, signal),
    initialPageParam: "",
    getNextPageParam: (page) => page.next || undefined,
    enabled: open,
    staleTime: 60_000,
  });
  const items = gifs.data?.pages.flatMap((page) => page.results) ?? [];
  const attribution = gifs.data?.pages[0]?.attribution ?? "Powered by Tenor";

  const handleOpenChange = (next: boolean) => {
    if (sending) return;
    if (!next) setSelected(null);
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[min(760px,calc(100dvh-2rem))] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{t("gif.title")}</DialogTitle>
          <DialogDescription>{t("gif.description")}</DialogDescription>
        </DialogHeader>

        {selected ? (
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg bg-muted p-3">
            <img
              src={selected.previewUrl}
              alt={selected.title}
              className="max-h-[52dvh] max-w-full rounded-md object-contain"
            />
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={input}
                onChange={(event) => setInput(event.target.value)}
                className="pl-9"
                placeholder={t("gif.search")}
                aria-label={t("gif.search")}
              />
            </div>
            <div className="min-h-48 flex-1 overflow-y-auto pr-1">
              {gifs.isPending ? (
                <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> {t("gif.loading")}
                </div>
              ) : gifs.isError ? (
                <div className="flex h-48 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
                  <p>{t("gif.unavailable")}</p>
                  <Button variant="outline" onClick={() => void gifs.refetch()}>
                    {t("gif.retry")}
                  </Button>
                </div>
              ) : items.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground">{t("gif.empty")}</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {items.map((gif) => (
                    <button
                      key={gif.id}
                      type="button"
                      className={cn(
                        "group relative aspect-video overflow-hidden rounded-md bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      )}
                      onClick={() => {
                        setSelected(gif);
                        setRequestId(crypto.randomUUID());
                      }}
                      aria-label={t("gif.preview", { title: gif.title })}
                    >
                      <img
                        src={gif.previewUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              )}
              {gifs.hasNextPage && (
                <Button
                  className="mt-3 w-full"
                  variant="outline"
                  disabled={gifs.isFetchingNextPage}
                  onClick={() => void gifs.fetchNextPage()}
                >
                  {gifs.isFetchingNextPage ? t("gif.loadingMore") : t("gif.loadMore")}
                </Button>
              )}
            </div>
            <p className="text-center text-xs text-muted-foreground">{attribution}</p>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" disabled={sending} onClick={() => selected ? setSelected(null) : handleOpenChange(false)}>
            {t("gif.cancel")}
          </Button>
          {selected && (
            <Button disabled={sending} onClick={() => onSend(selected, requestId)}>
              {sending && <Loader2 className="size-4 animate-spin" />}
              {t(sending ? "gif.sending" : "gif.send")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
