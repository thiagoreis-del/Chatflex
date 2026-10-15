import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Circle,
  Crop,
  Eraser,
  Highlighter,
  Pencil,
  Redo2,
  RotateCcw,
  RotateCw,
  ScanLine,
  Square,
  Type,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Tool =
  | "draw"
  | "highlighter"
  | "arrow"
  | "circle"
  | "rectangle"
  | "text"
  | "eraser"
  | "blur"
  | "crop";
type Point = { x: number; y: number };
type Snapshot = { width: number; height: number; base: ImageData; marks: ImageData };

export interface ImageEditorLabels {
  title: string;
  rotate: string;
  draw: string;
  highlighter: string;
  arrow: string;
  circle: string;
  rectangle: string;
  text: string;
  eraser: string;
  blur: string;
  crop: string;
  color: string;
  thickness: string;
  textSize: string;
  textPlaceholder: string;
  undo: string;
  redo: string;
  restore: string;
  canvas: string;
  loading: string;
  cancel: string;
  apply: string;
}

// Cores fixas da paleta de marcação (independentes do tema, como no WhatsApp).
const SWATCHES = ["#ef4444", "#f59e0b", "#facc15", "#22c55e", "#3b82f6", "#a855f7", "#ffffff", "#000000"];

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
  const baseRef = useRef<HTMLCanvasElement>(null);
  const marksRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Snapshot[]>([]);
  const futureRef = useRef<Snapshot[]>([]);
  const startRef = useRef<Point | null>(null);
  const pathRef = useRef<Point[]>([]);
  const beforeRef = useRef<ImageData | null>(null);
  const [tool, setTool] = useState<Tool>("draw");
  const [color, setColor] = useState("#ef4444");
  const [size, setSize] = useState(6);
  const [textSize, setTextSize] = useState(48);
  const [ready, setReady] = useState(false);
  const [, force] = useState(0);
  const [textBox, setTextBox] = useState<{ canvas: Point; css: Point; value: string } | null>(
    null,
  );

  const ctxs = () => {
    const base = baseRef.current;
    const marks = marksRef.current;
    const b = base?.getContext("2d", { willReadFrequently: true });
    const m = marks?.getContext("2d", { willReadFrequently: true });
    if (!base || !marks || !b || !m) return null;
    return { base, marks, b, m };
  };

  const snap = (): Snapshot | null => {
    const c = ctxs();
    if (!c) return null;
    return {
      width: c.base.width,
      height: c.base.height,
      base: c.b.getImageData(0, 0, c.base.width, c.base.height),
      marks: c.m.getImageData(0, 0, c.base.width, c.base.height),
    };
  };
  const restoreSnap = (s: Snapshot) => {
    const c = ctxs();
    if (!c) return;
    for (const cv of [c.base, c.marks]) {
      cv.width = s.width;
      cv.height = s.height;
    }
    c.base.getContext("2d")?.putImageData(s.base, 0, 0);
    c.marks.getContext("2d")?.putImageData(s.marks, 0, 0);
  };
  const remember = () => {
    const s = snap();
    if (!s) return;
    historyRef.current.push(s);
    if (historyRef.current.length > 25) historyRef.current.shift();
    futureRef.current = [];
    force((n) => n + 1);
  };

  const loadOriginal = (onDone?: () => void) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const c = ctxs();
      if (c) {
        const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
        const w = Math.round(image.naturalWidth * scale);
        const h = Math.round(image.naturalHeight * scale);
        for (const cv of [c.base, c.marks]) {
          cv.width = w;
          cv.height = h;
        }
        c.base.getContext("2d")?.drawImage(image, 0, 0, w, h);
        onDone?.();
      }
      URL.revokeObjectURL(url);
    };
    image.onerror = () => URL.revokeObjectURL(url);
    image.src = url;
  };

  useEffect(() => {
    if (!open) return;
    setReady(false);
    setTextBox(null);
    // Aguarda o diálogo montar os canvases.
    const id = requestAnimationFrame(() =>
      loadOriginal(() => {
        historyRef.current = [];
        futureRef.current = [];
        setReady(true);
      }),
    );
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, open]);

  const undo = () => {
    const prev = historyRef.current.pop();
    const now = snap();
    if (!prev || !now) return;
    futureRef.current.push(now);
    restoreSnap(prev);
    force((n) => n + 1);
  };
  const redo = () => {
    const next = futureRef.current.pop();
    const now = snap();
    if (!next || !now) return;
    historyRef.current.push(now);
    restoreSnap(next);
    force((n) => n + 1);
  };
  const restoreOriginal = () => {
    remember();
    loadOriginal();
  };

  const rotate = (dir: 1 | -1) => {
    const c = ctxs();
    if (!c) return;
    remember();
    for (const cv of [c.base, c.marks]) {
      const copy = document.createElement("canvas");
      copy.width = cv.width;
      copy.height = cv.height;
      copy.getContext("2d")?.drawImage(cv, 0, 0);
      cv.width = copy.height;
      cv.height = copy.width;
      const ctx = cv.getContext("2d");
      if (!ctx) continue;
      if (dir === 1) ctx.translate(cv.width, 0);
      else ctx.translate(0, cv.height);
      ctx.rotate((dir * Math.PI) / 2);
      ctx.drawImage(copy, 0, 0);
    }
  };

  const crop = (a: Point, b: Point) => {
    const c = ctxs();
    if (!c) return;
    const x = Math.max(0, Math.round(Math.min(a.x, b.x)));
    const y = Math.max(0, Math.round(Math.min(a.y, b.y)));
    const w = Math.min(c.base.width - x, Math.round(Math.abs(b.x - a.x)));
    const h = Math.min(c.base.height - y, Math.round(Math.abs(b.y - a.y)));
    if (w < 10 || h < 10) return;
    const base = c.b.getImageData(x, y, w, h);
    const marks = c.m.getImageData(x, y, w, h);
    restoreSnap({ width: w, height: h, base, marks });
  };

  const point = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const cv = marksRef.current!;
    const r = cv.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * cv.width,
      y: ((e.clientY - r.top) / r.height) * cv.height,
    };
  };
  // Espessura relativa ao tamanho da imagem para ficar visível em fotos grandes.
  const scaled = (v: number) => {
    const cv = marksRef.current;
    return cv ? Math.max(1, (v * Math.max(cv.width, cv.height)) / 900) : v;
  };

  const drawShape = (m: CanvasRenderingContext2D, a: Point, b: Point) => {
    m.save();
    m.strokeStyle = color;
    m.fillStyle = color;
    m.lineCap = "round";
    m.lineJoin = "round";
    m.lineWidth = scaled(size);
    if (tool === "rectangle") m.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    if (tool === "circle") {
      m.beginPath();
      m.ellipse(
        (a.x + b.x) / 2,
        (a.y + b.y) / 2,
        Math.abs(b.x - a.x) / 2,
        Math.abs(b.y - a.y) / 2,
        0,
        0,
        Math.PI * 2,
      );
      m.stroke();
    }
    if (tool === "arrow") {
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const head = Math.max(scaled(size) * 4, 14);
      m.beginPath();
      m.moveTo(a.x, a.y);
      m.lineTo(b.x - Math.cos(angle) * head * 0.6, b.y - Math.sin(angle) * head * 0.6);
      m.stroke();
      m.beginPath();
      m.moveTo(b.x, b.y);
      m.lineTo(b.x - head * Math.cos(angle - Math.PI / 7), b.y - head * Math.sin(angle - Math.PI / 7));
      m.lineTo(b.x - head * Math.cos(angle + Math.PI / 7), b.y - head * Math.sin(angle + Math.PI / 7));
      m.closePath();
      m.fill();
    }
    if (tool === "crop" || tool === "blur") {
      m.setLineDash([12, 8]);
      m.lineWidth = scaled(2);
      m.strokeStyle = "#ffffff";
      m.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    }
    m.restore();
  };

  const drawPath = (m: CanvasRenderingContext2D, pts: Point[]) => {
    m.save();
    m.lineCap = "round";
    m.lineJoin = "round";
    m.strokeStyle = color;
    if (tool === "highlighter") {
      m.globalAlpha = 0.35;
      m.lineWidth = scaled(size * 4);
      m.lineCap = "square";
    } else m.lineWidth = scaled(size);
    m.beginPath();
    pts.forEach((p, i) => (i ? m.lineTo(p.x, p.y) : m.moveTo(p.x, p.y)));
    if (pts.length === 1) m.lineTo(pts[0]!.x + 0.1, pts[0]!.y);
    m.stroke();
    m.restore();
  };

  const commitText = () => {
    const c = ctxs();
    if (!textBox || !c) return setTextBox(null);
    const value = textBox.value.trim();
    if (value) {
      remember();
      const fs = scaled(textSize);
      c.m.save();
      c.m.font = `bold ${fs}px sans-serif`;
      c.m.textBaseline = "top";
      c.m.lineJoin = "round";
      c.m.lineWidth = Math.max(2, fs / 8);
      c.m.strokeStyle = color === "#000000" ? "#ffffff" : "#000000";
      c.m.fillStyle = color;
      value.split("\n").forEach((line, i) => {
        c.m.strokeText(line, textBox.canvas.x, textBox.canvas.y + i * fs * 1.15);
        c.m.fillText(line, textBox.canvas.x, textBox.canvas.y + i * fs * 1.15);
      });
      c.m.restore();
    }
    setTextBox(null);
  };

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ctxs();
    if (!c) return;
    const p = point(e);
    if (tool === "text") {
      if (textBox) return commitText();
      const wrap = wrapRef.current!.getBoundingClientRect();
      setTextBox({ canvas: p, css: { x: e.clientX - wrap.left, y: e.clientY - wrap.top }, value: "" });
      return;
    }
    c.marks.setPointerCapture(e.pointerId);
    remember();
    startRef.current = p;
    pathRef.current = [p];
    beforeRef.current = c.m.getImageData(0, 0, c.marks.width, c.marks.height);
    if (tool === "eraser") {
      c.m.save();
      c.m.globalCompositeOperation = "destination-out";
      c.m.beginPath();
      c.m.arc(p.x, p.y, scaled(size * 2), 0, Math.PI * 2);
      c.m.fill();
      c.m.restore();
    }
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ctxs();
    if (!c || !startRef.current || !beforeRef.current) return;
    const p = point(e);
    if (tool === "eraser") {
      const last = pathRef.current[pathRef.current.length - 1]!;
      c.m.save();
      c.m.globalCompositeOperation = "destination-out";
      c.m.lineCap = "round";
      c.m.lineWidth = scaled(size * 4);
      c.m.beginPath();
      c.m.moveTo(last.x, last.y);
      c.m.lineTo(p.x, p.y);
      c.m.stroke();
      c.m.restore();
      pathRef.current.push(p);
      return;
    }
    c.m.putImageData(beforeRef.current, 0, 0);
    if (tool === "draw" || tool === "highlighter") {
      pathRef.current.push(p);
      drawPath(c.m, pathRef.current);
    } else drawShape(c.m, startRef.current, p);
  };

  const up = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = ctxs();
    const start = startRef.current;
    if (!c || !start) return;
    const p = point(e);
    if (beforeRef.current && (tool === "crop" || tool === "blur")) {
      c.m.putImageData(beforeRef.current, 0, 0);
      if (tool === "crop") crop(start, p);
      else {
        const x = Math.min(start.x, p.x);
        const y = Math.min(start.y, p.y);
        const w = Math.abs(p.x - start.x);
        const h = Math.abs(p.y - start.y);
        if (w > 2 && h > 2) {
          const copy = document.createElement("canvas");
          copy.width = c.base.width;
          copy.height = c.base.height;
          copy.getContext("2d")?.drawImage(c.base, 0, 0);
          c.b.save();
          c.b.filter = `blur(${Math.max(8, c.base.width / 90)}px)`;
          c.b.drawImage(copy, x, y, w, h, x, y, w, h);
          c.b.restore();
        }
      }
    } else if (tool === "draw" || tool === "highlighter") {
      if (beforeRef.current) c.m.putImageData(beforeRef.current, 0, 0);
      drawPath(c.m, pathRef.current);
    }
    startRef.current = null;
    beforeRef.current = null;
    pathRef.current = [];
  };

  const save = () => {
    const c = ctxs();
    if (!c) return;
    const out = document.createElement("canvas");
    out.width = c.base.width;
    out.height = c.base.height;
    const o = out.getContext("2d");
    if (!o) return;
    o.drawImage(c.base, 0, 0);
    o.drawImage(c.marks, 0, 0);
    const png = file.type === "image/png";
    const type = png ? "image/png" : "image/jpeg";
    out.toBlob(
      (blob) => {
        if (!blob) return;
        const base = file.name.replace(/\.[^.]+$/, "") || "imagem";
        onSave(new File([blob], `${base}-editada.${png ? "png" : "jpg"}`, { type }));
        onOpenChange(false);
      },
      type,
      0.92,
    );
  };

  const tools: Array<{ id: Tool; icon: React.ReactNode; label: string }> = [
    { id: "draw", icon: <Pencil className="size-4" />, label: labels.draw },
    { id: "highlighter", icon: <Highlighter className="size-4" />, label: labels.highlighter },
    { id: "arrow", icon: <ArrowUpRight className="size-4" />, label: labels.arrow },
    { id: "circle", icon: <Circle className="size-4" />, label: labels.circle },
    { id: "rectangle", icon: <Square className="size-4" />, label: labels.rectangle },
    { id: "text", icon: <Type className="size-4" />, label: labels.text },
    { id: "eraser", icon: <Eraser className="size-4" />, label: labels.eraser },
    { id: "blur", icon: <ScanLine className="size-4" />, label: labels.blur },
    { id: "crop", icon: <Crop className="size-4" />, label: labels.crop },
  ];
  const iconBtn = (label: string, onClick: () => void, icon: React.ReactNode, disabled = false) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8"
      onClick={onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
    >
      {icon}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[96dvh] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-2 p-3 sm:p-4">
        <DialogHeader>
          <DialogTitle>{labels.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-0.5 rounded-lg border bg-muted/40 p-1.5">
          {tools.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant={tool === item.id ? "secondary" : "ghost"}
              size="icon"
              className={cn("size-8", tool === item.id && "ring-2 ring-primary")}
              onClick={() => {
                commitText();
                setTool(item.id);
              }}
              aria-label={item.label}
              title={item.label}
              aria-pressed={tool === item.id}
            >
              {item.icon}
            </Button>
          ))}
          <span className="mx-1 h-6 w-px bg-border" />
          {iconBtn(labels.rotate, () => rotate(-1), <RotateCcw className="size-4" />)}
          {iconBtn(labels.rotate, () => rotate(1), <RotateCw className="size-4" />)}
          <span className="flex-1" />
          {iconBtn(labels.undo, undo, <Undo2 className="size-4" />, !historyRef.current.length)}
          {iconBtn(labels.redo, redo, <Redo2 className="size-4" />, !futureRef.current.length)}
          <Button type="button" variant="ghost" size="sm" onClick={restoreOriginal}>
            {labels.restore}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1" role="group" aria-label={labels.color}>
            {SWATCHES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setColor(s)}
                aria-label={`${labels.color} ${s}`}
                aria-pressed={color === s}
                className={cn(
                  "size-5 rounded-full border",
                  color === s && "ring-2 ring-primary ring-offset-1 ring-offset-background",
                )}
                style={{ backgroundColor: s }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              aria-label={labels.color}
              className="size-6 cursor-pointer rounded border bg-transparent"
            />
          </div>
          <label className="flex items-center gap-1">
            {labels.thickness}
            <input
              type="range"
              min={2}
              max={24}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-20 accent-primary"
            />
          </label>
          <label className="flex items-center gap-1">
            {labels.textSize}
            <input
              type="range"
              min={16}
              max={120}
              value={textSize}
              onChange={(e) => setTextSize(Number(e.target.value))}
              className="w-20 accent-primary"
            />
          </label>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-lg bg-muted p-2">
          <div ref={wrapRef} className="relative inline-block max-w-full">
            <canvas ref={baseRef} className="block max-h-[58dvh] max-w-full" />
            <canvas
              ref={marksRef}
              onPointerDown={down}
              onPointerMove={move}
              onPointerUp={up}
              onPointerCancel={up}
              className={cn(
                "absolute inset-0 size-full touch-none",
                tool === "text" ? "cursor-text" : "cursor-crosshair",
              )}
              aria-label={labels.canvas}
            />
            {textBox && (
              <textarea
                autoFocus
                rows={1}
                value={textBox.value}
                placeholder={labels.textPlaceholder}
                onChange={(e) => setTextBox({ ...textBox, value: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    commitText();
                  }
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    setTextBox(null);
                  }
                }}
                onBlur={commitText}
                className="absolute min-w-32 resize-none rounded border border-primary bg-background/80 px-1 font-bold outline-none"
                style={{ left: textBox.css.x, top: textBox.css.y, color, fontSize: Math.max(14, textSize / 2.5) }}
              />
            )}
            {!ready && (
              <p className="absolute inset-0 flex items-center justify-center p-8 text-sm text-muted-foreground">
                {labels.loading}
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
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
