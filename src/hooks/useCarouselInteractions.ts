"use client";

import { useRef } from "react";
import type React from "react";

/**
 * Shared mouse interactions for every carousel on the site.
 * Touch devices are deliberately excluded (they scroll/swipe natively);
 * these hooks give desktop mice the same power.
 */

type PointerHandlers = {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onClickCapture: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
};

/**
 * Page-flip swipe for paginated carousels (the homepage sections):
 * dragging past a threshold fires the spatial left/right action once.
 * Spread the returned handlers onto the pages container.
 */
export function useMouseSwipe({
  onLeft,
  onRight,
}: {
  onLeft: () => void;
  onRight: () => void;
}): PointerHandlers {
  const stateRef = useRef<{ startX: number; fired: boolean } | null>(null);
  const movedRef = useRef(false);

  return {
    onPointerDown: (e) => {
      if (e.pointerType !== "mouse") return;
      stateRef.current = { startX: e.clientX, fired: false };
      movedRef.current = false;
    },
    onPointerMove: (e) => {
      const s = stateRef.current;
      if (!s || s.fired) return;
      const dx = e.clientX - s.startX;
      if (Math.abs(dx) > 8) movedRef.current = true;
      if (Math.abs(dx) > 60) {
        s.fired = true;
        // Pulling the content left reveals what's on the right, and vice versa
        if (dx < 0) onRight();
        else onLeft();
      }
    },
    onPointerUp: () => {
      stateRef.current = null;
    },
    onPointerLeave: () => {
      stateRef.current = null;
    },
    onClickCapture: (e) => {
      // Swallow the click that ends a swipe so cards don't open accidentally
      if (movedRef.current) {
        e.preventDefault();
        e.stopPropagation();
        movedRef.current = false;
      }
    },
    onDragStart: (e) => e.preventDefault(),
  };
}

/**
 * Drag-to-scroll for free-scrolling rows (lectures/presentations):
 * the scrollbar is hidden on these rows, so without this a desktop mouse
 * has no way to pan besides the arrows.
 * Spread the returned handlers onto the scrollable row element.
 */
export function useDragScroll(
  scrollRef: React.RefObject<HTMLDivElement | null>
): PointerHandlers {
  const stateRef = useRef<{ startX: number; startScroll: number } | null>(
    null
  );
  const movedRef = useRef(false);

  return {
    onPointerDown: (e) => {
      if (e.pointerType !== "mouse") return;
      const el = scrollRef.current;
      if (!el) return;
      stateRef.current = { startX: e.clientX, startScroll: el.scrollLeft };
      movedRef.current = false;
    },
    onPointerMove: (e) => {
      const s = stateRef.current;
      const el = scrollRef.current;
      if (!s || !el) return;
      const dx = e.clientX - s.startX;
      if (Math.abs(dx) > 5) movedRef.current = true;
      el.scrollLeft = s.startScroll - dx;
    },
    onPointerUp: () => {
      stateRef.current = null;
    },
    onPointerLeave: () => {
      stateRef.current = null;
    },
    onClickCapture: (e) => {
      if (movedRef.current) {
        e.preventDefault();
        e.stopPropagation();
        movedRef.current = false;
      }
    },
    onDragStart: (e) => e.preventDefault(),
  };
}
