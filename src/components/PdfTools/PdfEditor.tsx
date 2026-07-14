"use client";

import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { PDFDocument, degrees } from "pdf-lib";
import Modal from "@/components/Modal/Modal";
import { useTranslation } from "@/hooks/useTranslation";
import {
  FileUp,
  Type,
  ImagePlus,
  FilePlus2,
  Download,
  RotateCw,
  RotateCcw,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  Loader2,
  Move,
  Plus,
  Minus,
  ShieldCheck,
  Signature,
} from "lucide-react";

// Set up the worker (same source as PdfViewer)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type Overlay = {
  id: string;
  kind: "text" | "image";
  x: number; // fraction of displayed page width (top-left corner)
  y: number; // fraction of displayed page height (top-left corner)
  text?: string;
  fontFrac?: number; // font size as a fraction of displayed page width
  color?: string;
  dataUrl?: string; // normalized PNG data URL for image overlays
  widthFrac?: number; // image width as a fraction of displayed page width
  aspect?: number; // image height / width
};

type PageEntry = {
  id: string;
  srcIndex: number; // page index in the current pdfBytes (stable — deleted pages stay in bytes until download)
  delta: number; // user-added clockwise rotation in degrees
  overlays: Overlay[];
};

const TEXT_COLORS = ["#111111", "#d32f2f", "#1565c0", "#2e7d32"];
const INK_COLORS = ["#1e3a8a", "#111111"];
const SIGNATURE_STORAGE_KEY = "elitzur-pdf-signature";
const SIGN_W = 1200;
const SIGN_H = 400;
const HEBREW_RE = /[֐-׿]/;
const TEXT_SCALE = 3; // rasterization supersampling for crisp text
const LINE_HEIGHT = 1.3;
const FONT_FAMILY = 'Arial, "Segoe UI", sans-serif';

const uid = () =>
  Math.random().toString(36).slice(2) + Date.now().toString(36);

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const bin = atob(dataUrl.split(",")[1]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Text is rasterized via canvas so Hebrew/RTL and any other script render
// exactly as the browser shows them — no PDF font embedding needed.
function renderTextToPng(
  text: string,
  fontPt: number,
  color: string
): { bytes: Uint8Array; width: number; height: number } | null {
  const fpx = fontPt * TEXT_SCALE;
  const font = `${fpx}px ${FONT_FAMILY}`;
  const lines = text.split("\n");
  const canvas = document.createElement("canvas");
  const measureCtx = canvas.getContext("2d");
  if (!measureCtx) return null;
  measureCtx.font = font;
  const textWidth = Math.max(
    ...lines.map((l) => measureCtx.measureText(l).width),
    fpx * 0.4
  );
  const lineH = fpx * LINE_HEIGHT;
  canvas.width = Math.ceil(textWidth) + 8;
  canvas.height = Math.ceil(lineH * lines.length);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const rtl = HEBREW_RE.test(text);
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  if (rtl) {
    ctx.direction = "rtl";
    ctx.textAlign = "right";
  }
  lines.forEach((line, i) =>
    ctx.fillText(line, rtl ? canvas.width - 4 : 4, lineH * (i + 0.5))
  );
  return {
    bytes: dataUrlToBytes(canvas.toDataURL("image/png")),
    width: canvas.width / TEXT_SCALE,
    height: canvas.height / TEXT_SCALE,
  };
}

// Normalize any image file to PNG (pdf-lib can only embed PNG/JPG)
function imageFileToPng(
  file: File
): Promise<{ dataUrl: string; aspect: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const MAX = 1500;
      const ratio = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * ratio));
      canvas.height = Math.max(1, Math.round(img.height * ratio));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve({
        dataUrl: canvas.toDataURL("image/png"),
        aspect: canvas.height / canvas.width,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Invalid image"));
    };
    img.src = url;
  });
}

