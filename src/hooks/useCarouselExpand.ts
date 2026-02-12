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

  const scheduleTextReveal = useCallback(() => {
    if (textTimerRef.current) clearTimeout(textTimerRef.current);
    textTimerRef.current = setTimeout(() => setShowText(true), GRID_ANIMATION_MS + 50);
  }, []);

  const handleMouseEnter = useCallback(
    (idx: number) => {
      if (!isLgScreen) return;
      if (expandTimerRef.current) clearTimeout(expandTimerRef.current);
      expandTimerRef.current = setTimeout(() => {
        // Batched in same render: text hides before isExpanded changes classes
        setShowText(false);
        setExpandedIdx(idx);
        scheduleTextReveal();
      }, EXPAND_DELAY_MS);
    },
    [isLgScreen, scheduleTextReveal],
  );

  const handleMouseLeave = useCallback(() => {
    if (expandTimerRef.current) {
      clearTimeout(expandTimerRef.current);
      expandTimerRef.current = null;
    }
    // Batched in same render: text hides before collapse changes classes
    setShowText(false);
    setExpandedIdx(null);
    scheduleTextReveal();
  }, [scheduleTextReveal]);

  const gridColumns = useMemo(() => {
    if (!isLgScreen) return undefined;

    if (expandedIdx === null) return BASE_COLUMNS;

    return Array.from({ length: ITEMS_PER_PAGE }, (_, i) =>
      i === expandedIdx ? "2fr" : "0.85fr",
    ).join(" ");
  }, [isLgScreen, expandedIdx]);

  return { expandedIdx, handleMouseEnter, handleMouseLeave, gridColumns, showText };
}
