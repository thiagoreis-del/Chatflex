import { useEffect, useRef, useState } from "react";
import { Pencil, Redo2, RotateCw, ScanLine, Smile, Square, Type, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Tool = "draw" | "rectangle" | "blur";
type Point = { x: number; y: number };
type Snapshot = { width: number; height: number; data: ImageData };
interface ImageEditorLabels {
  title: string;
  rotate: string;
  draw: string;
  rectangle: string;
  blur: string;
  text: string;
  emoji: string;
  color: string;
  undo: string;
  redo: string;
  textPrompt: string;
  emojiPrompt: string;
  canvas: string;
  loading: string;
  cancel: string;
  apply: string;
}

function canvasPoint(
  canvas: HTMLCanvasElement,
  event: React.PointerEvent<HTMLCanvasElement>,
): Point {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

export function ImageEditorDialog({
  file,
  open,
  onOpenChange,
  onSave,
  labels,
}: {
  file: File;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (file: File) => void;
  labels: ImageEditorLabels;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<Snapshot[]>([]);
  const futureRef = useRef<Snapshot[]>([]);
  const startRef = useRef<Point | null>(null);
  const beforeActionRef = useRef<ImageData | null>(null);
  const [tool, setTool] = useState<Tool>("draw");
  const [color, setColor] = useState("#ef4444");
  const [ready, setReady] = useState(false);

  const remember = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    historyRef.current.push({
      width: canvas.width,
      height: canvas.height,
      data: ctx.getImageData(0, 0, canvas.width, canvas.height),
    });
    if (historyRef.current.length > 20) historyRef.current.shift();
    futureRef.current = [];
  };

  useEffect(() => {
    if (!open) return;
    setReady(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 1400 / Math.max(image.naturalWidth, image.naturalHeight));
      canvas.width = Math.round(image.naturalWidth * scale);
      canvas.height = Math.round(image.naturalHeight * scale);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      historyRef.current = [];
      futureRef.current = [];
      setReady(true);
      URL.revokeObjectURL(url);
    };
    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file, open]);

  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const previous = historyRef.current.pop();
    if (!canvas || !ctx || !previous) return;
    futureRef.current.push({
      width: canvas.width,
      height: canvas.height,
      data: ctx.getImageData(0, 0, canvas.width, canvas.height),
    });
    canvas.width = previous.width;
    canvas.height = previous.height;
    canvas.getContext("2d")?.putImageData(previous.data, 0, 0);
  };

  const redo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const next = futureRef.current.pop();
    if (!canvas || !ctx || !next) return;
    historyRef.current.push({
      width: canvas.width,
      height: canvas.height,
      data: ctx.getImageData(0, 0, canvas.width, canvas.height),
    });
    canvas.width = next.width;
    canvas.height = next.height;
    canvas.getContext("2d")?.putImageData(next.data, 0, 0);
  };

  const rotate = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    remember();
    const copy = document.createElement("canvas");
    copy.width = canvas.width;
    copy.height = canvas.height;
    copy.getContext("2d")?.drawImage(canvas, 0, 0);
    canvas.width = copy.height;
    canvas.height = copy.width;
    const next = canvas.getContext("2d");
    next?.translate(canvas.width, 0);
    next?.rotate(Math.PI / 2);
    next?.drawImage(copy, 0, 0);
  };

  const addText = (emoji = false) => {
    const value = window.prompt(emoji ? labels.emojiPrompt : labels.textPrompt);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!value || !canvas || !ctx) return;
    remember();
    ctx.fillStyle = color;
    ctx.strokeStyle = "white";
    ctx.lineWidth = 4;
    ctx.font = `${emoji ? 72 : 44}px sans-serif`;
    ctx.textAlign = "center";
    ctx.strokeText(value, canvas.width / 2, canvas.height / 2);
    ctx.fillText(value, canvas.width / 2, canvas.height / 2);
  };

  const pointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(event.pointerId);
    remember();
    beforeActionRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    startRef.current = canvasPoint(canvas, event);
    if (tool === "draw") {
      ctx.beginPath();
      ctx.moveTo(startRef.current.x, startRef.current.y);
    }
  };

  const pointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !startRef.current || !beforeActionRef.current) return;
    const point = canvasPoint(canvas, event);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(4, canvas.width / 180);
    ctx.strokeStyle = color;
    if (tool === "draw") {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      return;
    }
    ctx.putImageData(beforeActionRef.current, 0, 0);
    if (tool === "rectangle") {
      ctx.strokeRect(
        startRef.current.x,
        startRef.current.y,
        point.x - startRef.current.x,
        point.y - startRef.current.y,
      );
    }
  };

  const pointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !startRef.current) return;
    const point = canvasPoint(canvas, event);
    if (tool === "blur" && beforeActionRef.current) {
      ctx.putImageData(beforeActionRef.current, 0, 0);
      const x = Math.min(startRef.current.x, point.x);
      const y = Math.min(startRef.current.y, point.y);
      const width = Math.abs(point.x - startRef.current.x);
      const height = Math.abs(point.y - startRef.current.y);
      if (width > 2 && height > 2) {
        const copy = document.createElement("canvas");
        copy.width = canvas.width;
        copy.height = canvas.height;
        copy.getContext("2d")?.putImageData(beforeActionRef.current, 0, 0);
        ctx.save();
        ctx.filter = `blur(${Math.max(8, canvas.width / 90)}px)`;
        ctx.drawImage(copy, x, y, width, height, x, y, width, height);
        ctx.restore();
      }
    }
    startRef.current = null;
    beforeActionRef.current = null;
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const base = file.name.replace(/\.[^.]+$/, "");
        onSave(new File([blob], `${base}-editada.jpg`, { type: "image/jpeg" }));
        onOpenChange(false);
      },
      "image/jpeg",
      0.92,
    );
  };

  const tools: Array<{ id: Tool; icon: React.ReactNode; label: string }> = [
    { id: "draw", icon: <Pencil className="size-4" />, label: labels.draw },
    { id: "rectangle", icon: <Square className="size-4" />, label: labels.rectangle },
    { id: "blur", icon: <ScanLine className="size-4" />, label: labels.blur },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[95vh] max-w-5xl flex-col">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/40 p-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={rotate}
            aria-label={labels.rotate}
          >
            <RotateCw className="size-4" />
          </Button>
          {tools.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant={tool === item.id ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setTool(item.id)}
              aria-label={item.label}
              aria-pressed={tool === item.id}
            >
              {item.icon}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => addText(false)}
            aria-label={labels.text}
          >
            <Type className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => addText(true)}
            aria-label={labels.emoji}
          >
            <Smile className="size-4" />
          </Button>
          <label className="ml-1 flex items-center gap-2 text-xs text-muted-foreground">
            {labels.color}
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="size-8 rounded border bg-transparent"
            />
          </label>
          <span className="flex-1" />
          <Button type="button" variant="ghost" size="icon" onClick={undo} aria-label={labels.undo}>
            <Undo2 className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={redo} aria-label={labels.redo}>
            <Redo2 className="size-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto rounded-lg bg-neutral-900 p-2 text-center">
          <canvas
            ref={canvasRef}
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerUp}
            onPointerCancel={pointerUp}
            className="mx-auto max-h-[62vh] max-w-full touch-none bg-white object-contain"
            aria-label={labels.canvas}
          />
          {!ready && <p className="p-8 text-sm text-white">{labels.loading}</p>}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {labels.cancel}
          </Button>
          <Button type="button" onClick={save} disabled={!ready}>
            {labels.apply}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