// contentEditable text box — content is set once on mount so React never
// clobbers the caret while typing
function EditableText({
  initialText,
  autoSelect,
  style,
  onTextChange,
  onFocus,
}: {
  initialText: string;
  autoSelect: boolean;
  style: React.CSSProperties;
  onTextChange: (text: string) => void;
  onFocus: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerText = initialText;
    if (autoSelect) {
      el.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, []);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      dir="auto"
      style={style}
      onInput={() => onTextChange(ref.current?.innerText ?? "")}
      onFocus={onFocus}
      className="outline-none whitespace-pre min-w-[2ch] cursor-text"
    />
  );
}

export default function PdfEditor() {
  const { t } = useTranslation();

  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState("");
  const [pages, setPages] = useState<PageEntry[]>([]);
  const [inherentRots, setInherentRots] = useState<number[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signHasInk, setSignHasInk] = useState(false);
  const [signColor, setSignColor] = useState(INK_COLORS[0]);
  const [savedSignature, setSavedSignature] = useState<{
    dataUrl: string;
    aspect: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editorWidth, setEditorWidth] = useState(560);

  const originalRef = useRef<{ bytes: Uint8Array; count: number } | null>(
    null
  );
  const srcCountRef = useRef(0);
  const openInputRef = useRef<HTMLInputElement>(null);
  const mergeInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mainColRef = useRef<HTMLDivElement>(null);
  const pageBoxRef = useRef<HTMLDivElement>(null);
  const lastAddedOverlayRef = useRef<string | null>(null);
  const signCanvasRef = useRef<HTMLCanvasElement>(null);
  const signLastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Copy the bytes for react-pdf — pdf.js transfers the buffer to its worker,
  // which would detach the original we still need for pdf-lib
  const fileProp = useMemo(
    () => (pdfBytes ? { data: pdfBytes.slice() } : undefined),
    [pdfBytes]
  );

  const selectedPage = pages.find((p) => p.id === selectedPageId) ?? null;

  // A freshly added text box auto-focuses once on mount; clear the marker
  // after commit so page switches don't re-trigger it
  useEffect(() => {
    lastAddedOverlayRef.current = null;
  });

  // Restore the remembered signature so it only has to be drawn once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIGNATURE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { dataUrl?: unknown; aspect?: unknown };
      if (
        typeof parsed.dataUrl === "string" &&
        typeof parsed.aspect === "number"
      ) {
        setSavedSignature({ dataUrl: parsed.dataUrl, aspect: parsed.aspect });
      }
    } catch {
      // corrupt entry — user just draws again
    }
  }, []);

  // Fresh canvas every time the signature dialog opens
  useEffect(() => {
    if (!showSignModal) return;
    const canvas = signCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignHasInk(false);
    signLastPointRef.current = null;
  }, [showSignModal]);

  // Fit the main page render to the available column width
  useEffect(() => {
    const el = mainColRef.current;
    if (!el) return;
    const update = () =>
      setEditorWidth(clamp(el.clientWidth - 16, 280, 760));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [pdfBytes]);

  const handleDocLoad = useCallback(
    async (pdf: {
      numPages: number;
      getPage: (n: number) => Promise<{ rotate: number }>;
    }) => {
      const rots: number[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const pg = await pdf.getPage(i);
        rots.push(((pg.rotate % 360) + 360) % 360);
      }
      setInherentRots(rots);
    },
    []
  );

  const displayRotation = (p: PageEntry): number | undefined =>
    inherentRots.length > p.srcIndex
      ? (inherentRots[p.srcIndex] + p.delta) % 360
      : undefined;

  // ---------- File open / merge / reset / close ----------

  const openFile = async (f: File) => {
    setError(null);
    try {
      const buf = new Uint8Array(await f.arrayBuffer());
      const doc = await PDFDocument.load(buf);
      const count = doc.getPageCount();
      originalRef.current = { bytes: buf.slice(), count };
      srcCountRef.current = count;
      const entries: PageEntry[] = Array.from({ length: count }, (_, i) => ({
        id: uid(),
        srcIndex: i,
        delta: 0,
        overlays: [],
      }));
      setFileName(f.name);
      setInherentRots([]);
      setPages(entries);
      setSelectedPageId(entries[0]?.id ?? null);
      setSelectedOverlayId(null);
      setPdfBytes(buf);
    } catch (err) {
      console.error("PDF open error:", err);
      setError(t("pdfTools.openError"));
    }
  };

  const mergeFile = async (f: File) => {
    if (!pdfBytes) return;
    setError(null);
    try {
      const addBytes = new Uint8Array(await f.arrayBuffer());
      const cur = await PDFDocument.load(pdfBytes);
      const add = await PDFDocument.load(addBytes);
      const copied = await cur.copyPages(add, add.getPageIndices());
      copied.forEach((pg) => cur.addPage(pg));
      const merged = await cur.save();
      const start = srcCountRef.current;
      srcCountRef.current = start + copied.length;
      const entries: PageEntry[] = copied.map((_, i) => ({
        id: uid(),
        srcIndex: start + i,
        delta: 0,
        overlays: [],
      }));
      setInherentRots([]);
      setPages((prev) => [...prev, ...entries]);
      setPdfBytes(merged);
    } catch (err) {
      console.error("PDF merge error:", err);
      setError(t("pdfTools.mergeError"));
    }
  };

  const resetAll = () => {
    const original = originalRef.current;
    if (!original) return;
    srcCountRef.current = original.count;
    const entries: PageEntry[] = Array.from(
      { length: original.count },
      (_, i) => ({ id: uid(), srcIndex: i, delta: 0, overlays: [] })
    );
    setInherentRots([]);
    setPages(entries);
    setSelectedPageId(entries[0]?.id ?? null);
    setSelectedOverlayId(null);
    setPdfBytes(original.bytes.slice());
    setError(null);
  };

  const closeFile = () => {
    originalRef.current = null;
    srcCountRef.current = 0;
    setPdfBytes(null);
    setFileName("");
    setPages([]);
    setInherentRots([]);
    setSelectedPageId(null);
    setSelectedOverlayId(null);
    setError(null);
  };

  // ---------- Page operations ----------

  const movePage = (id: string, dir: -1 | 1) => {
    setPages((prev) => {
      const i = prev.findIndex((p) => p.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const rotatePage = (id: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, delta: (p.delta + 90) % 360 } : p
      )
    );
  };

  const deletePage = (id: string) => {
    if (pages.length <= 1) return;
    const idx = pages.findIndex((p) => p.id === id);
    const next = pages.filter((p) => p.id !== id);
    setPages(next);
    if (selectedPageId === id) {
      setSelectedPageId(next[Math.min(idx, next.length - 1)].id);
      setSelectedOverlayId(null);
    }
  };

  // ---------- Overlay operations ----------

  const updateOverlay = useCallback(
    (overlayId: string, patch: Partial<Overlay>) => {
      setPages((prev) =>
        prev.map((p) =>
          p.id !== selectedPageId
            ? p
            : {
                ...p,
                overlays: p.overlays.map((o) =>
                  o.id === overlayId ? { ...o, ...patch } : o
                ),
              }
        )
      );
    },
    [selectedPageId]
  );

  const deleteOverlay = (overlayId: string) => {
    setPages((prev) =>
      prev.map((p) =>
        p.id !== selectedPageId
          ? p
          : { ...p, overlays: p.overlays.filter((o) => o.id !== overlayId) }
      )
    );
    if (selectedOverlayId === overlayId) setSelectedOverlayId(null);
  };

  const addTextOverlay = () => {
    if (!selectedPage) return;
    const ov: Overlay = {
      id: uid(),
      kind: "text",
      x: 0.08,
      y: 0.08,
      text: t("pdfTools.textDefault"),
      fontFrac: 0.025,
      color: TEXT_COLORS[0],
    };
    lastAddedOverlayRef.current = ov.id;
    setPages((prev) =>
      prev.map((p) =>
        p.id === selectedPageId
          ? { ...p, overlays: [...p.overlays, ov] }
          : p
      )
    );
    setSelectedOverlayId(ov.id);
  };

  const addImageOverlay = async (f: File) => {
    if (!selectedPage) return;
    try {
      const { dataUrl, aspect } = await imageFileToPng(f);
      const ov: Overlay = {
        id: uid(),
        kind: "image",
        x: 0.1,
        y: 0.1,
        widthFrac: 0.3,
        aspect,
        dataUrl,
      };
      setPages((prev) =>
        prev.map((p) =>
          p.id === selectedPageId
            ? { ...p, overlays: [...p.overlays, ov] }
            : p
        )
      );
      setSelectedOverlayId(ov.id);
    } catch (err) {
      console.error("Image load error:", err);
    }
  };

  // ---------- Signature ----------

  const signPos = (e: React.PointerEvent) => {
    const canvas = signCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const signPointerDown = (e: React.PointerEvent) => {
    const ctx = signCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = signPos(e);
    signLastPointRef.current = p;
    ctx.fillStyle = signColor;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    setSignHasInk(true);
  };

  const signPointerMove = (e: React.PointerEvent) => {
    const last = signLastPointRef.current;
    const ctx = signCanvasRef.current?.getContext("2d");
    if (!last || !ctx) return;
    const p = signPos(e);
    ctx.strokeStyle = signColor;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    signLastPointRef.current = p;
  };

  const signPointerUp = () => {
    signLastPointRef.current = null;
  };

  const clearSignature = () => {
    const canvas = signCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignHasInk(false);
    signLastPointRef.current = null;
  };

  const placeSignature = (dataUrl: string, aspect: number) => {
    if (!selectedPage) return;
    const ov: Overlay = {
      id: uid(),
      kind: "image",
      x: 0.55,
      y: 0.72,
      widthFrac: 0.25,
      aspect,
      dataUrl,
    };
    setPages((prev) =>
      prev.map((p) =>
        p.id === selectedPageId ? { ...p, overlays: [...p.overlays, ov] } : p
      )
    );
    setSelectedOverlayId(ov.id);
    setShowSignModal(false);
  };

  // Crop the drawing to its inked bounding box so the placed signature has
  // no dead margins, then remember it for the next document
  const confirmSignature = () => {
    const canvas = signCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const { data, width, height } = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return;
    const pad = 12;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width - 1, maxX + pad);
    maxY = Math.min(height - 1, maxY + pad);
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    const out = document.createElement("canvas");
    out.width = w;
    out.height = h;
    const outCtx = out.getContext("2d");
    if (!outCtx) return;
    outCtx.drawImage(canvas, minX, minY, w, h, 0, 0, w, h);
    const dataUrl = out.toDataURL("image/png");
    const aspect = h / w;
    try {
      localStorage.setItem(
        SIGNATURE_STORAGE_KEY,
        JSON.stringify({ dataUrl, aspect })
      );
    } catch {
      // storage unavailable — signature still placed, just not remembered
    }
    setSavedSignature({ dataUrl, aspect });
    placeSignature(dataUrl, aspect);
  };

  const startDrag = (e: React.PointerEvent, ov: Overlay) => {
    const rect = pageBoxRef.current?.getBoundingClientRect();
    if (!rect) return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedOverlayId(ov.id);
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = ov.x;
    const origY = ov.y;
    const onMove = (ev: PointerEvent) => {
      updateOverlay(ov.id, {
        x: clamp(origX + (ev.clientX - startX) / rect.width, 0, 0.95),
        y: clamp(origY + (ev.clientY - startY) / rect.height, 0, 0.96),
      });
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  // ---------- Download (build the final PDF) ----------

  const handleDownload = async () => {
    if (!pdfBytes || pages.length === 0) return;
    setIsSaving(true);
    setError(null);
    try {
      const src = await PDFDocument.load(pdfBytes);
      const out = await PDFDocument.create();

      for (const entry of pages) {
        const srcPage = src.getPage(entry.srcIndex);
        const rOrig =
          ((srcPage.getRotation().angle % 360) + 360) % 360;
        const R = (rOrig + entry.delta) % 360;

        let target;
        if (R === 0 || ![90, 180, 270].includes(R)) {
          const [copied] = await out.copyPages(src, [entry.srcIndex]);
          if (rOrig !== 0) copied.setRotation(degrees(0));
          out.addPage(copied);
          target = copied;
        } else {
          // Bake the rotation physically so overlay coordinates stay in
          // plain top-left display space
          const embedded = await out.embedPage(srcPage);
          const Wp = embedded.width;
          const Hp = embedded.height;
          const pg = out.addPage(
            R === 180 ? [Wp, Hp] : ([Hp, Wp] as [number, number])
          );
          if (R === 90) {
            pg.drawPage(embedded, { x: 0, y: Wp, rotate: degrees(-90) });
          } else if (R === 180) {
            pg.drawPage(embedded, { x: Wp, y: Hp, rotate: degrees(180) });
          } else {
            pg.drawPage(embedded, { x: Hp, y: 0, rotate: degrees(90) });
          }
          target = pg;
        }

        const { width: Dw, height: Dh } = target.getSize();
        for (const ov of entry.overlays) {
          if (ov.kind === "text" && ov.text?.trim()) {
            const png = renderTextToPng(
              ov.text,
              (ov.fontFrac ?? 0.025) * Dw,
              ov.color ?? TEXT_COLORS[0]
            );
            if (!png) continue;
            const img = await out.embedPng(png.bytes);
            target.drawImage(img, {
              x: ov.x * Dw,
              y: Dh - ov.y * Dh - png.height,
              width: png.width,
              height: png.height,
            });
          } else if (ov.kind === "image" && ov.dataUrl) {
            const img = await out.embedPng(dataUrlToBytes(ov.dataUrl));
            const w = (ov.widthFrac ?? 0.3) * Dw;
            const h = w * (ov.aspect ?? 1);
            target.drawImage(img, {
              x: ov.x * Dw,
              y: Dh - ov.y * Dh - h,
              width: w,
              height: h,
            });
          }
        }
      }

      const outBytes = await out.save();
      const ab = outBytes.buffer.slice(
        outBytes.byteOffset,
        outBytes.byteOffset + outBytes.byteLength
      ) as ArrayBuffer;
      const blob = new Blob([ab], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.replace(/\.pdf$/i, "")}-edited.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error("PDF save error:", err);
      setError(t("pdfTools.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  // ---------- Render ----------

  const toolbarBtn =
    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const thumbBtn =
    "p-1 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <div className="space-y-4">
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title={t("pdfTools.resetConfirmTitle")}
        message={t("pdfTools.resetConfirmMessage")}
        showCancel
        cancelText={t("pdfTools.cancel")}
        confirmText={t("pdfTools.confirm")}
        onConfirm={() => {
          resetAll();
          setShowResetModal(false);
        }}
      />

      {/* Signature dialog */}
      {showSignModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowSignModal(false)}
            aria-hidden="true"
          />
          <div
            className="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-800 shadow-2xl p-6"
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("pdfTools.signTitle")}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("pdfTools.signHint")}
            </p>

            {savedSignature && (
              <button
                type="button"
                onClick={() =>
                  placeSignature(savedSignature.dataUrl, savedSignature.aspect)
                }
                className="mt-3 flex items-center gap-3 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
              >
                <img
                  src={savedSignature.dataUrl}
                  alt=""
                  className="h-9 max-w-[45%] object-contain bg-white rounded px-1"
                />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {t("pdfTools.signUseSaved")}
                </span>
              </button>
            )}

            <div className="relative mt-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white overflow-hidden">
              <canvas
                ref={signCanvasRef}
                width={SIGN_W}
                height={SIGN_H}
                onPointerDown={signPointerDown}
                onPointerMove={signPointerMove}
                onPointerUp={signPointerUp}
                onPointerCancel={signPointerUp}
                className="block w-full h-auto touch-none cursor-crosshair"
              />
              {/* Baseline guide — display only, never exported */}
              <div className="pointer-events-none absolute inset-x-10 bottom-[22%] border-b border-dashed border-gray-300" />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                {INK_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSignColor(c)}
                    className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                      signColor === c
                        ? "border-blue-500 scale-110"
                        : "border-gray-200 dark:border-gray-600"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={clearSignature}
                disabled={!signHasInk}
                className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t("pdfTools.signClear")}
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setShowSignModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                {t("pdfTools.cancel")}
              </button>
              <button
                type="button"
                onClick={confirmSignature}
                disabled={!signHasInk}
                className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Signature className="w-4 h-4" />
                {t("pdfTools.signAdd")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          {t("pdfTools.title")}
        </h2>
        <p className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <ShieldCheck className="w-4 h-4 flex-shrink-0 text-green-600 dark:text-green-400" />
          {t("pdfTools.subtitle")}
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {!pdfBytes ? (
        /* Drop zone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) openFile(f);
          }}
          onClick={() => openInputRef.current?.click()}
          className={`rounded-xl border-2 border-dashed p-16 text-center transition-colors cursor-pointer ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          }`}
        >
          <input
            ref={openInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) openFile(f);
              e.target.value = "";
            }}
          />
          <FileUp
            className={`w-14 h-14 mx-auto mb-4 ${
              isDragging ? "text-blue-500" : "text-gray-400 dark:text-gray-500"
            }`}
          />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">
            {t("pdfTools.dropTitle")}
          </p>
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            {t("pdfTools.dropHint")}
          </p>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={addTextOverlay} className={toolbarBtn} disabled={!selectedPage}>
                <Type className="w-4 h-4" />
                {t("pdfTools.addText")}
              </button>
              <button type="button" onClick={() => imageInputRef.current?.click()} className={toolbarBtn} disabled={!selectedPage}>
                <ImagePlus className="w-4 h-4" />
                {t("pdfTools.addImage")}
              </button>
              <button type="button" onClick={() => setShowSignModal(true)} className={toolbarBtn} disabled={!selectedPage}>
                <Signature className="w-4 h-4" />
                {t("pdfTools.sign")}
              </button>
              <button type="button" onClick={() => mergeInputRef.current?.click()} className={toolbarBtn}>
                <FilePlus2 className="w-4 h-4" />
                {t("pdfTools.mergePdf")}
              </button>
              <button type="button" onClick={() => setShowResetModal(true)} className={toolbarBtn}>
                <RotateCcw className="w-4 h-4" />
                {t("pdfTools.reset")}
              </button>
              <button type="button" onClick={closeFile} className={toolbarBtn}>
                <X className="w-4 h-4" />
                {t("pdfTools.close")}
              </button>
              <div className="flex-1 min-w-2" />
              <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[180px]" title={fileName}>
                {fileName}
              </span>
              <button
                type="button"
                onClick={handleDownload}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t("pdfTools.downloading")}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    {t("pdfTools.download")}
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              {t("pdfTools.editHint")}
            </p>
            <input
              ref={mergeInputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) mergeFile(f);
                e.target.value = "";
              }}
            />
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) addImageOverlay(f);
                e.target.value = "";
              }}
            />
          </div>

          <Document
            file={fileProp}
            onLoadSuccess={handleDocLoad}
            onLoadError={(err: Error) => {
              console.error("PDF render error:", err);
              setError(t("pdfTools.openError"));
            }}
            loading={
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            }
            className="flex flex-col lg:flex-row items-start gap-4"
          >
            {/* Page thumbnails */}
            <aside className="w-full lg:w-48 flex-shrink-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                {t("pdfTools.pages")} ({pages.length})
              </div>
              <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-visible lg:max-h-[65vh] lg:overflow-y-auto p-1">
                {pages.map((p, idx) => {
                  const isSelected = p.id === selectedPageId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPageId(p.id);
                        setSelectedOverlayId(null);
                      }}
                      className={`relative flex-shrink-0 rounded-lg border-2 p-1 cursor-pointer transition-colors ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      <Page
                        pageNumber={p.srcIndex + 1}
                        width={120}
                        rotate={displayRotation(p)}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        loading={
                          <div className="w-[120px] h-[160px] bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                        }
                      />
                      <span className="absolute top-2 start-2 text-[10px] font-medium bg-black/60 text-white rounded px-1.5 py-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex items-center justify-center gap-0.5 mt-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            movePage(p.id, -1);
                          }}
                          disabled={idx === 0}
                          className={thumbBtn}
                          title={t("pdfTools.moveUp")}
                          aria-label={t("pdfTools.moveUp")}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            movePage(p.id, 1);
                          }}
                          disabled={idx === pages.length - 1}
                          className={thumbBtn}
                          title={t("pdfTools.moveDown")}
                          aria-label={t("pdfTools.moveDown")}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            rotatePage(p.id);
                          }}
                          className={thumbBtn}
                          title={t("pdfTools.rotatePage")}
                          aria-label={t("pdfTools.rotatePage")}
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePage(p.id);
                          }}
                          disabled={pages.length <= 1}
                          className={`${thumbBtn} hover:!text-red-600 dark:hover:!text-red-400`}
                          title={t("pdfTools.deletePage")}
                          aria-label={t("pdfTools.deletePage")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>

            {/* Main page editor */}
            <div
              ref={mainColRef}
              className="flex-1 min-w-0 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 p-4 pt-14 shadow-sm flex justify-center overflow-x-auto"
            >
              {selectedPage && (
                <div
                  ref={pageBoxRef}
                  className="relative inline-block"
                  onClick={() => setSelectedOverlayId(null)}
                >
                  <Page
                    key={selectedPage.id}
                    pageNumber={selectedPage.srcIndex + 1}
                    width={editorWidth}
                    rotate={displayRotation(selectedPage)}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    className="shadow-lg"
                    loading={
                      <div
                        style={{ width: editorWidth, height: editorWidth * 1.41 }}
                        className="bg-white dark:bg-gray-700 rounded animate-pulse"
                      />
                    }
                  />
                  {/* Overlay layer */}
                  <div className="absolute inset-0">
                    {selectedPage.overlays.map((ov) => {
                      const isSelected = ov.id === selectedOverlayId;
                      const wasJustAdded =
                        lastAddedOverlayRef.current === ov.id;
                      return (
                        <div
                          key={ov.id}
                          className={`absolute ${isSelected ? "z-20" : "z-10"}`}
                          style={{
                            left: `${ov.x * 100}%`,
                            top: `${ov.y * 100}%`,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOverlayId(ov.id);
                          }}
                        >
                          {/* Floating toolbar */}
                          {isSelected && (
                            <div
                              className="absolute -top-11 start-0 z-30 flex items-center gap-1 rounded-lg bg-gray-900 dark:bg-gray-700 text-white shadow-lg px-1.5 py-1 whitespace-nowrap"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onPointerDown={(e) => startDrag(e, ov)}
                                className="p-1.5 rounded hover:bg-gray-700 dark:hover:bg-gray-600 cursor-move touch-none"
                                title={t("pdfTools.dragToMove")}
                                aria-label={t("pdfTools.dragToMove")}
                              >
                                <Move className="w-4 h-4" />
                              </button>
                              {ov.kind === "text" ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateOverlay(ov.id, {
                                        fontFrac: clamp(
                                          (ov.fontFrac ?? 0.025) - 0.004,
                                          0.01,
                                          0.12
                                        ),
                                      })
                                    }
                                    className="p-1.5 rounded hover:bg-gray-700 dark:hover:bg-gray-600 cursor-pointer"
                                    title={t("pdfTools.smallerText")}
                                    aria-label={t("pdfTools.smallerText")}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateOverlay(ov.id, {
                                        fontFrac: clamp(
                                          (ov.fontFrac ?? 0.025) + 0.004,
                                          0.01,
                                          0.12
                                        ),
                                      })
                                    }
                                    className="p-1.5 rounded hover:bg-gray-700 dark:hover:bg-gray-600 cursor-pointer"
                                    title={t("pdfTools.biggerText")}
                                    aria-label={t("pdfTools.biggerText")}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                  <span className="w-px h-4 bg-gray-600 mx-0.5" />
                                  {TEXT_COLORS.map((c) => (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() =>
                                        updateOverlay(ov.id, { color: c })
                                      }
                                      className={`w-5 h-5 rounded-full border-2 cursor-pointer ${
                                        ov.color === c
                                          ? "border-white"
                                          : "border-transparent"
                                      }`}
                                      style={{ backgroundColor: c }}
                                      aria-label={c}
                                    />
                                  ))}
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateOverlay(ov.id, {
                                        widthFrac: clamp(
                                          (ov.widthFrac ?? 0.3) - 0.04,
                                          0.03,
                                          0.95
                                        ),
                                      })
                                    }
                                    className="p-1.5 rounded hover:bg-gray-700 dark:hover:bg-gray-600 cursor-pointer"
                                    title={t("pdfTools.smallerImage")}
                                    aria-label={t("pdfTools.smallerImage")}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateOverlay(ov.id, {
                                        widthFrac: clamp(
                                          (ov.widthFrac ?? 0.3) + 0.04,
                                          0.03,
                                          0.95
                                        ),
                                      })
                                    }
                                    className="p-1.5 rounded hover:bg-gray-700 dark:hover:bg-gray-600 cursor-pointer"
                                    title={t("pdfTools.biggerImage")}
                                    aria-label={t("pdfTools.biggerImage")}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <span className="w-px h-4 bg-gray-600 mx-0.5" />
                              <button
                                type="button"
                                onClick={() => deleteOverlay(ov.id)}
                                className="p-1.5 rounded hover:bg-gray-700 dark:hover:bg-gray-600 text-red-400 cursor-pointer"
                                title={t("pdfTools.deleteItem")}
                                aria-label={t("pdfTools.deleteItem")}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {ov.kind === "text" ? (
                            <div
                              className={`rounded ${
                                isSelected
                                  ? "ring-2 ring-blue-500"
                                  : "hover:ring-2 hover:ring-blue-300"
                              }`}
                            >
                              <EditableText
                                initialText={ov.text ?? ""}
                                autoSelect={wasJustAdded}
                                style={{
                                  fontSize:
                                    (ov.fontFrac ?? 0.025) * editorWidth,
                                  lineHeight: LINE_HEIGHT,
                                  color: ov.color,
                                  fontFamily: FONT_FAMILY,
                                }}
                                onTextChange={(text) =>
                                  updateOverlay(ov.id, { text })
                                }
                                onFocus={() => setSelectedOverlayId(ov.id)}
                              />
                            </div>
                          ) : (
                            <img
                              src={ov.dataUrl}
                              alt=""
                              draggable={false}
                              onPointerDown={(e) => startDrag(e, ov)}
                              className={`cursor-move rounded touch-none ${
                                isSelected
                                  ? "ring-2 ring-blue-500"
                                  : "hover:ring-2 hover:ring-blue-300"
                              }`}
                              style={{
                                width: (ov.widthFrac ?? 0.3) * editorWidth,
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Document>
        </>
      )}
    </div>
  );
}
