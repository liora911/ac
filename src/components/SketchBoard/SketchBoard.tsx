"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import Modal from "@/components/Modal/Modal";
import Calculator from "./Calculator";
import { evaluateExpression } from "./mathParser";
import { useTranslation } from "@/hooks/useTranslation";
import {
  MousePointer2,
  Pencil,
  Eraser,
  Slash,
  MoveUpRight,
  MoveHorizontal,
  Waves,
  Shell,
  Circle,
  CircleDot,
  Square,
  Triangle,
  Diamond,
  Pentagon,
  Hexagon,
  Star,
  Type,
  Undo2,
  Redo2,
  Trash2,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronsDown,
  ChevronDown,
  Shapes as ShapesIcon,
  PaintBucket,
  ChartSpline,
  Calculator as CalculatorIcon,
  X,
  Disc,
  Octagon,
  Cross,
  Heart,
  Cloud,
  Moon,
  Cylinder,
  Box,
  Zap,
  MessageSquare,
  Magnet,
  Atom as AtomIcon,
  Orbit as OrbitIcon,
  Sigma,
  Plus,
  Minus,
  RotateCw,
  RotateCcw,
  GripHorizontal,
} from "lucide-react";
import {
  EQUATION_CATEGORIES,
  TOTAL_EQUATIONS,
} from "./equations";

// Fixed logical width — the canvas scales responsively via CSS, so
// coordinates stay stable no matter the screen size. Height is extendable
// ("add space below") and everything is vector-redrawn, so growing the
// workspace never touches what's already drawn.
const W = 1600;
const BASE_H = 1000;
const EXPAND_STEP = 600;
const STORAGE_KEY = "elitzur-sketchboard";
const HISTORY_LIMIT = 50;

type BoxKind =
  | "line"
  | "arrow"
  | "dblarrow"
  | "dashed"
  | "wave"
  | "coil"
  | "circle"
  | "disk"
  | "rect"
  | "triangle"
  | "rightTriangle"
  | "diamond"
  | "pentagon"
  | "hexagon"
  | "octagon"
  | "star"
  | "parallelogram"
  | "trapezoid"
  | "semicircle"
  | "cross"
  | "ring"
  | "torus"
  | "orbit"
  | "cylinder"
  | "cube"
  | "lightning"
  | "heart"
  | "cloud"
  | "crescent"
  | "speechBubble"
  | "dipole"
  | "atom"
  | "zigzag"
  | "dotted"
  | "dot"
  | "axes";

type Shape =
  | {
      kind: "pen" | "eraser";
      points: { x: number; y: number }[];
      color: string;
      width: number;
      rotation?: number; // clockwise degrees about the shape's bbox center
    }
  | {
      kind: BoxKind;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      width: number;
      fill?: boolean;
      rotation?: number;
      atomZ?: number; // for kind "atom": atomic number to render as Bohr model
    }
  | {
      kind: "text";
      x: number;
      y: number;
      text: string;
      color: string;
      size: number;
      rotation?: number;
    }
  | {
      kind: "graph";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      width: number;
      expr: string;
      xMin: number;
      xMax: number;
      rotation?: number;
    };

type Tool = "select" | "pen" | "eraser" | "text" | BoxKind;

const COLORS = [
  "#111111",
  "#d32f2f",
  "#1565c0",
  "#2e7d32",
  "#ef6c00",
  "#6a1b9a",
];
const WIDTHS = [3, 5, 9];
const CLOSED_KINDS: ReadonlySet<string> = new Set([
  "circle",
  "disk",
  "rect",
  "triangle",
  "rightTriangle",
  "diamond",
  "pentagon",
  "hexagon",
  "octagon",
  "star",
  "parallelogram",
  "trapezoid",
  "semicircle",
  "cross",
  "lightning",
  "heart",
  "cloud",
  "speechBubble",
]);
const SEGMENT_KINDS: ReadonlySet<string> = new Set([
  "line",
  "arrow",
  "dblarrow",
  "dashed",
  "wave",
  "coil",
  "zigzag",
  "dotted",
]);

const textSizeForWidth = (w: number) => 16 + w * 5;
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const dotRadius = (w: number) => 4 + w * 1.5;
const coilRadius = (w: number) => 7 + w * 1.5;
const waveAmplitude = (w: number) => 8 + w * 2;

// ---------- Geometry helpers ----------

function regularPolygon(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  sides: number,
  startAngle = -Math.PI / 2
): { x: number; y: number }[] {
  const pts = [];
  for (let k = 0; k < sides; k++) {
    const a = startAngle + (k * 2 * Math.PI) / sides;
    pts.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
  }
  return pts;
}

// Bohr-model electron shells via aufbau (Madelung) filling — schematic
// occupancies per principal shell, good for all 118 elements
const MADELUNG: [number, number][] = [
  [1, 2], [2, 2], [2, 6], [3, 2], [3, 6], [4, 2], [3, 10], [4, 6],
  [5, 2], [4, 10], [5, 6], [6, 2], [4, 14], [5, 10], [6, 6], [7, 2],
  [5, 14], [6, 10], [7, 6],
];

export const ELEMENT_SYMBOLS = [
  "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne",
  "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca",
  "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn",
  "Ga", "Ge", "As", "Se", "Br", "Kr", "Rb", "Sr", "Y", "Zr",
  "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn",
  "Sb", "Te", "I", "Xe", "Cs", "Ba", "La", "Ce", "Pr", "Nd",
  "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb",
  "Lu", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg",
  "Tl", "Pb", "Bi", "Po", "At", "Rn", "Fr", "Ra", "Ac", "Th",
  "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm",
  "Md", "No", "Lr", "Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds",
  "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og",
];

function bohrShells(z: number): number[] {
  const shells: number[] = [];
  let remaining = z;
  for (const [n, capacity] of MADELUNG) {
    if (remaining <= 0) break;
    const add = Math.min(capacity, remaining);
    shells[n - 1] = (shells[n - 1] ?? 0) + add;
    remaining -= add;
  }
  return shells.map((count) => count ?? 0);
}

