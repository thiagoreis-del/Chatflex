import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Message } from "../types";
import { isAudioMedia } from "../audio-format";

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

/**
 * Baixa o arquivo como Blob e salva com o nome real.
 * O atributo `download` é ignorado em URLs de outra origem (API),
 * então o clique abriria o PDF numa aba em vez de baixar.
 */
export async function downloadFile(url: string, filename: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(String(res.status));
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
  } catch {
    // Sem acesso ao conteúdo (ex.: CORS): abre em nova aba como antes.
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function MessageMedia({ message }: { message: Message }) {
  const { t } = useTranslation("tickets");
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
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
      <audio
        controls
        preload="metadata"
        src={url}
        aria-label={t("media.audio")}
        className="max-w-full"
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
      onClick={() => void downloadFile(url, name)}
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
      <Download className="size-4 shrink-0" aria-hidden />
    </button>
  );
}
