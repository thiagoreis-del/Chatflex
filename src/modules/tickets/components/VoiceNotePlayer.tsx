import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  WAVEFORM_BARS,
  downsamplePeaks,
  fallbackWaveform,
  formatAudioTime,
} from "../waveform";

/** Decodifica o áudio e extrai as amplitudes; falha silenciosa → forma de reserva. */
async function extractPeaks(url: string): Promise<number[] | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const ctx = new AudioContext();
    try {
      const decoded = await ctx.decodeAudioData(buffer);
      return downsamplePeaks(decoded.getChannelData(0), WAVEFORM_BARS);
    } finally {
      void ctx.close();
    }
  } catch {
    return null;
  }
}

/**
 * Player de mensagem de voz no estilo WhatsApp: botão play/pause,
 * barras da forma de onda com progresso e duração.
 */
export function VoiceNotePlayer({
  url,
  fromMe,
  onError,
}: {
  url: string;
  fromMe?: boolean;
  onError: () => void;
}) {
  const { t } = useTranslation("tickets");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [bars, setBars] = useState<number[]>(() => fallbackWaveform(url, WAVEFORM_BARS));
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void extractPeaks(url).then((peaks) => {
      if (!cancelled && peaks && peaks.some((p) => p > 0)) setBars(peaks);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      void audio.play().catch(() => onError());
    }
  };

  const progress = duration > 0 ? currentTime / duration : 0;
  const activeBars = Math.round(progress * bars.length);

  return (
    <div
      className={cn(
        "mb-1 flex w-64 max-w-full items-center gap-2 rounded-2xl px-3 py-2",
        fromMe ? "bg-primary-foreground/10" : "bg-muted/50",
      )}
    >
      <audio
        ref={audioRef}
        preload="metadata"
        src={url}
        aria-label={t("media.audio")}
        className="hidden"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onError={onError}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? t("media.pause") : t("media.play")}
        className="flex size-8 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80"
      >
        {playing ? (
          <Pause className="size-5 fill-current" aria-hidden />
        ) : (
          <Play className="size-5 fill-current" aria-hidden />
        )}
      </button>
      <div className="flex h-8 min-w-0 flex-1 items-center gap-[2px]" aria-hidden>
        {bars.map((v, i) => (
          <span
            key={i}
            className={cn(
              "w-[3px] shrink-0 rounded-full transition-colors",
              i < activeBars ? "bg-current" : "bg-current opacity-35",
            )}
            style={{ height: `${Math.max(3, v * 28)}px` }}
          />
        ))}
      </div>
      <span className="shrink-0 text-xs tabular-nums opacity-80">
        {formatAudioTime(playing || currentTime > 0 ? currentTime : duration)}
      </span>
    </div>
  );
}