function polygonPoints(
  kind: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { x: number; y: number }[] {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const rx = (maxX - minX) / 2;
  const ry = (maxY - minY) / 2;
  const slant = (maxX - minX) * 0.25;

  switch (kind) {
    case "triangle":
      return [
        { x: cx, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
      ];
    case "diamond":
      return [
        { x: cx, y: minY },
        { x: maxX, y: cy },
        { x: cx, y: maxY },
        { x: minX, y: cy },
      ];
    case "pentagon":
      return regularPolygon(cx, cy, rx, ry, 5);
    case "hexagon":
      return regularPolygon(cx, cy, rx, ry, 6);
    case "star": {
      const pts = [];
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        const f = k % 2 === 0 ? 1 : 0.42;
        pts.push({ x: cx + rx * f * Math.cos(a), y: cy + ry * f * Math.sin(a) });
      }
      return pts;
    }
    case "parallelogram":
      return [
        { x: minX + slant, y: minY },
        { x: maxX, y: minY },
        { x: maxX - slant, y: maxY },
        { x: minX, y: maxY },
      ];
    case "trapezoid":
      return [
        { x: minX + slant, y: minY },
        { x: maxX - slant, y: minY },
        { x: maxX, y: maxY },
        { x: minX, y: maxY },
      ];
    case "rightTriangle":
      return [
        { x: minX, y: minY },
        { x: minX, y: maxY },
        { x: maxX, y: maxY },
      ];
    case "octagon":
      return regularPolygon(cx, cy, rx, ry, 8, -Math.PI / 2 + Math.PI / 8);
    case "cross": {
      // Plus sign built from horizontal/vertical thirds of the box
      const w3 = (maxX - minX) / 3;
      const h3 = (maxY - minY) / 3;
      return [
        { x: minX + w3, y: minY },
        { x: maxX - w3, y: minY },
        { x: maxX - w3, y: minY + h3 },
        { x: maxX, y: minY + h3 },
        { x: maxX, y: maxY - h3 },
        { x: maxX - w3, y: maxY - h3 },
        { x: maxX - w3, y: maxY },
        { x: minX + w3, y: maxY },
        { x: minX + w3, y: maxY - h3 },
        { x: minX, y: maxY - h3 },
        { x: minX, y: minY + h3 },
        { x: minX + w3, y: minY + h3 },
      ];
    }
    case "lightning": {
      const w = maxX - minX;
      const h = maxY - minY;
      const pt = (fx: number, fy: number) => ({
        x: minX + fx * w,
        y: minY + fy * h,
      });
      return [
        pt(0.55, 0),
        pt(0.15, 0.6),
        pt(0.4, 0.6),
        pt(0.3, 1),
        pt(0.85, 0.35),
        pt(0.55, 0.35),
        pt(0.75, 0),
      ];
    }
    default:
      return [];
  }
}

function distToSegment(
  p: { x: number; y: number },
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - x1, p.y - y1);
  let t = ((p.x - x1) * dx + (p.y - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (x1 + t * dx), p.y - (y1 + t * dy));
}

function shapeBBox(
  s: Shape,
  ctx?: CanvasRenderingContext2D
): { minX: number; minY: number; maxX: number; maxY: number } {
  switch (s.kind) {
    case "pen":
    case "eraser": {
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const p of s.points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
      return { minX, minY, maxX, maxY };
    }
    case "text": {
      let width = s.text.length * s.size * 0.55;
      if (ctx) {
        ctx.font = `${s.size}px Arial, sans-serif`;
        width = ctx.measureText(s.text).width;
      }
      return {
        minX: s.x,
        minY: s.y,
        maxX: s.x + width,
        maxY: s.y + s.size * 1.25,
      };
    }
    case "dot": {
      const r = dotRadius(s.width);
      return {
        minX: s.x2 - r,
        minY: s.y2 - r,
        maxX: s.x2 + r,
        maxY: s.y2 + r,
      };
    }
    default: {
      const pad =
        s.kind === "wave"
          ? waveAmplitude(s.width)
          : s.kind === "coil"
          ? coilRadius(s.width) * 2
          : 0;
      return {
        minX: Math.min(s.x1, s.x2) - pad,
        minY: Math.min(s.y1, s.y2) - pad,
        maxX: Math.max(s.x1, s.x2) + pad,
        maxY: Math.max(s.y1, s.y2) + pad,
      };
    }
  }
}

function hitTest(
  s: Shape,
  p: { x: number; y: number },
  ctx?: CanvasRenderingContext2D
): boolean {
  const tol = 12;
  // For rotated shapes, un-rotate the query point about the bbox center and
  // test against the unrotated geometry — exact for every kind
  if (s.rotation) {
    const b = shapeBBox(s, ctx);
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    const rad = (-s.rotation * Math.PI) / 180;
    const dx = p.x - cx;
    const dy = p.y - cy;
    p = {
      x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
    };
  }
  if (SEGMENT_KINDS.has(s.kind) && s.kind !== "text") {
    const seg = s as Extract<Shape, { x2: number }>;
    const pad =
      s.kind === "wave"
        ? waveAmplitude(seg.width)
        : s.kind === "coil"
        ? coilRadius(seg.width) * 2
        : seg.width;
    return distToSegment(p, seg.x1, seg.y1, seg.x2, seg.y2) <= tol + pad;
  }
  const b = shapeBBox(s, ctx);
  return (
    p.x >= b.minX - tol &&
    p.x <= b.maxX + tol &&
    p.y >= b.minY - tol &&
    p.y <= b.maxY + tol
  );
}

function translateShape(s: Shape, dx: number, dy: number): Shape {
  switch (s.kind) {
    case "pen":
    case "eraser":
      return {
        ...s,
        points: s.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
      };
    case "text":
      return { ...s, x: s.x + dx, y: s.y + dy };
    default:
      return {
        ...s,
        x1: s.x1 + dx,
        y1: s.y1 + dy,
        x2: s.x2 + dx,
        y2: s.y2 + dy,
      };
  }
}

// Scale any shape about its bbox center — geometry only, stroke width stays
function scaleShape(s: Shape, factor: number): Shape {
  const b = shapeBBox(s);
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  const sx = (v: number) => cx + (v - cx) * factor;
  const sy = (v: number) => cy + (v - cy) * factor;
  switch (s.kind) {
    case "pen":
    case "eraser":
      return { ...s, points: s.points.map((p) => ({ x: sx(p.x), y: sy(p.y) })) };
    case "text":
      return { ...s, x: sx(s.x), y: sy(s.y), size: Math.max(8, s.size * factor) };
    default:
      return { ...s, x1: sx(s.x1), y1: sy(s.y1), x2: sx(s.x2), y2: sy(s.y2) };
  }
}

// ---------- Drawing ----------

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  width: number
) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 14 + width * 2.5;
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - head * Math.cos(angle - Math.PI / 6),
    y2 - head * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - head * Math.cos(angle + Math.PI / 6),
    y2 - head * Math.sin(angle + Math.PI / 6)
  );
}

