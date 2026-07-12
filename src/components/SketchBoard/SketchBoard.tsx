"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import Modal from "@/components/Modal/Modal";
import Calculator from "./Calculator";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Pencil,
  Eraser,
  Slash,
  MoveUpRight,
  Waves,
  Circle,
  Square,
  Type,
  Undo2,
  Redo2,
  Trash2,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronsDown,
} from "lucide-react";

// Fixed logical width — the canvas scales responsively via CSS, so
// coordinates stay stable no matter the screen size. Height is extendable
// ("add space below") and everything is vector-redrawn, so growing the
// workspace never touches what's already drawn.
const W = 1600;
const BASE_H = 1000;
const EXPAND_STEP = 600;

type Tool =
  | "pen"
  | "eraser"
  | "line"
  | "arrow"
  | "wave"
  | "circle"
  | "rect"
  | "text";

type Shape =
  | {
      kind: "pen" | "eraser";
      points: { x: number; y: number }[];
      color: string;
      width: number;
    }
  | {
      kind: "line" | "arrow" | "wave" | "circle" | "rect";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      width: number;
    }
  | {
      kind: "text";
      x: number;
      y: number;
      text: string;
      color: string;
      size: number;
    };

const COLORS = [
  "#111111",
  "#d32f2f",
  "#1565c0",
  "#2e7d32",
  "#ef6c00",
  "#6a1b9a",
];
const WIDTHS = [3, 5, 9];
const textSizeForWidth = (w: number) => 16 + w * 5;

