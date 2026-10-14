import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Message } from "../types";

export function isImage(m: Pick<Message, "mediaType" | "mediaUrl">) {
  return m.mediaType === "image" || /\.(png|jpe?g|gif|webp)(\?|$)/i.test(m.mediaUrl ?? "");
}

export function fileNameFromUrl(url: string) {
  try {
    return decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "") || url;
  } catch {
    return url;
  }
}

export function MessageMedia({ message }: { message: Message }) {
  const { t } = useTranslation("tickets");
  const [open, setOpen] = useState(false);
  const url = message.mediaUrl;
  if (!url) return null;

  if (isImage(message)) {
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-3xl p-2">
            <DialogTitle className="sr-only">{message.body || t("media.image")}</DialogTitle>
            <img
              src={url}
              alt={message.body || t("media.image")}
              className="max-h-[80vh] w-full rounded object-contain"
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const name = message.body || fileNameFromUrl(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      download
      className={cn(
        "mb-1 flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
        message.fromMe
          ? "border-primary-foreground/30 hover:bg-primary-foreground/10"
          : "bg-muted/50 hover:bg-muted",
      )}
      aria-label={t("media.download")}
    >
      <FileText className="size-6 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
      <Download className="size-4 shrink-0" aria-hidden />
    </a>
  );
}
