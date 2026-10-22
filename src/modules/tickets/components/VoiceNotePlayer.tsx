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

type Decoded = { channels: Float32Array[]; sampleRate: number };

function audioContextCtor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ??
    null
  );
}

/**
 * Decodifica o áudio. Usa o decodificador do navegador e, se ele não
 * suportar OGG/Opus (iPhone/Safari), um decodificador próprio.
 */
async function decodeAudio(url: string): Promise<Decoded | null> {
  let bytes: ArrayBuffer;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    bytes = await res.arrayBuffer();
  } catch {
    return null;
  }
  const Ctor = audioContextCtor();
  if (Ctor) {
    const ctx = new Ctor();
    try {
      const decoded = await new Promise<AudioBuffer>((resolve, reject) => {
        const p = ctx.decodeAudioData(bytes.slice(0), resolve, reject);
        if (p && typeof p.then === "function") p.then(resolve, reject);
      });
      const channels = Array.from({ length: decoded.numberOfChannels }, (_, i) =>
        decoded.getChannelData(i),
      );
      return { channels, sampleRate: decoded.sampleRate };
    } catch {
      // segue para o decodificador próprio
    } finally {
      void ctx.close?.();
    }
  }
  try {
    const { OggOpusDecoder } = await import("ogg-opus-decoder");
    const decoder = new OggOpusDecoder();
    await decoder.ready;
    const out = await decoder.decodeFile(new Uint8Array(bytes));
    decoder.free();
    if (!out.channelData.length || !out.samplesDecoded) return null;
    return { channels: out.channelData, sampleRate: out.sampleRate };
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
  // Quando o <audio> não toca o formato (Safari/iOS), toca pelo Web Audio.
  const [nativeFailed, setNativeFailed] = useState(false);
  const decodedRef = useRef<Promise<Decoded | null> | null>(null);
  const webRef = useRef<{ ctx: AudioContext; src: AudioBufferSourceNode; raf: number } | null>(
    null,
  );

  const getDecoded = () => {
    if (!decodedRef.current) decodedRef.current = decodeAudio(url);
    return decodedRef.current;
  };

  useEffect(() => {
    let cancelled = false;
    decodedRef.current = null;
    void getDecoded().then((d) => {
      if (cancelled || !d) return;
      const peaks = downsamplePeaks(d.channels[0], WAVEFORM_BARS);
      if (peaks.some((p) => p > 0)) setBars(peaks);
      const secs = d.channels[0].length / d.sampleRate;
      setDuration((cur) => (Number.isFinite(cur) && cur > 0 ? cur : secs));
    });
    return () => {
      cancelled = true;
      stopWeb();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const stopWeb = () => {
    const w = webRef.current;
    if (!w) return;
    webRef.current = null;
    cancelAnimationFrame(w.raf);
    try {
      w.src.onended = null;
      w.src.stop();
    } catch {
      // já parado
    }
    void w.ctx.close?.();
  };

  const playWeb = async () => {
    const Ctor = audioContextCtor();
    if (!Ctor) return onError();
    // Cria o contexto dentro do toque do usuário (exigência do iOS).
    const ctx = new Ctor();
    void ctx.resume?.();
    const d = await getDecoded();
    if (!d) {
      void ctx.close?.();
      return onError();
    }
    const buffer = ctx.createBuffer(d.channels.length, d.channels[0].length, d.sampleRate);
    d.channels.forEach((ch, i) => buffer.getChannelData(i).set(ch));
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    const offset = currentTime < buffer.duration ? currentTime : 0;
    const startedAt = ctx.currentTime - offset;
    const tick = () => {
      if (!webRef.current) return;
      setCurrentTime(ctx.currentTime - startedAt);
      webRef.current.raf = requestAnimationFrame(tick);
    };
    src.onended = () => {
      const finished = ctx.currentTime - startedAt >= buffer.duration - 0.05;
      stopWeb();
      setPlaying(false);
      if (finished) setCurrentTime(0);
    };
    src.start(0, offset);
    webRef.current = { ctx, src, raf: requestAnimationFrame(tick) };
    setDuration(buffer.duration);
    setPlaying(true);
  };

  const toggle = () => {
    if (nativeFailed) {
      if (playing) {
        stopWeb();
        setPlaying(false);
      } else {
        void playWeb();
      }
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      void audio.play().catch(() => {
        setNativeFailed(true);
        void playWeb();
      });
    }
  };

  const progress = duration > 0 ? Math.min(1, currentTime / duration) : 0;
  const activeBars = Math.round(progress * bars.length);

  return (
    <div
      className={cn(
        "mb-1 flex w-64 max-w-full items-center gap-2 rounded-2xl px-3 py-2",
        fromMe ? "bg-primary-foreground/10" : "bg-muted/50",
      )}
    >
      {!nativeFailed && (
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
          onLoadedMetadata={(e) => {
            const d = e.currentTarget.duration;
            if (Number.isFinite(d) && d > 0) setDuration(d);
          }}
          onError={() => setNativeFailed(true)}
        />
      )}

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