function drawShape(ctx: CanvasRenderingContext2D, s: Shape) {
  ctx.globalCompositeOperation =
    s.kind === "eraser" ? "destination-out" : "source-over";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = s.kind === "eraser" ? "#000" : s.color;
  ctx.fillStyle = s.kind === "text" ? s.color : "transparent";

  switch (s.kind) {
    case "pen":
    case "eraser": {
      ctx.lineWidth = s.kind === "eraser" ? s.width * 4 : s.width;
      const pts = s.points;
      if (pts.length === 0) break;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      if (pts.length < 3) {
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      } else {
        // midpoint smoothing for natural strokes
        for (let i = 1; i < pts.length - 1; i++) {
          const mx = (pts[i].x + pts[i + 1].x) / 2;
          const my = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
        }
      }
      ctx.stroke();
      break;
    }
    case "line": {
      ctx.lineWidth = s.width;
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
      break;
    }
    case "arrow": {
      ctx.lineWidth = s.width;
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      const angle = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
      const head = 14 + s.width * 2.5;
      ctx.moveTo(s.x2, s.y2);
      ctx.lineTo(
        s.x2 - head * Math.cos(angle - Math.PI / 6),
        s.y2 - head * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(s.x2, s.y2);
      ctx.lineTo(
        s.x2 - head * Math.cos(angle + Math.PI / 6),
        s.y2 - head * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
      break;
    }
    case "wave": {
      // sine wave along the drag direction — a photon line for Feynman diagrams
      ctx.lineWidth = s.width;
      const dx = s.x2 - s.x1;
      const dy = s.y2 - s.y1;
      const len = Math.hypot(dx, dy);
      if (len < 2) break;
      const ux = dx / len;
      const uy = dy / len;
      const amplitude = 8 + s.width * 2;
      const wavelength = 36;
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      for (let d = 2; d <= len; d += 2) {
        const offset = amplitude * Math.sin((d / wavelength) * Math.PI * 2);
        ctx.lineTo(
          s.x1 + ux * d - uy * offset,
          s.y1 + uy * d + ux * offset
        );
      }
      ctx.stroke();
      break;
    }
    case "circle": {
      ctx.lineWidth = s.width;
      const rx = Math.abs(s.x2 - s.x1) / 2;
      const ry = Math.abs(s.y2 - s.y1) / 2;
      if (rx < 1 && ry < 1) break;
      ctx.beginPath();
      ctx.ellipse(
        (s.x1 + s.x2) / 2,
        (s.y1 + s.y2) / 2,
        Math.max(rx, 1),
        Math.max(ry, 1),
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      break;
    }
    case "rect": {
      ctx.lineWidth = s.width;
      ctx.strokeRect(
        Math.min(s.x1, s.x2),
        Math.min(s.y1, s.y2),
        Math.abs(s.x2 - s.x1),
        Math.abs(s.y2 - s.y1)
      );
      break;
    }
    case "text": {
      ctx.font = `${s.size}px Arial, sans-serif`;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.fillText(s.text, s.x, s.y);
      break;
    }
  }
  ctx.globalCompositeOperation = "source-over";
}

function drawAllShapes(
  ctx: CanvasRenderingContext2D,
  shapes: Shape[],
  temp?: Shape | null
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const s of shapes) drawShape(ctx, s);
  if (temp) drawShape(ctx, temp);
}

export default function SketchBoard() {
  const { t } = useTranslation();

  const [board, setBoard] = useState<{ shapes: Shape[]; redo: Shape[] }>({
    shapes: [],
    redo: [],
  });
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(WIDTHS[1]);
  const [pendingText, setPendingText] = useState<{
    x: number;
    y: number;
    value: string;
  } | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [boardWidth, setBoardWidth] = useState(800);
  const [boardH, setBoardH] = useState(BASE_H);
  const [zoom, setZoom] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef<Shape | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const addShape = useCallback((s: Shape) => {
    setBoard((b) => ({ shapes: [...b.shapes, s], redo: [] }));
  }, []);

  const undo = useCallback(() => {
    setBoard((b) =>
      b.shapes.length
        ? {
            shapes: b.shapes.slice(0, -1),
            redo: [...b.redo, b.shapes[b.shapes.length - 1]],
          }
        : b
    );
  }, []);

  const redo = useCallback(() => {
    setBoard((b) =>
      b.redo.length
        ? {
            shapes: [...b.shapes, b.redo[b.redo.length - 1]],
            redo: b.redo.slice(0, -1),
          }
        : b
    );
  }, []);

  // Redraw whenever committed shapes change (or the canvas grows, which
  // resets the bitmap)
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawAllShapes(ctx, board.shapes);
  }, [board.shapes, boardH]);

  // Track displayed width so the text-entry overlay scales with the canvas
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setBoardWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const getPos = (e: React.PointerEvent) => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) * c.width) / r.width,
      y: ((e.clientY - r.top) * c.height) / r.height,
    };
  };

  const commitPendingText = () => {
    if (pendingText && pendingText.value.trim()) {
      addShape({
        kind: "text",
        x: pendingText.x,
        y: pendingText.y,
        text: pendingText.value,
        color,
        size: textSizeForWidth(strokeWidth),
      });
    }
    setPendingText(null);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (pendingText) {
      commitPendingText();
      return;
    }
    const pos = getPos(e);
    if (tool === "text") {
      setPendingText({ x: pos.x, y: pos.y, value: "" });
      setTimeout(() => textInputRef.current?.focus(), 0);
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    if (tool === "pen" || tool === "eraser") {
      drawingRef.current = {
        kind: tool,
        points: [pos],
        color,
        width: strokeWidth,
      };
    } else {
      drawingRef.current = {
        kind: tool,
        x1: pos.x,
        y1: pos.y,
        x2: pos.x,
        y2: pos.y,
        color,
        width: strokeWidth,
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const current = drawingRef.current;
    if (!current) return;
    const pos = getPos(e);
    if (current.kind === "pen" || current.kind === "eraser") {
      current.points.push(pos);
    } else if (current.kind !== "text") {
      current.x2 = pos.x;
      current.y2 = pos.y;
    }
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawAllShapes(ctx, board.shapes, current);
  };

  const handlePointerUp = () => {
    const current = drawingRef.current;
    drawingRef.current = null;
    if (current) addShape(current);
  };

  const downloadPng = () => {
    const off = document.createElement("canvas");
    off.width = W;
    off.height = boardH;
    const offCtx = off.getContext("2d");
    if (!offCtx) return;
    drawAllShapes(offCtx, board.shapes);
    const out = document.createElement("canvas");
    out.width = W;
    out.height = boardH;
    const outCtx = out.getContext("2d");
    if (!outCtx) return;
    outCtx.fillStyle = "#ffffff";
    outCtx.fillRect(0, 0, W, boardH);
    outCtx.drawImage(off, 0, 0);
    const a = document.createElement("a");
    a.href = out.toDataURL("image/png");
    a.download = "sketch.png";
    a.click();
  };

  const scale = (boardWidth * zoom) / W;

  const tools: { key: Tool; icon: React.ReactNode; label: string }[] = [
    { key: "pen", icon: <Pencil className="w-4 h-4" />, label: t("sketchBoard.pen") },
    { key: "eraser", icon: <Eraser className="w-4 h-4" />, label: t("sketchBoard.eraser") },
    { key: "line", icon: <Slash className="w-4 h-4" />, label: t("sketchBoard.line") },
    { key: "arrow", icon: <MoveUpRight className="w-4 h-4" />, label: t("sketchBoard.arrow") },
    { key: "wave", icon: <Waves className="w-4 h-4" />, label: t("sketchBoard.wave") },
    { key: "circle", icon: <Circle className="w-4 h-4" />, label: t("sketchBoard.circle") },
    { key: "rect", icon: <Square className="w-4 h-4" />, label: t("sketchBoard.rect") },
    { key: "text", icon: <Type className="w-4 h-4" />, label: t("sketchBoard.text") },
  ];

  const actionBtn =
    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

  return (
    <div className="space-y-4">
      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title={t("sketchBoard.clearConfirmTitle")}
        message={t("sketchBoard.clearConfirmMessage")}
        showCancel
        cancelText={t("sketchBoard.cancel")}
        confirmText={t("sketchBoard.confirm")}
        onConfirm={() => {
          setBoard({ shapes: [], redo: [] });
          setBoardH(BASE_H);
          setShowClearModal(false);
        }}
      />

      {/* Header */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t("sketchBoard.title")}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t("sketchBoard.subtitle")}
        </p>
      </div>

      <div className="flex flex-col xl:flex-row items-start gap-4">
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Toolbar */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {tools.map(({ key, icon, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTool(key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    tool === key
                      ? "bg-blue-600 text-white shadow-sm"
                      : "border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                  }`}
                  title={label}
                >
                  {icon}
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {/* Colors */}
              <div className="flex items-center gap-1.5" role="group" aria-label={t("sketchBoard.color")}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform ${
                      color === c
                        ? "border-blue-500 scale-110"
                        : "border-gray-200 dark:border-gray-600"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
              <span className="w-px h-6 bg-gray-200 dark:bg-gray-600" />
              {/* Widths */}
              <div className="flex items-center gap-1.5" role="group" aria-label={t("sketchBoard.strokeWidth")}>
                {WIDTHS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setStrokeWidth(w)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                      strokeWidth === w
                        ? "bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-500"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    title={`${t("sketchBoard.strokeWidth")}: ${w}`}
                    aria-label={`${t("sketchBoard.strokeWidth")}: ${w}`}
                  >
                    <span
                      className="rounded-full bg-gray-700 dark:bg-gray-200"
                      style={{ width: w + 3, height: w + 3 }}
                    />
                  </button>
                ))}
              </div>
              <span className="w-px h-6 bg-gray-200 dark:bg-gray-600" />
              {/* Zoom & workspace */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                  disabled={zoom <= 0.5}
                  className={actionBtn}
                  title={t("sketchBoard.zoomOut")}
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 min-w-[42px] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                  disabled={zoom >= 3}
                  className={actionBtn}
                  title={t("sketchBoard.zoomIn")}
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setBoardH((h) => h + EXPAND_STEP)}
                  className={actionBtn}
                  title={t("sketchBoard.addSpace")}
                >
                  <ChevronsDown className="w-4 h-4" />
                  <span className="hidden md:inline">
                    {t("sketchBoard.addSpace")}
                  </span>
                </button>
              </div>
              <span className="w-px h-6 bg-gray-200 dark:bg-gray-600" />
              {/* Actions */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button type="button" onClick={undo} disabled={board.shapes.length === 0} className={actionBtn} title={t("sketchBoard.undo")}>
                  <Undo2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={redo} disabled={board.redo.length === 0} className={actionBtn} title={t("sketchBoard.redo")}>
                  <Redo2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setShowClearModal(true)} disabled={board.shapes.length === 0} className={`${actionBtn} hover:!text-red-600 dark:hover:!text-red-400`} title={t("sketchBoard.clear")}>
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={downloadPng}
                  disabled={board.shapes.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  {t("sketchBoard.downloadPng")}
                </button>
              </div>
            </div>
          </div>

          {/* Canvas — always white like paper, with a dot grid (display only).
              The outer container scrolls, so zooming in or adding space never
              disturbs what is already drawn. */}
          <div
            ref={wrapRef}
            dir="ltr"
            className="rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-auto max-h-[75vh] bg-gray-50 dark:bg-gray-900"
          >
            <div
              className="relative bg-white"
              style={{
                width: `${zoom * 100}%`,
                backgroundImage:
                  "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            >
              <canvas
                ref={canvasRef}
                width={W}
                height={boardH}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={`block w-full h-auto touch-none ${
                  tool === "text" ? "cursor-text" : "cursor-crosshair"
                }`}
              />
              {pendingText && (
                <input
                  ref={textInputRef}
                  type="text"
                  dir="auto"
                  value={pendingText.value}
                  onChange={(e) =>
                    setPendingText((p) =>
                      p ? { ...p, value: e.target.value } : p
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitPendingText();
                    if (e.key === "Escape") setPendingText(null);
                  }}
                  onBlur={commitPendingText}
                  placeholder={t("sketchBoard.textPlaceholder")}
                  className="absolute bg-transparent border-b-2 border-dashed border-blue-400 outline-none placeholder:text-gray-300"
                  style={{
                    left: `${(pendingText.x / W) * 100}%`,
                    top: `${(pendingText.y / boardH) * 100}%`,
                    fontSize: textSizeForWidth(strokeWidth) * scale,
                    fontFamily: "Arial, sans-serif",
                    color,
                    textAlign: "left",
                    minWidth: 120,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Calculator */}
        <aside className="w-full xl:w-80 flex-shrink-0">
          <Calculator />
        </aside>
      </div>
    </div>
  );
}
