import { useEffect, useRef, useState } from "react";
import { Mic, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { audioExtension, pickAudioMime } from "../audio-format";

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export type RecorderError = "permission" | "unsupported" | "recorder" | "empty";

export function AudioRecorder({
  disabled,
  labels,
  onReady,
  onError,
}: {
  disabled?: boolean;
  labels: { start: string; stop: string; cancel: string; recording: string; unsupported: string };
  onReady: (file: File) => void;
  onError: (reason: RecorderError) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelledRef = useRef(false);

  const release = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  };

  useEffect(() => {
    if (!recording) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(() => () => release(), []);

  const supported =
    typeof navigator !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;

  const start = async () => {
    if (!supported) return onError("unsupported");
    const mimeType = pickAudioMime((m) => MediaRecorder.isTypeSupported(m));
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      release();
      return onError("permission");
    }
    try {
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      cancelledRef.current = false;
      setSeconds(0);
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        cancelledRef.current = true;
        onError("recorder");
      };
      recorder.onstop = () => {
        if (!cancelledRef.current) {
          const type = (recorder.mimeType || mimeType || "audio/webm").split(";")[0]!;
          const blob = new Blob(chunksRef.current, { type });
          // Gravações vazias (ou < 1 KB) não são enviadas.
          if (blob.size < 1024) onError("empty");
          else onReady(new File([blob], `audio-${Date.now()}.${audioExtension(type)}`, { type }));
        }
        chunksRef.current = [];
        setRecording(false);
        release();
      };
      recorder.start(250);
      setRecording(true);
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      release();
      onError("recorder");
    }
  };

  const stop = () => recorderRef.current?.state === "recording" && recorderRef.current.stop();
  const cancel = () => {
    cancelledRef.current = true;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    else {
      release();
      setRecording(false);
    }
  };

  if (!recording) {
    const label = supported ? labels.start : labels.unsupported;
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={disabled}
        aria-label={label}
        title={label}
        onClick={() => void start()}
      >
        <Mic className="size-4" />
      </Button>
    );
  }

  return (
    <div className="col-span-full flex items-center gap-2 rounded-full bg-destructive/10 px-2 py-1 text-sm text-destructive sm:col-span-1">
      <span className="size-2 animate-pulse rounded-full bg-destructive" aria-hidden />
      <span className="min-w-12 font-mono tabular-nums" aria-label={labels.recording}>
        {formatDuration(seconds)}
      </span>
      <Button type="button" variant="ghost" size="icon" aria-label={labels.stop} onClick={stop}>
        <Square className="size-3 fill-current" />
      </Button>
      <Button type="button" variant="ghost" size="icon" aria-label={labels.cancel} onClick={cancel}>
        <X className="size-4" />
      </Button>
    </div>
  );
}
