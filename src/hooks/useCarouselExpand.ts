import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import { EXPAND_DELAY_MS } from "@/constants/timing";
import { ITEMS_PER_PAGE } from "@/constants/pagination";

/** Duration of the column-width transition (ms). Matches `lg:duration-500` below. */
const GRID_ANIMATION_MS = 500;

/**
 * Column widths animate with a plain CSS transition, and every state is written
 * in the same `minmax(0, Nfr)` form, so the browser interpolates fr to fr.
 * (Animating this with framer-motion read the starting widths back as px and
 * mixed those numbers into the fr template: the card stalled, then snapped.)
 */
const GRID_TRANSITION_CLASS =
  "lg:transition-[grid-template-columns] lg:duration-500 lg:ease-[cubic-bezier(0.25,0.1,0.25,1)]";

function buildColumns(expandedIdx: number): string {
  return Array.from({ length: ITEMS_PER_PAGE }, (_, i) =>
    i === expandedIdx ? "minmax(0, 2fr)" : "minmax(0, 0.85fr)",
  ).join(" ");
}

interface UseCarouselExpandResult {
  expandedIdx: number | null;
  /**
   * On each card: expands it after a short hover delay. Pass the page the card
   * was rendered on, so cards sliding out during a page flip (still rendered
   * with their old page) can't grab the expansion as they pass under the cursor.
   */
  handleMouseEnter: (idx: number, cardPage: number) => void;
  /** On each card: cancels a pending expansion, but never collapses anything */
  handleMouseLeave: () => void;
  /** On the grid container: returns to the first card once the pointer leaves the whole row */
  handleRowLeave: () => void;
  /** Inline column widths on large screens; undefined lets Tailwind's grid-cols-* apply */
  gridStyle: CSSProperties | undefined;
  /** Transition classes for the grid; empty until the first hover so the initial layout never animates */
  gridTransitionClass: string;
  /** True while this card's width is animating; its caption hides because its font size changes */
  isCaptionHidden: (idx: number) => boolean;
}

export function useCarouselExpand(page: number): UseCarouselExpandResult {
  const [isLgScreen, setIsLgScreen] = useState(false);
  const pageRef = useRef(page);
  useEffect(() => {
    pageRef.current = page;
  }, [page]);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [hiddenCaptions, setHiddenCaptions] = useState<number[]>([]);
  const [transitionsOn, setTransitionsOn] = useState(false);
  // Mirrors expandedIdx so timer callbacks never read a stale value
  const expandedRef = useRef<number | null>(null);
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const check = () => {
      const lg = window.innerWidth >= 1024;
      setIsLgScreen(lg);
      if (lg) {
        // Default: first card expanded on large screens
        if (expandedRef.current === null) {
          expandedRef.current = 0;
          setExpandedIdx(0);
        }
      } else {
        expandedRef.current = null;
        setExpandedIdx(null);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    return () => {
      if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
      if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
    };
  }, []);

  const cancelPendingExpand = useCallback(() => {
    if (expandTimerRef.current) {
      clearTimeout(expandTimerRef.current);
      expandTimerRef.current = null;
    }
  }, []);

  const expandTo = useCallback((idx: number) => {
    const prev = expandedRef.current;
    if (prev === idx) return;
    expandedRef.current = idx;
    setExpandedIdx(idx);

    // Hide only the captions whose size changes (the card opening and the one
    // closing) until the widths settle; every other caption stays put.
    setHiddenCaptions((current) =>
      Array.from(new Set([...current, idx, ...(prev === null ? [] : [prev])])),
    );
    if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
    captionTimerRef.current = setTimeout(
      () => setHiddenCaptions([]),
      GRID_ANIMATION_MS + 50,
    );
  }, []);

  const handleMouseEnter = useCallback(
    (idx: number, cardPage: number) => {
      if (!isLgScreen) return;
      if (cardPage !== pageRef.current) return; // card is sliding out
      // Enable the transition before the first width change is applied
      setTransitionsOn(true);
      cancelPendingExpand();
      if (idx === expandedRef.current) return;
      expandTimerRef.current = setTimeout(() => expandTo(idx), EXPAND_DELAY_MS);
    },
    [isLgScreen, cancelPendingExpand, expandTo],
  );

  const handleRowLeave = useCallback(() => {
    cancelPendingExpand();
    if (isLgScreen) expandTo(0);
  }, [isLgScreen, cancelPendingExpand, expandTo]);

  const gridStyle = useMemo<CSSProperties | undefined>(() => {
    if (!isLgScreen || expandedIdx === null) return undefined;
    return { gridTemplateColumns: buildColumns(expandedIdx) };
  }, [isLgScreen, expandedIdx]);

  const isCaptionHidden = useCallback(
    (idx: number) => hiddenCaptions.includes(idx),
    [hiddenCaptions],
  );

  return {
    expandedIdx,
    handleMouseEnter,
    handleMouseLeave: cancelPendingExpand,
    handleRowLeave,
    gridStyle,
    gridTransitionClass: transitionsOn ? GRID_TRANSITION_CLASS : "",
    isCaptionHidden,
  };
}
