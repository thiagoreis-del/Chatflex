import { useEffect, useRef, useState } from "react";
import { Mic, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function AudioRecorder({
  disabled,
  labels,
  onReady,
  onError,
}: {
  disabled?: boolean;
  labels: { start: string; stop: string; cancel: string; recording: string };
  onReady: (file: File) => void;
  onError: () => void;
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

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const preferred = "audio/webm;codecs=opus";
      const mimeType = MediaRecorder.isTypeSupported(preferred) ? preferred : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      cancelledRef.current = false;
      setSeconds(0);
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        if (!cancelledRef.current && chunksRef.current.length) {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
          onReady(new File([blob], `audio-${Date.now()}.webm`, { type: recorder.mimeType }));
        }
        chunksRef.current = [];
        setRecording(false);
        release();
      };
      recorder.start(250);
      setRecording(true);
    } catch {
      release();
      onError();
    }
  };

  const stop = () => recorderRef.current?.state === "recording" && recorderRef.current.stop();
  const cancel = () => {
    cancelledRef.current = true;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    else release();
  };

  if (!recording) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={
          disabled ||
          typeof navigator === "undefined" ||
          typeof MediaRecorder === "undefined" ||
          !navigator.mediaDevices?.getUserMedia
        }
        aria-label={labels.start}
        title={labels.start}
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
