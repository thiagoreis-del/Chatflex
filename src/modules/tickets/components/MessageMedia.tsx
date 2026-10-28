import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Download, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Message } from "../types";
import { isAudioMedia } from "../audio-format";
import { isDownloaded, markDownloaded } from "../downloaded-media";
import { downloadFile, fileNameFromUrl } from "../media-file";
import { VoiceNotePlayer } from "./VoiceNotePlayer";

export function isImage(m: Pick<Message, "mediaType" | "mediaUrl">) {
  return m.mediaType === "image" || /\.(png|jpe?g|gif|webp)(\?|$)/i.test(m.mediaUrl ?? "");
}


export function MessageMedia({ message }: { message: Message }) {
  const { t } = useTranslation("tickets");
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [downloaded, setDownloaded] = useState(() => isDownloaded(message.mediaUrl ?? ""));
  const url = message.mediaUrl;
  if (!url) return null;

  if (isImage(message)) {
    const download = () =>
      void downloadFile(url, fileNameFromUrl(url)).then(() => {
        markDownloaded(url);
        setDownloaded(true);
      });
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mb-1 block max-w-full overflow-hidden rounded-lg"
          aria-label={t("media.open")}
        >
          <img
            src={url}
            alt={message.body || t("media.image")}
            loading="lazy"
            className="max-h-64 w-full max-w-xs object-contain"
          />
        </button>
        <div className="mb-1 flex items-center gap-1">
          {downloaded ? (
            <span
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-400"
              title={t("media.imageSaved")}
            >
              <Check className="size-3.5" strokeWidth={3} aria-hidden />
              {t("media.imageSaved")}
            </span>
          ) : (
            <button
              type="button"
              onClick={download}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label={t("media.downloadImage")}
            >
              <Download className="size-3.5" aria-hidden />
              {t("media.downloadImage")}
            </button>
          )}
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl p-2">
            <DialogTitle className="sr-only">{message.body || t("media.image")}</DialogTitle>
            <img
              src={url}
              alt={message.body || t("media.image")}
              className="max-h-[75vh] w-full rounded object-contain"
            />
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={download}
                className="flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                aria-label={t("media.downloadImage")}
              >
                <Download className="size-4" aria-hidden />
                {t("media.downloadImage")}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (isAudioMedia(message.mediaType, url)) {
    if (failed) {
      return (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          download
          className="mb-1 block text-sm underline"
        >
          {t("media.audioError")}
        </a>
      );
    }
    return (
      <VoiceNotePlayer
        url={url}
        fromMe={message.fromMe}
        sender={message.fromMe ? (message.ticket?.user ?? null) : null}
        onError={() => setFailed(true)}
      />
    );
  }
  if (message.mediaType === "video") {
    return (
      <video
        controls
        preload="metadata"
        src={url}
        aria-label={t("media.video")}
        className="max-h-64 max-w-full rounded-lg"
      />
    );
  }

  // Sempre o nome real do arquivo; a legenda (body) é exibida à parte na bolha.
  const name = fileNameFromUrl(url);
  return (
    <button
      type="button"
      onClick={() =>
        void downloadFile(url, name).then(() => {
          markDownloaded(url);
          setDownloaded(true);
        })
      }
      className={cn(
        "mb-1 flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
        message.fromMe
          ? "border-primary-foreground/30 hover:bg-primary-foreground/10"
          : "bg-muted/50 hover:bg-muted",
      )}
      aria-label={t("media.download")}
    >
      <FileText className="size-6 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
      {downloaded ? (
        <span
          className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
          title={t("media.downloaded")}
          aria-label={t("media.downloaded")}
        >
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
        </span>
      ) : (
        <Download className="size-4 shrink-0" aria-hidden />
      )}
    </button>
  );
}