function drawShape(ctx: CanvasRenderingContext2D, s: Shape) {
  ctx.globalCompositeOperation =
    s.kind === "eraser" ? "destination-out" : "source-over";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = s.kind === "eraser" ? "#000" : s.color;
  ctx.setLineDash([]);

  // Any shape can be rotated about its bbox center
  const rot = s.rotation ?? 0;
  if (rot) {
    const b = shapeBBox(s);
    const rcx = (b.minX + b.maxX) / 2;
    const rcy = (b.minY + b.maxY) / 2;
    ctx.save();
    ctx.translate(rcx, rcy);
    ctx.rotate((rot * Math.PI) / 180);
    ctx.translate(-rcx, -rcy);
  }

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
    case "line":
    case "dashed": {
      ctx.lineWidth = s.width;
      if (s.kind === "dashed") ctx.setLineDash([s.width * 4, s.width * 3]);
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    }
    case "arrow":
    case "dblarrow": {
      ctx.lineWidth = s.width;
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y2);
      drawArrowHead(ctx, s.x1, s.y1, s.x2, s.y2, s.width);
      if (s.kind === "dblarrow") {
        drawArrowHead(ctx, s.x2, s.y2, s.x1, s.y1, s.width);
      }
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
      const amplitude = waveAmplitude(s.width);
      const wavelength = 36;
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      for (let d = 2; d <= len; d += 2) {
        const offset = amplitude * Math.sin((d / wavelength) * Math.PI * 2);
        ctx.lineTo(s.x1 + ux * d - uy * offset, s.y1 + uy * d + ux * offset);
      }
      ctx.stroke();
      break;
    }
    case "coil": {
      // looping prolate-cycloid — a gluon line for Feynman diagrams
      ctx.lineWidth = s.width;
      const dx = s.x2 - s.x1;
      const dy = s.y2 - s.y1;
      const len = Math.hypot(dx, dy);
      if (len < 2) break;
      const ux = dx / len;
      const uy = dy / len;
      const r = coilRadius(s.width);
      const A = r * 0.55; // advance per radian < r, so the curve loops
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      for (let th = 0; ; th += 0.15) {
        const along = A * th - r * Math.sin(th);
        if (along > len) break;
        const perp = r - r * Math.cos(th);
        ctx.lineTo(
          s.x1 + ux * along - uy * perp,
          s.y1 + uy * along + ux * perp
        );
      }
      ctx.stroke();
      break;
    }
    case "circle":
    case "disk": {
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
      if (s.fill) {
        ctx.fillStyle = s.color + "40";
        ctx.fill();
      }
      ctx.stroke();
      break;
    }
    case "rect": {
      ctx.lineWidth = s.width;
      const x = Math.min(s.x1, s.x2);
      const y = Math.min(s.y1, s.y2);
      const w = Math.abs(s.x2 - s.x1);
      const h = Math.abs(s.y2 - s.y1);
      if (s.fill) {
        ctx.fillStyle = s.color + "40";
        ctx.fillRect(x, y, w, h);
      }
      ctx.strokeRect(x, y, w, h);
      break;
    }
    case "triangle":
    case "rightTriangle":
    case "diamond":
    case "pentagon":
    case "hexagon":
    case "octagon":
    case "star":
    case "cross":
    case "lightning":
    case "parallelogram":
    case "trapezoid": {
      ctx.lineWidth = s.width;
      const pts = polygonPoints(s.kind, s.x1, s.y1, s.x2, s.y2);
      if (pts.length < 3) break;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.closePath();
      if (s.fill) {
        ctx.fillStyle = s.color + "40";
        ctx.fill();
      }
      ctx.stroke();
      break;
    }
    case "dot": {
      ctx.beginPath();
      ctx.arc(s.x2, s.y2, dotRadius(s.width), 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
      break;
    }
    case "axes": {
      ctx.lineWidth = s.width;
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x2, s.y1);
      drawArrowHead(ctx, s.x1, s.y1, s.x2, s.y1, s.width);
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x1, s.y2);
      drawArrowHead(ctx, s.x1, s.y1, s.x1, s.y2, s.width);
      ctx.stroke();
      // x / y labels at the arrow tips
      const fs = Math.max(14, s.width * 5);
      ctx.font = `italic ${fs}px Arial, sans-serif`;
      ctx.fillStyle = s.color;
      const xDir = Math.sign(s.x2 - s.x1) || 1;
      const yDir = Math.sign(s.y2 - s.y1) || 1;
      ctx.fillText("x", s.x2 + xDir * 8 - (xDir < 0 ? fs : 0), s.y1 + fs * 0.35);
      ctx.fillText("y", s.x1 + 10, s.y2 + yDir * 8 + (yDir > 0 ? fs * 0.8 : 0));
      break;
    }
    case "semicircle": {
      ctx.lineWidth = s.width;
      const minX = Math.min(s.x1, s.x2);
      const maxX = Math.max(s.x1, s.x2);
      const minY = Math.min(s.y1, s.y2);
      const maxY = Math.max(s.y1, s.y2);
      ctx.beginPath();
      // Dome: upper half-ellipse plus the base chord
      ctx.ellipse(
        (minX + maxX) / 2,
        maxY,
        Math.max(1, (maxX - minX) / 2),
        Math.max(1, maxY - minY),
        0,
        Math.PI,
        2 * Math.PI
      );
      ctx.closePath();
      if (s.fill) {
        ctx.fillStyle = s.color + "40";
        ctx.fill();
      }
      ctx.stroke();
      break;
    }
    case "ring": {
      ctx.lineWidth = s.width;
      const cx = (s.x1 + s.x2) / 2;
      const cy = (s.y1 + s.y2) / 2;
      const rx = Math.max(1, Math.abs(s.x2 - s.x1) / 2);
      const ry = Math.max(1, Math.abs(s.y2 - s.y1) / 2);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.moveTo(cx + rx * 0.55, cy);
      ctx.ellipse(cx, cy, rx * 0.55, ry * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case "torus": {
      // 3D doughnut — outer ellipse plus the classic "eye" arcs of the hole
      ctx.lineWidth = s.width;
      const cx = (s.x1 + s.x2) / 2;
      const cy = (s.y1 + s.y2) / 2;
      const rx = Math.max(1, Math.abs(s.x2 - s.x1) / 2);
      const ry = Math.max(1, Math.abs(s.y2 - s.y1) / 2);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(
        cx,
        cy - ry * 0.08,
        rx * 0.45,
        ry * 0.24,
        0,
        Math.PI * 0.1,
        Math.PI * 0.9
      );
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(
        cx,
        cy + ry * 0.06,
        rx * 0.3,
        ry * 0.14,
        0,
        Math.PI * 1.15,
        Math.PI * 1.85
      );
      ctx.stroke();
      break;
    }
    case "orbit": {
      // Circular motion: dashed orbit + tangent arrowhead + center dot
      ctx.lineWidth = s.width;
      const cx = (s.x1 + s.x2) / 2;
      const cy = (s.y1 + s.y2) / 2;
      const rx = Math.max(1, Math.abs(s.x2 - s.x1) / 2);
      const ry = Math.max(1, Math.abs(s.y2 - s.y1) / 2);
      ctx.setLineDash([s.width * 3, s.width * 2.5]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // Arrowhead at the top of the orbit, pointing in +x (motion direction)
      const ax = cx;
      const ay = cy - ry;
      ctx.beginPath();
      drawArrowHead(ctx, ax - 10, ay, ax + s.width * 2, ay, s.width);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(3, s.width * 1.2), 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
      break;
    }
    case "cylinder": {
      ctx.lineWidth = s.width;
      const minX = Math.min(s.x1, s.x2);
      const maxX = Math.max(s.x1, s.x2);
      const minY = Math.min(s.y1, s.y2);
      const maxY = Math.max(s.y1, s.y2);
      const cx = (minX + maxX) / 2;
      const rx = Math.max(1, (maxX - minX) / 2);
      const eh = Math.max(2, (maxY - minY) * 0.15);
      ctx.beginPath();
      ctx.ellipse(cx, minY + eh, rx, eh, 0, 0, Math.PI * 2);
      ctx.moveTo(minX, minY + eh);
      ctx.lineTo(minX, maxY - eh);
      ctx.moveTo(maxX, minY + eh);
      ctx.lineTo(maxX, maxY - eh);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, maxY - eh, rx, eh, 0, 0, Math.PI);
      ctx.stroke();
      break;
    }
    case "cube": {
      ctx.lineWidth = s.width;
      const minX = Math.min(s.x1, s.x2);
      const maxX = Math.max(s.x1, s.x2);
      const minY = Math.min(s.y1, s.y2);
      const maxY = Math.max(s.y1, s.y2);
      const d = Math.max(
        4,
        Math.min(maxX - minX, maxY - minY) * 0.25
      );
      ctx.beginPath();
      // Front face
      ctx.rect(minX, minY + d, maxX - d - minX, maxY - (minY + d));
      // Top face
      ctx.moveTo(minX, minY + d);
      ctx.lineTo(minX + d, minY);
      ctx.lineTo(maxX, minY);
      ctx.lineTo(maxX - d, minY + d);
      // Right face
      ctx.moveTo(maxX, minY);
      ctx.lineTo(maxX, maxY - d);
      ctx.lineTo(maxX - d, maxY);
      ctx.stroke();
      break;
    }
    case "heart": {
      ctx.lineWidth = s.width;
      const minX = Math.min(s.x1, s.x2);
      const maxX = Math.max(s.x1, s.x2);
      const minY = Math.min(s.y1, s.y2);
      const maxY = Math.max(s.y1, s.y2);
      const cx = (minX + maxX) / 2;
      const h = maxY - minY;
      ctx.beginPath();
      ctx.moveTo(cx, minY + 0.3 * h);
      ctx.bezierCurveTo(cx, minY, minX, minY, minX, minY + 0.35 * h);
      ctx.bezierCurveTo(minX, minY + 0.6 * h, cx, minY + 0.8 * h, cx, maxY);
      ctx.bezierCurveTo(cx, minY + 0.8 * h, maxX, minY + 0.6 * h, maxX, minY + 0.35 * h);
      ctx.bezierCurveTo(maxX, minY, cx, minY, cx, minY + 0.3 * h);
      ctx.closePath();
      if (s.fill) {
        ctx.fillStyle = s.color + "40";
        ctx.fill();
      }
      ctx.stroke();
      break;
    }
    case "cloud": {
      ctx.lineWidth = s.width;
      const minX = Math.min(s.x1, s.x2);
      const maxX = Math.max(s.x1, s.x2);
      const minY = Math.min(s.y1, s.y2);
      const maxY = Math.max(s.y1, s.y2);
      const w = Math.max(1, maxX - minX);
      const h = Math.max(1, maxY - minY);
      // Path drawn in a fixed 100x60 design space, scaled to the box;
      // restore before stroking keeps the line width uniform
      ctx.save();
      ctx.translate(minX, minY);
      ctx.scale(w / 100, h / 60);
      ctx.beginPath();
      ctx.moveTo(20, 58);
      ctx.bezierCurveTo(2, 58, 0, 40, 14, 36);
      ctx.bezierCurveTo(12, 20, 30, 12, 40, 20);
      ctx.bezierCurveTo(48, 4, 72, 6, 76, 22);
      ctx.bezierCurveTo(94, 22, 100, 38, 88, 50);
      ctx.bezierCurveTo(92, 58, 84, 60, 78, 58);
      ctx.closePath();
      ctx.restore();
      if (s.fill) {
        ctx.fillStyle = s.color + "40";
        ctx.fill();
      }
      ctx.stroke();
      break;
    }
    case "crescent": {
      ctx.lineWidth = s.width;
      const minX = Math.min(s.x1, s.x2);
      const maxX = Math.max(s.x1, s.x2);
      const minY = Math.min(s.y1, s.y2);
      const maxY = Math.max(s.y1, s.y2);
      const w = Math.max(1, maxX - minX);
      const h = Math.max(1, maxY - minY);
      ctx.save();
      ctx.translate(minX, minY);
      ctx.scale(w / 100, h / 100);
      ctx.beginPath();
      // Outer arc the long way round, inner arc back — moon opening right
      ctx.arc(50, 50, 48, 0.817, -0.817, false);
      ctx.arc(68, 50, 38, -1.167, 1.167, true);
      ctx.closePath();
      ctx.restore();
      ctx.stroke();
      break;
    }
    case "speechBubble": {
      ctx.lineWidth = s.width;
      const minX = Math.min(s.x1, s.x2);
      const maxX = Math.max(s.x1, s.x2);
      const minY = Math.min(s.y1, s.y2);
      const maxY = Math.max(s.y1, s.y2);
      const w = Math.max(1, maxX - minX);
      const h = Math.max(1, maxY - minY);
      const bodyH = h * 0.72;
      const r = Math.min(w, bodyH) * 0.2;
      ctx.beginPath();
      ctx.roundRect(minX, minY, w, bodyH, r);
      ctx.moveTo(minX + 0.2 * w, minY + bodyH);
      ctx.lineTo(minX + 0.15 * w, maxY);
      ctx.lineTo(minX + 0.38 * w, minY + bodyH);
      if (s.fill) {
        ctx.fillStyle = s.color + "40";
        ctx.fill();
      }
      ctx.stroke();
      break;
    }
    case "dipole": {
      // Bar magnet with the classic nested field-line loops: true circles
      // through both poles, mirrored above and below the axis
      ctx.lineWidth = Math.max(1.5, s.width * 0.7);
      const minX = Math.min(s.x1, s.x2);
      const maxX = Math.max(s.x1, s.x2);
      const minY = Math.min(s.y1, s.y2);
      const maxY = Math.max(s.y1, s.y2);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const rx = Math.max(1, (maxX - minX) / 2);
      const ry = Math.max(1, (maxY - minY) / 2);
      const d = rx * 0.3; // half pole separation
      for (const extent of [0.45, 0.72, 1]) {
        const e = ry * extent;
        if (e <= d) continue;
        const hOff = (e * e - d * d) / (2 * e);
        const r = Math.hypot(d, hOff);
        ctx.beginPath();
        ctx.arc(cx, cy - hOff, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy + hOff, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      // The bar magnet
      ctx.lineWidth = s.width;
      const barH = Math.max(6, ry * 0.16);
      ctx.fillStyle = s.color;
      ctx.fillRect(cx - d, cy - barH / 2, 2 * d, barH);
      break;
    }
    case "atom": {
      // Bohr model: nucleus + shells + electrons per aufbau filling
      const minX = Math.min(s.x1, s.x2);
      const maxX = Math.max(s.x1, s.x2);
      const minY = Math.min(s.y1, s.y2);
      const maxY = Math.max(s.y1, s.y2);
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const rMax = Math.max(10, Math.min(maxX - minX, maxY - minY) / 2);
      const z = s.atomZ ?? 1;
      const shells = bohrShells(z);
      const nucleusR = Math.max(9, rMax * 0.14);
      ctx.lineWidth = Math.max(1.5, s.width * 0.7);
      shells.forEach((count, i) => {
        const r = nucleusR + ((rMax - nucleusR) * (i + 1)) / shells.length;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
        const eR = Math.max(2.5, s.width * 0.9);
        for (let k = 0; k < count; k++) {
          const a = (k * 2 * Math.PI) / count - Math.PI / 2 + i * 0.4;
          ctx.beginPath();
          ctx.arc(cx + r * Math.cos(a), cy + r * Math.sin(a), eR, 0, Math.PI * 2);
          ctx.fillStyle = s.color;
          ctx.fill();
        }
      });
      ctx.beginPath();
      ctx.arc(cx, cy, nucleusR, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
      const symbol = ELEMENT_SYMBOLS[z - 1];
      if (symbol) {
        ctx.font = `bold ${Math.round(nucleusR * 0.95)}px Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(symbol, cx, cy);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
      }
      break;
    }
    case "zigzag": {
      // Resistor / spring: straight leads with a zigzag middle
      ctx.lineWidth = s.width;
      const dx = s.x2 - s.x1;
      const dy = s.y2 - s.y1;
      const len = Math.hypot(dx, dy);
      if (len < 4) break;
      const ux = dx / len;
      const uy = dy / len;
      const px = -uy;
      const py = ux;
      const amp = 8 + s.width * 2;
      const lead = Math.min(0.15 * len, 30);
      const inner = len - 2 * lead;
      const segments = Math.max(4, Math.round(inner / 16));
      ctx.beginPath();
      ctx.moveTo(s.x1, s.y1);
      ctx.lineTo(s.x1 + ux * lead, s.y1 + uy * lead);
      for (let i = 0; i < segments; i++) {
        const dAlong = lead + (inner * (i + 0.5)) / segments;
        const sign = i % 2 === 0 ? 1 : -1;
        ctx.lineTo(
          s.x1 + ux * dAlong + px * amp * sign,
          s.y1 + uy * dAlong + py * amp * sign
        );
      }
      ctx.lineTo(s.x1 + ux * (len - lead), s.y1 + uy * (len - lead));
      ctx.lineTo(s.x2, s.y2);
      ctx.stroke();
      break;
    }
    case "dotted": {
      const dx = s.x2 - s.x1;
      const dy = s.y2 - s.y1;
      const len = Math.hypot(dx, dy);
      if (len < 2) break;
      const ux = dx / len;
      const uy = dy / len;
      const r = Math.max(1.5, s.width * 0.8);
      const spacing = r * 5;
      ctx.fillStyle = s.color;
      for (let d = 0; d <= len; d += spacing) {
        ctx.beginPath();
        ctx.arc(s.x1 + ux * d, s.y1 + uy * d, r, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "graph": {
      const minX = Math.min(s.x1, s.x2);
      const maxX = Math.max(s.x1, s.x2);
      const minY = Math.min(s.y1, s.y2);
      const maxY = Math.max(s.y1, s.y2);
      const w = maxX - minX;
      const h = maxY - minY;
      if (w < 20 || h < 20) break;

      // Sample f(x); non-finite samples (asymptotes like Coulomb -1/x)
      // become gaps rather than vertical spikes
      const N = 240;
      const ys: (number | null)[] = [];
      const finite: number[] = [];
      for (let i = 0; i <= N; i++) {
        const xv = s.xMin + (i / N) * (s.xMax - s.xMin);
        let yv: number | null = null;
        try {
          const v = evaluateExpression(s.expr, "rad", { x: xv });
          if (isFinite(v)) {
            yv = v;
            finite.push(v);
          }
        } catch {
          yv = null;
        }
        ys.push(yv);
      }
      if (finite.length === 0) break;

      // Robust y-range: trim the extreme 2% so singularities don't
      // flatten the interesting part of the curve
      finite.sort((a, b) => a - b);
      let yMin = finite[Math.floor(finite.length * 0.02)];
      let yMax = finite[Math.min(finite.length - 1, Math.ceil(finite.length * 0.98))];
      if (yMax - yMin < 1e-9) {
        yMin -= 1;
        yMax += 1;
      }
      const yPad = (yMax - yMin) * 0.08;
      yMin -= yPad;
      yMax += yPad;

      const px = (xv: number) => minX + ((xv - s.xMin) / (s.xMax - s.xMin)) * w;
      const py = (yv: number) => maxY - ((yv - yMin) / (yMax - yMin)) * h;

      // Axes in neutral gray, at zero when zero is in range
      const axisY = 0 >= yMin && 0 <= yMax ? py(0) : maxY;
      const axisX = 0 >= s.xMin && 0 <= s.xMax ? px(0) : minX;
      ctx.save();
      ctx.strokeStyle = "#9ca3af";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(minX, axisY);
      ctx.lineTo(maxX, axisY);
      ctx.moveTo(axisX, minY);
      ctx.lineTo(axisX, maxY);
      ctx.stroke();

      // Range labels
      const fmt = (n: number) => String(parseFloat(n.toPrecision(3)));
      ctx.fillStyle = "#6b7280";
      ctx.font = "14px Arial, sans-serif";
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.fillText(fmt(s.xMin), minX + 2, Math.min(axisY + 4, maxY - 16));
      ctx.textAlign = "right";
      ctx.fillText(fmt(s.xMax), maxX - 2, Math.min(axisY + 4, maxY - 16));
      ctx.textAlign = "left";
      ctx.fillText(fmt(yMax), Math.min(axisX + 4, maxX - 44), minY + 2);
      ctx.textBaseline = "bottom";
      ctx.fillText(fmt(yMin), Math.min(axisX + 4, maxX - 44), maxY - 2);
      ctx.restore();

      // The curve
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.beginPath();
      let penDown = false;
      for (let i = 0; i <= N; i++) {
        const yv = ys[i];
        if (yv == null || yv < yMin || yv > yMax) {
          penDown = false;
          continue;
        }
        const X = px(s.xMin + (i / N) * (s.xMax - s.xMin));
        const Y = py(yv);
        if (!penDown) {
          ctx.moveTo(X, Y);
          penDown = true;
        } else {
          ctx.lineTo(X, Y);
        }
      }
      ctx.stroke();
      break;
    }
    case "text": {
      ctx.font = `${s.size}px Arial, sans-serif`;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.fillStyle = s.color;
      ctx.fillText(s.text, s.x, s.y);
      break;
    }
  }
  if (rot) ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}

function drawAllShapes(
  ctx: CanvasRenderingContext2D,
  shapes: Shape[],
  temp?: Shape | null,
  selectedIdx?: number | null
) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const s of shapes) drawShape(ctx, s);
  if (temp) drawShape(ctx, temp);
  if (selectedIdx != null && shapes[selectedIdx]) {
    const sel = shapes[selectedIdx];
    const b = shapeBBox(sel, ctx);
    ctx.save();
    if (sel.rotation) {
      const cx = (b.minX + b.maxX) / 2;
      const cy = (b.minY + b.maxY) / 2;
      ctx.translate(cx, cy);
      ctx.rotate((sel.rotation * Math.PI) / 180);
      ctx.translate(-cx, -cy);
    }
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    ctx.strokeRect(b.minX - 8, b.minY - 8, b.maxX - b.minX + 16, b.maxY - b.minY + 16);
    ctx.restore();
  }
}

// ---------- Custom icons (shapes lucide doesn't have) ----------

const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "w-4 h-4",
};

const DashedLineIcon = () => (
  <svg {...svgProps}>
    <line x1="3" y1="12" x2="21" y2="12" strokeDasharray="4 3" />
  </svg>
);
const ParallelogramIcon = () => (
  <svg {...svgProps}>
    <path d="M8 6h13l-5 12H3z" />
  </svg>
);
const TrapezoidIcon = () => (
  <svg {...svgProps}>
    <path d="M9 6h6l6 12H3z" />
  </svg>
);
const AxesIcon = () => (
  <svg {...svgProps}>
    <path d="M5 21V5m0 16h16M5 5l-2.5 3M5 5l2.5 3M21 21l-3-2.5m3 2.5-2.5-3" />
  </svg>
);
const SemicircleIcon = () => (
  <svg {...svgProps}>
    <path d="M3 17a9 9 0 0 1 18 0Z" />
  </svg>
);
const RightTriangleIcon = () => (
  <svg {...svgProps}>
    <path d="M5 4v16h16Z" />
  </svg>
);
const RingIcon = () => (
  <svg {...svgProps}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);
const ZigzagIcon = () => (
  <svg {...svgProps}>
    <path d="M2 12h3l2-5 3 10 3-10 3 10 2-5h4" />
  </svg>
);
const DottedLineIcon = () => (
  <svg {...svgProps}>
    <line x1="3" y1="12" x2="21" y2="12" strokeDasharray="0.5 4.5" strokeWidth="3" />
  </svg>
);

// ---------- Component ----------

type HistoryState = { past: Shape[][]; present: Shape[]; future: Shape[][] };

const GRAPH_PRESETS: {
  key: string;
  expr: string;
  from: string;
  to: string;
}[] = [
  { key: "squareWell", expr: "-4*(step(x+2)-step(x-2))", from: "-5", to: "5" },
  { key: "coulomb", expr: "-1/x", from: "0.05", to: "8" },
  { key: "harmonic", expr: "x^2/2", from: "-4", to: "4" },
  { key: "gaussian", expr: "e^(-x^2)", from: "-3", to: "3" },
  { key: "sine", expr: "sin(x)", from: "-2pi", to: "2pi" },
];

export default function SketchBoard() {
  const { t, locale } = useTranslation();

  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: [],
    future: [],
  });
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(WIDTHS[1]);
  const [fillMode, setFillMode] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showShapesMenu, setShowShapesMenu] = useState(false);
  const [pendingText, setPendingText] = useState<{
    x: number;
    y: number;
    value: string;
  } | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [calcPos, setCalcPos] = useState({ x: 0, y: 0 });
  const calcDragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showEqDialog, setShowEqDialog] = useState(false);
  const [eqSearch, setEqSearch] = useState("");
  const [showAtomDialog, setShowAtomDialog] = useState(false);
  const [atomSearch, setAtomSearch] = useState("");
  const [graphExpr, setGraphExpr] = useState("sin(x)");
  const [graphFrom, setGraphFrom] = useState("-2pi");
  const [graphTo, setGraphTo] = useState("2pi");
  const [graphError, setGraphError] = useState(false);
  const [boardWidth, setBoardWidth] = useState(800);
  const [boardH, setBoardH] = useState(BASE_H);
  const [zoom, setZoom] = useState(1);

  const shapes = history.present;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const shapesMenuRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef<Shape | null>(null);
  const moveRef = useRef<{
    idx: number;
    start: { x: number; y: number };
    working: Shape;
    moved: boolean;
  } | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  // Every mutation goes through commit → full snapshot undo/redo (adds,
  // moves, deletions, and clear are all undoable)
  const commit = useCallback((next: Shape[]) => {
    setHistory((h) => ({
      past: [...h.past.slice(-(HISTORY_LIMIT - 1)), h.present],
      present: next,
      future: [],
    }));
  }, []);

  const undo = useCallback(() => {
    setSelectedIdx(null);
    setHistory((h) =>
      h.past.length
        ? {
            past: h.past.slice(0, -1),
            present: h.past[h.past.length - 1],
            future: [h.present, ...h.future],
          }
        : h
    );
  }, []);

  const redo = useCallback(() => {
    setSelectedIdx(null);
    setHistory((h) =>
      h.future.length
        ? {
            past: [...h.past, h.present],
            present: h.future[0],
            future: h.future.slice(1),
          }
        : h
    );
  }, []);

  // Restore autosaved drawing once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { shapes?: Shape[]; boardH?: number };
      if (Array.isArray(saved.shapes) && saved.shapes.length > 0) {
        setHistory({ past: [], present: saved.shapes, future: [] });
        if (typeof saved.boardH === "number" && saved.boardH >= BASE_H) {
          setBoardH(saved.boardH);
        }
      }
    } catch {
      // corrupt autosave — start fresh
    }
  }, []);

  // Autosave — the drawing survives tab switches and browser restarts
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ shapes, boardH }));
    } catch {
      // storage full or unavailable — drawing still works, just not persisted
    }
  }, [shapes, boardH]);

  // Redraw whenever committed shapes or selection change (or the canvas
  // grows, which resets the bitmap)
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawAllShapes(ctx, shapes, null, selectedIdx);
  }, [shapes, boardH, selectedIdx]);

  // Track displayed width so text entry and floating buttons scale with zoom
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setBoardWidth(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Close the shapes menu on outside click
  useEffect(() => {
    if (!showShapesMenu) return;
    const onDown = (e: MouseEvent) => {
      if (!shapesMenuRef.current?.contains(e.target as Node)) {
        setShowShapesMenu(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [showShapesMenu]);

  const deleteSelected = useCallback(() => {
    if (selectedIdx == null) return;
    commit(shapes.filter((_, i) => i !== selectedIdx));
    setSelectedIdx(null);
  }, [selectedIdx, shapes, commit]);

  // Universal transform of the selected shape — undoable via commit
  const modifySelected = useCallback(
    (fn: (s: Shape) => Shape) => {
      if (selectedIdx == null) return;
      commit(shapes.map((s, i) => (i === selectedIdx ? fn(s) : s)));
    },
    [selectedIdx, shapes, commit]
  );

  const scaleSelected = (factor: number) =>
    modifySelected((s) => scaleShape(s, factor));

  const rotateSelected = (delta: number) =>
    modifySelected((s) => ({
      ...s,
      rotation: (((s.rotation ?? 0) + delta) % 360 + 360) % 360,
    }));

  const insertEquation = (formula: string) => {
    const size = textSizeForWidth(strokeWidth) + 8;
    const estWidth = formula.length * size * 0.5;
    const shape: Shape = {
      kind: "text",
      x: Math.max(40, W / 2 - estWidth / 2),
      y: 380,
      text: formula,
      color,
      size,
    };
    commit([...shapes, shape]);
    setSelectedIdx(shapes.length);
    setTool("select");
    setShowEqDialog(false);
  };

  const insertAtom = (z: number) => {
    const r = 190;
    const shape: Shape = {
      kind: "atom",
      x1: W / 2 - r,
      y1: 460 - r,
      x2: W / 2 + r,
      y2: 460 + r,
      color,
      width: strokeWidth,
      atomZ: z,
    };
    commit([...shapes, shape]);
    setSelectedIdx(shapes.length);
    setTool("select");
    setShowAtomDialog(false);
  };

  // Keyboard: Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y, Delete removes selection,
  // Escape deselects
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
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIdx != null) {
          e.preventDefault();
          deleteSelected();
        }
      } else if (e.key === "Escape") {
        setSelectedIdx(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, selectedIdx, deleteSelected]);

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
      commit([
        ...shapes,
        {
          kind: "text",
          x: pendingText.x,
          y: pendingText.y,
          text: pendingText.value,
          color,
          size: textSizeForWidth(strokeWidth),
        },
      ]);
    }
    setPendingText(null);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (pendingText) {
      commitPendingText();
      return;
    }
    const pos = getPos(e);

    if (tool === "select") {
      const ctx = canvasRef.current?.getContext("2d") ?? undefined;
      let hit: number | null = null;
      for (let i = shapes.length - 1; i >= 0; i--) {
        if (hitTest(shapes[i], pos, ctx)) {
          hit = i;
          break;
        }
      }
      setSelectedIdx(hit);
      if (hit != null) {
        e.currentTarget.setPointerCapture(e.pointerId);
        moveRef.current = {
          idx: hit,
          start: pos,
          working: shapes[hit],
          moved: false,
        };
      }
      return;
    }

    setSelectedIdx(null);
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
        fill: fillMode && CLOSED_KINDS.has(tool),
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const move = moveRef.current;
    if (move) {
      const pos = getPos(e);
      const dx = pos.x - move.start.x;
      const dy = pos.y - move.start.y;
      move.working = translateShape(shapes[move.idx], dx, dy);
      move.moved = move.moved || Math.hypot(dx, dy) > 2;
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        const preview = shapes.map((s, i) =>
          i === move.idx ? move.working : s
        );
        drawAllShapes(ctx, preview, null, move.idx);
      }
      return;
    }

    const current = drawingRef.current;
    if (!current) return;
    const pos = getPos(e);
    if (current.kind === "pen" || current.kind === "eraser") {
      current.points.push(pos);
    } else if (current.kind !== "text") {
      const shape = current as Extract<Shape, { x2: number }>;
      shape.x2 = pos.x;
      shape.y2 = pos.y;
      // "disk" is always a perfect circle; Shift constrains ellipse/rect
      // to circle/square (drag distance = the larger axis)
      if (
        current.kind === "disk" ||
        (e.shiftKey && (current.kind === "circle" || current.kind === "rect"))
      ) {
        const dx = pos.x - shape.x1;
        const dy = pos.y - shape.y1;
        const side = Math.max(Math.abs(dx), Math.abs(dy));
        shape.x2 = shape.x1 + Math.sign(dx || 1) * side;
        shape.y2 = shape.y1 + Math.sign(dy || 1) * side;
      }
    }
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawAllShapes(ctx, shapes, current);
  };

  const handlePointerUp = () => {
    const move = moveRef.current;
    if (move) {
      moveRef.current = null;
      if (move.moved) {
        commit(shapes.map((s, i) => (i === move.idx ? move.working : s)));
      }
      return;
    }
    const current = drawingRef.current;
    drawingRef.current = null;
    if (current) commit([...shapes, current]);
  };

  const insertGraph = () => {
    setGraphError(false);
    let xMin: number;
    let xMax: number;
    try {
      xMin = evaluateExpression(graphFrom, "rad");
      xMax = evaluateExpression(graphTo, "rad");
    } catch {
      setGraphError(true);
      return;
    }
    if (!isFinite(xMin) || !isFinite(xMax) || xMax <= xMin) {
      setGraphError(true);
      return;
    }
    // The function must produce at least one finite value in range
    let ok = false;
    for (let i = 0; i <= 20; i++) {
      const xv = xMin + (i / 20) * (xMax - xMin);
      try {
        if (isFinite(evaluateExpression(graphExpr, "rad", { x: xv }))) {
          ok = true;
          break;
        }
      } catch {
        // keep sampling
      }
    }
    if (!ok) {
      setGraphError(true);
      return;
    }
    const gw = 560;
    const gh = 380;
    commit([
      ...shapes,
      {
        kind: "graph",
        x1: W / 2 - gw / 2,
        y1: 180,
        x2: W / 2 + gw / 2,
        y2: 180 + gh,
        color,
        width: strokeWidth,
        expr: graphExpr,
        xMin,
        xMax,
      },
    ]);
    setSelectedIdx(shapes.length);
    setTool("select");
    setShowGraphModal(false);
  };

  const downloadPng = () => {
    const off = document.createElement("canvas");
    off.width = W;
    off.height = boardH;
    const offCtx = off.getContext("2d");
    if (!offCtx) return;
    drawAllShapes(offCtx, shapes);
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

  // Rail groups: core tools, then physics lines — fixed homes for muscle memory
  const railGroups: { key: Tool; icon: React.ReactNode; label: string }[][] = [
    [
      { key: "select", icon: <MousePointer2 className="w-4 h-4" />, label: t("sketchBoard.select") },
      { key: "pen", icon: <Pencil className="w-4 h-4" />, label: t("sketchBoard.pen") },
      { key: "eraser", icon: <Eraser className="w-4 h-4" />, label: t("sketchBoard.eraser") },
      { key: "text", icon: <Type className="w-4 h-4" />, label: t("sketchBoard.text") },
    ],
    [
      { key: "line", icon: <Slash className="w-4 h-4" />, label: t("sketchBoard.line") },
      { key: "arrow", icon: <MoveUpRight className="w-4 h-4" />, label: t("sketchBoard.arrow") },
      { key: "wave", icon: <Waves className="w-4 h-4" />, label: t("sketchBoard.wave") },
    ],
  ];

  const railBtn = (isActive: boolean) =>
    `w-16 sm:w-full flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg text-[10px] font-medium leading-tight transition-colors cursor-pointer ${
      isActive
        ? "bg-blue-600 text-white shadow-sm"
        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
    }`;

  const shapeMenuItems: { key: Tool; icon: React.ReactNode; label: string }[] = [
    { key: "rect", icon: <Square className="w-4 h-4" />, label: t("sketchBoard.rect") },
    { key: "circle", icon: <Circle className="w-4 h-4" />, label: t("sketchBoard.circle") },
    { key: "disk", icon: <Disc className="w-4 h-4" />, label: t("sketchBoard.disk") },
    { key: "semicircle", icon: <SemicircleIcon />, label: t("sketchBoard.semicircle") },
    { key: "triangle", icon: <Triangle className="w-4 h-4" />, label: t("sketchBoard.triangle") },
    { key: "rightTriangle", icon: <RightTriangleIcon />, label: t("sketchBoard.rightTriangle") },
    { key: "diamond", icon: <Diamond className="w-4 h-4" />, label: t("sketchBoard.diamond") },
    { key: "pentagon", icon: <Pentagon className="w-4 h-4" />, label: t("sketchBoard.pentagon") },
    { key: "hexagon", icon: <Hexagon className="w-4 h-4" />, label: t("sketchBoard.hexagon") },
    { key: "octagon", icon: <Octagon className="w-4 h-4" />, label: t("sketchBoard.octagon") },
    { key: "star", icon: <Star className="w-4 h-4" />, label: t("sketchBoard.star") },
    { key: "cross", icon: <Cross className="w-4 h-4" />, label: t("sketchBoard.cross") },
    { key: "parallelogram", icon: <ParallelogramIcon />, label: t("sketchBoard.parallelogram") },
    { key: "trapezoid", icon: <TrapezoidIcon />, label: t("sketchBoard.trapezoid") },
    { key: "ring", icon: <RingIcon />, label: t("sketchBoard.ring") },
    { key: "torus", icon: <Moon className="w-4 h-4 rotate-45" />, label: t("sketchBoard.torus") },
    { key: "orbit", icon: <OrbitIcon className="w-4 h-4" />, label: t("sketchBoard.orbit") },
    { key: "cylinder", icon: <Cylinder className="w-4 h-4" />, label: t("sketchBoard.cylinder") },
    { key: "cube", icon: <Box className="w-4 h-4" />, label: t("sketchBoard.cube") },
    { key: "dipole", icon: <Magnet className="w-4 h-4" />, label: t("sketchBoard.dipole") },
    { key: "lightning", icon: <Zap className="w-4 h-4" />, label: t("sketchBoard.lightning") },
    { key: "heart", icon: <Heart className="w-4 h-4" />, label: t("sketchBoard.heart") },
    { key: "cloud", icon: <Cloud className="w-4 h-4" />, label: t("sketchBoard.cloud") },
    { key: "crescent", icon: <Moon className="w-4 h-4" />, label: t("sketchBoard.crescent") },
    { key: "speechBubble", icon: <MessageSquare className="w-4 h-4" />, label: t("sketchBoard.speechBubble") },
    { key: "dashed", icon: <DashedLineIcon />, label: t("sketchBoard.dashed") },
    { key: "dotted", icon: <DottedLineIcon />, label: t("sketchBoard.dotted") },
    { key: "zigzag", icon: <ZigzagIcon />, label: t("sketchBoard.zigzag") },
    { key: "dblarrow", icon: <MoveHorizontal className="w-4 h-4" />, label: t("sketchBoard.dblarrow") },
    { key: "coil", icon: <Shell className="w-4 h-4" />, label: t("sketchBoard.coil") },
    { key: "dot", icon: <CircleDot className="w-4 h-4" />, label: t("sketchBoard.dot") },
    { key: "axes", icon: <AxesIcon />, label: t("sketchBoard.axes") },
  ];

  const activeShapeItem = shapeMenuItems.find((s) => s.key === tool);

  const actionBtn =
    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed";

  const toolBtnActive = "bg-blue-600 text-white shadow-sm";
  const toolBtnIdle =
    "border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600";

  const selectedBBox =
    selectedIdx != null && shapes[selectedIdx]
      ? shapeBBox(shapes[selectedIdx])
      : null;

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
          commit([]);
          setSelectedIdx(null);
          setBoardH(BASE_H);
          setShowClearModal(false);
        }}
      />

      {/* Equation archive dialog */}
      {showEqDialog && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowEqDialog(false)}
            aria-hidden="true"
          />
          <div
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            <div className="p-5 pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <Sigma className="w-5 h-5 text-blue-500" />
                {t("sketchBoard.equationsTitle")}
                <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
                  ({TOTAL_EQUATIONS})
                </span>
              </h3>
              <input
                type="text"
                value={eqSearch}
                onChange={(e) => setEqSearch(e.target.value)}
                placeholder={t("sketchBoard.equationsSearch")}
                dir="auto"
                autoFocus
                className="mt-3 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {EQUATION_CATEGORIES.map((cat) => {
                const q = eqSearch.trim().toLowerCase();
                const items = q
                  ? cat.equations.filter(
                      (eq) =>
                        eq.formula.toLowerCase().includes(q) ||
                        eq.nameEn.toLowerCase().includes(q) ||
                        eq.nameHe.includes(eqSearch.trim())
                    )
                  : cat.equations;
                if (items.length === 0) return null;
                return (
                  <div key={cat.key} className="mb-3">
                    <div className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                      {locale === "he" ? cat.labelHe : cat.labelEn}
                    </div>
                    {items.map((eq) => (
                      <button
                        key={eq.formula}
                        type="button"
                        onClick={() => insertEquation(eq.formula)}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-start hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                      >
                        <span
                          dir="ltr"
                          className="font-mono text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap overflow-x-auto"
                        >
                          {eq.formula}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 max-w-[40%] truncate">
                          {locale === "he" ? eq.nameHe : eq.nameEn}
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bohr atom picker */}
      {showAtomDialog && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowAtomDialog(false)}
            aria-hidden="true"
          />
          <div
            className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            <div className="p-5 pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <AtomIcon className="w-5 h-5 text-blue-500" />
                {t("sketchBoard.atomTitle")}
              </h3>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                {t("sketchBoard.atomHint")}
              </p>
              <input
                type="text"
                value={atomSearch}
                onChange={(e) => setAtomSearch(e.target.value)}
                placeholder={t("sketchBoard.atomSearch")}
                dir="ltr"
                autoFocus
                className="mt-3 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5" dir="ltr">
                {ELEMENT_SYMBOLS.map((symbol, i) => {
                  const z = i + 1;
                  const q = atomSearch.trim().toLowerCase();
                  if (
                    q &&
                    !symbol.toLowerCase().startsWith(q) &&
                    String(z) !== q
                  ) {
                    return null;
                  }
                  return (
                    <button
                      key={symbol}
                      type="button"
                      onClick={() => insertAtom(z)}
                      className="flex flex-col items-center py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                      title={`${symbol} (Z=${z})`}
                    >
                      <span className="text-[9px] text-gray-400 dark:text-gray-500 leading-none">
                        {z}
                      </span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                        {symbol}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insert-graph dialog */}
      <Modal
        isOpen={showGraphModal}
        onClose={() => setShowGraphModal(false)}
        title={t("sketchBoard.graphTitle")}
        hideFooter
      >
        <div className="space-y-4">
          {/* Ready-made physics presets */}
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
              {t("sketchBoard.graphPresets")}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {GRAPH_PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => {
                    setGraphExpr(p.expr);
                    setGraphFrom(p.from);
                    setGraphTo(p.to);
                    setGraphError(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                    graphExpr === p.expr
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {t(`sketchBoard.presets.${p.key}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("sketchBoard.graphExpr")}
            </label>
            <input
              type="text"
              dir="ltr"
              value={graphExpr}
              onChange={(e) => {
                setGraphExpr(e.target.value);
                setGraphError(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && insertGraph()}
              className="w-full px-3 py-2 font-mono text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {t("sketchBoard.graphHint")}
            </p>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("sketchBoard.graphFrom")}
              </label>
              <input
                type="text"
                dir="ltr"
                value={graphFrom}
                onChange={(e) => {
                  setGraphFrom(e.target.value);
                  setGraphError(false);
                }}
                className="w-full px-3 py-2 font-mono text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("sketchBoard.graphTo")}
              </label>
              <input
                type="text"
                dir="ltr"
                value={graphTo}
                onChange={(e) => {
                  setGraphTo(e.target.value);
                  setGraphError(false);
                }}
                className="w-full px-3 py-2 font-mono text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {graphError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {t("sketchBoard.graphError")}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowGraphModal(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              {t("sketchBoard.cancel")}
            </button>
            <button
              type="button"
              onClick={insertGraph}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
            >
              {t("sketchBoard.graphInsert")}
            </button>
          </div>
        </div>
      </Modal>

    

      <div className="space-y-4">
          {/* Toolbar — sticky below the admin header so tools stay reachable
              while scrolling a tall board */}
          <div className="sticky top-20 z-20 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              {/* Colors + fill */}
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
                <button
                  type="button"
                  onClick={() => setFillMode((f) => !f)}
                  className={`ms-1 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                    fillMode
                      ? "bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-500 text-blue-700 dark:text-blue-300"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  title={t("sketchBoard.fill")}
                  aria-label={t("sketchBoard.fill")}
                  aria-pressed={fillMode}
                >
                  <PaintBucket className="w-4 h-4" />
                </button>
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
                <button
                  type="button"
                  onClick={() => setShowCalc((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    showCalc ? toolBtnActive : toolBtnIdle
                  }`}
                  title={t("sketchBoard.toggleCalc")}
                  aria-pressed={showCalc}
                >
                  <CalculatorIcon className="w-4 h-4" />
                  <span className="hidden lg:inline">
                    {t("sketchBoard.toggleCalc")}
                  </span>
                </button>
                <button type="button" onClick={undo} disabled={history.past.length === 0} className={actionBtn} title={t("sketchBoard.undo")}>
                  <Undo2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={redo} disabled={history.future.length === 0} className={actionBtn} title={t("sketchBoard.redo")}>
                  <Redo2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => setShowClearModal(true)} disabled={shapes.length === 0} className={`${actionBtn} hover:!text-red-600 dark:hover:!text-red-400`} title={t("sketchBoard.clear")}>
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={downloadPng}
                  disabled={shapes.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  {t("sketchBoard.downloadPng")}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start gap-3">
            {/* Tool rail — every tool always visible with a permanent home,
                so muscle memory can form. Horizontal strip on mobile. */}
            {/* z-30 lifts the rail's stacking context above the sticky
                toolbar (z-20) so the shapes popover isn't covered by it */}
            <div className="w-full sm:w-[92px] flex-shrink-0 sm:sticky sm:top-40 z-30 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 shadow-sm">
              <div className="flex flex-row flex-wrap sm:flex-col gap-1 items-stretch">
                {railGroups.map((group, gi) => (
                  <React.Fragment key={gi}>
                    {gi > 0 && (
                      <div className="hidden sm:block h-px w-full bg-gray-200 dark:bg-gray-700 my-1" />
                    )}
                    {group.map(({ key, icon, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setTool(key)}
                        className={railBtn(tool === key)}
                        title={label}
                      >
                        {icon}
                        <span className="truncate max-w-full">{label}</span>
                      </button>
                    ))}
                  </React.Fragment>
                ))}
                <div className="hidden sm:block h-px w-full bg-gray-200 dark:bg-gray-700 my-1" />
                {/* Shapes gallery */}
                <div className="relative" ref={shapesMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowShapesMenu((v) => !v)}
                    className={railBtn(!!activeShapeItem)}
                    title={t("sketchBoard.shapes")}
                    aria-expanded={showShapesMenu}
                    aria-haspopup="menu"
                  >
                    {activeShapeItem ? (
                      activeShapeItem.icon
                    ) : (
                      <ShapesIcon className="w-4 h-4" />
                    )}
                    <span className="flex items-center gap-0.5 truncate max-w-full">
                      {activeShapeItem?.label ?? t("sketchBoard.shapes")}
                      <ChevronDown className="w-3 h-3 flex-shrink-0" />
                    </span>
                  </button>
                  {showShapesMenu && (
                    <div
                      role="menu"
                      className="absolute z-40 grid grid-cols-2 gap-1 p-2 w-80 max-h-[75vh] overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl top-full mt-1 start-0 sm:top-0 sm:mt-0 sm:start-full sm:ms-2"
                    >
                      {shapeMenuItems.map(({ key, icon, label }) => (
                        <button
                          key={key}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setTool(key);
                            setShowShapesMenu(false);
                          }}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-start transition-colors cursor-pointer ${
                            tool === key
                              ? "bg-blue-600 text-white"
                              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}
                          title={label}
                        >
                          <span className="flex-shrink-0">{icon}</span>
                          <span className="truncate">{label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Function graph */}
                <button
                  type="button"
                  onClick={() => {
                    setGraphError(false);
                    setShowGraphModal(true);
                  }}
                  className={railBtn(false)}
                  title={t("sketchBoard.graph")}
                >
                  <ChartSpline className="w-4 h-4" />
                  <span className="truncate max-w-full">
                    {t("sketchBoard.graph")}
                  </span>
                </button>
                {/* Equation archive */}
                <button
                  type="button"
                  onClick={() => {
                    setEqSearch("");
                    setShowEqDialog(true);
                  }}
                  className={railBtn(false)}
                  title={t("sketchBoard.equations")}
                >
                  <Sigma className="w-4 h-4" />
                  <span className="truncate max-w-full">
                    {t("sketchBoard.equations")}
                  </span>
                </button>
                {/* Bohr atom */}
                <button
                  type="button"
                  onClick={() => {
                    setAtomSearch("");
                    setShowAtomDialog(true);
                  }}
                  className={railBtn(false)}
                  title={t("sketchBoard.atom")}
                >
                  <AtomIcon className="w-4 h-4" />
                  <span className="truncate max-w-full">
                    {t("sketchBoard.atom")}
                  </span>
                </button>
              </div>
            </div>

            <div className="flex-1 min-w-0 w-full">
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
                  tool === "select"
                    ? "cursor-default"
                    : tool === "text"
                    ? "cursor-text"
                    : "cursor-crosshair"
                }`}
              />
              {/* Floating transform toolbar for the selected shape —
                  resize, rotate, delete: works on every kind of shape */}
              {selectedBBox && tool === "select" && (
                <div
                  className="absolute z-20 -translate-y-full flex items-center gap-0.5 rounded-lg bg-gray-900 dark:bg-gray-700 text-white shadow-lg px-1 py-0.5"
                  style={{
                    left: `${(clamp((selectedBBox.minX + selectedBBox.maxX) / 2 - 120, 8, W - 260) / W) * 100}%`,
                    top: `${(Math.max(selectedBBox.minY - 16, 40) / boardH) * 100}%`,
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => scaleSelected(0.87)}
                    className="p-1.5 rounded hover:bg-gray-700 dark:hover:bg-gray-600 cursor-pointer"
                    title={t("sketchBoard.shrinkShape")}
                    aria-label={t("sketchBoard.shrinkShape")}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scaleSelected(1.15)}
                    className="p-1.5 rounded hover:bg-gray-700 dark:hover:bg-gray-600 cursor-pointer"
                    title={t("sketchBoard.growShape")}
                    aria-label={t("sketchBoard.growShape")}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <span className="w-px h-4 bg-gray-600 mx-0.5" />
                  <button
                    type="button"
                    onClick={() => rotateSelected(-15)}
                    className="p-1.5 rounded hover:bg-gray-700 dark:hover:bg-gray-600 cursor-pointer"
                    title={t("sketchBoard.rotateShapeLeft")}
                    aria-label={t("sketchBoard.rotateShapeLeft")}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateSelected(15)}
                    className="p-1.5 rounded hover:bg-gray-700 dark:hover:bg-gray-600 cursor-pointer"
                    title={t("sketchBoard.rotateShapeRight")}
                    aria-label={t("sketchBoard.rotateShapeRight")}
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <span className="w-px h-4 bg-gray-600 mx-0.5" />
                  <button
                    type="button"
                    onClick={deleteSelected}
                    className="p-1.5 rounded hover:bg-gray-700 dark:hover:bg-gray-600 text-red-400 cursor-pointer"
                    title={t("sketchBoard.deleteShape")}
                    aria-label={t("sketchBoard.deleteShape")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
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
          </div>
      </div>

      {/* Calculator — a draggable floating panel, never steals board width */}
      <div
        className={`fixed top-24 end-4 z-40 w-80 max-w-[90vw] transition-opacity duration-300 ${
          showCalc
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        style={{ transform: `translate(${calcPos.x}px, ${calcPos.y}px)` }}
        aria-hidden={!showCalc}
      >
        <div className="rounded-xl shadow-2xl overflow-hidden">
          {/* Drag handle */}
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              calcDragRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                origX: calcPos.x,
                origY: calcPos.y,
              };
            }}
            onPointerMove={(e) => {
              const d = calcDragRef.current;
              if (!d) return;
              setCalcPos({
                x: clamp(
                  d.origX + (e.clientX - d.startX),
                  -(window.innerWidth - 120),
                  window.innerWidth - 120
                ),
                y: clamp(
                  d.origY + (e.clientY - d.startY),
                  -80,
                  window.innerHeight - 160
                ),
              });
            }}
            onPointerUp={() => {
              calcDragRef.current = null;
            }}
            onPointerCancel={() => {
              calcDragRef.current = null;
            }}
            className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white cursor-move touch-none select-none"
            title={t("sketchBoard.dragToMove")}
          >
            <GripHorizontal className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-medium">
              {t("sketchBoard.calc.title")}
            </span>
            <button
              type="button"
              onClick={() => setShowCalc(false)}
              onPointerDown={(e) => e.stopPropagation()}
              className="p-1 rounded hover:bg-white/20 transition-colors cursor-pointer"
              title={t("sketchBoard.closeCalc")}
              aria-label={t("sketchBoard.closeCalc")}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
            <Calculator />
          </div>
        </div>
      </div>
    </div>
  );
}
