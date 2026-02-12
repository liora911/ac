import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { EXPAND_DELAY_MS } from "@/constants/timing";
import { ITEMS_PER_PAGE } from "@/constants/pagination";

const BASE_COLUMNS = Array.from({ length: ITEMS_PER_PAGE }, () => "1fr").join(
  " ",
);

/** Duration of the grid expand animation (ms) */
const GRID_ANIMATION_MS = 500;

interface UseCarouselExpandResult {
  expandedIdx: number | null;
  handleMouseEnter: (idx: number) => void;
  handleMouseLeave: () => void;
  /** The gridTemplateColumns string for Framer Motion animate prop. undefined = let Tailwind handle it */
  gridColumns: string | undefined;
  /** Whether text is safe to show (false during grid animation to hide font-size change) */
  showText: boolean;
}

export function useCarouselExpand(): UseCarouselExpandResult {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [isLgScreen, setIsLgScreen] = useState(false);
  const [showText, setShowText] = useState(true);
  const expandTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    const check = () => setIsLgScreen(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    return () => {
      if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
      if (textTimerRef.current) clearTimeout(textTimerRef.current);
    };
  }, []);

  // Hide text during grid animation, reveal after it finishes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setShowText(false);
    if (textTimerRef.current) clearTimeout(textTimerRef.current);
    textTimerRef.current = setTimeout(() => setShowText(true), GRID_ANIMATION_MS + 50);
  }, [expandedIdx]);

  const handleMouseEnter = useCallback(
    (idx: number) => {
      if (!isLgScreen) return;
      if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
      expandTimerRef.current = setTimeout(() => {
        setExpandedIdx(idx);
      }, EXPAND_DELAY_MS);
    },
    [isLgScreen],
  );

  const handleMouseLeave = useCallback(() => {
    if (expandTimerRef.current) {
      clearTimeout(expandTimerRef.current);
      expandTimerRef.current = null;
    }
    setExpandedIdx(null);
  }, []);

  const gridColumns = useMemo(() => {
    if (!isLgScreen) return undefined;

    if (expandedIdx === null) return BASE_COLUMNS;

    return Array.from({ length: ITEMS_PER_PAGE }, (_, i) =>
      i === expandedIdx ? "2fr" : "0.85fr",
    ).join(" ");
  }, [isLgScreen, expandedIdx]);

  return { expandedIdx, handleMouseEnter, handleMouseLeave, gridColumns, showText };
}
