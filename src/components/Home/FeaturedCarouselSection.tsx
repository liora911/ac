"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Flame,
} from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import PremiumBadge from "@/components/PremiumBadge";
import ContentPreviewPopover from "./ContentPreviewPopover";
import type { ContentItem, FeaturedCarouselSectionProps } from "@/types/Home/home";
import { stripHtml } from "@/lib/utils/stripHtml";
import { ITEMS_PER_PAGE, BATCH_SIZE } from "@/constants/pagination";
import { COOLDOWN_MS, HOVER_DELAY_MS } from "@/constants/timing";

const FeaturedCarouselSection: React.FC<FeaturedCarouselSectionProps> = ({
  title,
  items: initialItems,
  href,
  linkPrefix,
  useSlug = false,
  contentType,
  onLoadMore,
  getImageUrl,
  getSubtitle,
}) => {
  const { t, locale } = useTranslation();
  const isRTL = locale === "he";

  const [items, setItems] = useState<ContentItem[]>(initialItems);
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length >= BATCH_SIZE);
  const cooldownRef = useRef(false);

  // Hover preview state
  const [hoveredItem, setHoveredItem] = useState<ContentItem | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringPopoverRef = useRef(false);
  const pendingItemRef = useRef<ContentItem | null>(null);

  useEffect(() => {
    setItems(initialItems);
    setPage(0);
    setHasMore(initialItems.length >= BATCH_SIZE);
  }, [initialItems]);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const currentItems = items.slice(
    page * ITEMS_PER_PAGE,
    (page + 1) * ITEMS_PER_PAGE,
  );

  const canNavigate = items.length > ITEMS_PER_PAGE || hasMore;
  const canGoNext = canNavigate && (page < totalPages - 1 || hasMore);
  const canGoPrev = canNavigate && page > 0;

  const navigate = useCallback((dir: 1 | -1, newPage: number) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setDirection(dir);
    setPage(newPage);
    setTimeout(() => {
      cooldownRef.current = false;
    }, COOLDOWN_MS);
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return false;
    setIsLoading(true);
    try {
      const result = await onLoadMore(contentType, items.length);
      if (result.items.length > 0) {
        setItems((prev) => [...prev, ...result.items]);
        setHasMore(result.hasMore);
        return true;
      }
      setHasMore(false);
      return false;
    } catch {
      setHasMore(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [onLoadMore, contentType, items.length, isLoading, hasMore]);

  const goNext = useCallback(async () => {
    if (cooldownRef.current || isLoading) return;

    if (page < totalPages - 1) {
      navigate(1, page + 1);
    } else if (hasMore) {
      const loaded = await loadMore();
      if (loaded) navigate(1, page + 1);
    }
  }, [page, totalPages, hasMore, isLoading, loadMore, navigate]);

  const goPrev = useCallback(() => {
    if (page > 0) navigate(-1, page - 1);
  }, [page, navigate]);

  const goToPage = useCallback(
    (idx: number) => {
      if (idx !== page) navigate(idx > page ? 1 : -1, idx);
    },
    [page, navigate],
  );

  // Hover preview handlers
  const handleCardMouseEnter = useCallback(
    (item: ContentItem, e: React.MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      pendingItemRef.current = item;

      hoverTimerRef.current = setTimeout(() => {
        setHoveredItem(item);
        setHoverPosition({ x, y });
      }, HOVER_DELAY_MS);
    },
    [],
  );

  const handleCardMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!hoveredItem && pendingItemRef.current) {
        setHoverPosition({ x: e.clientX, y: e.clientY });
      }
    },
    [hoveredItem],
  );

  const handleCardMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    pendingItemRef.current = null;

    setTimeout(() => {
      if (!isHoveringPopoverRef.current) {
        setHoveredItem(null);
      }
    }, 100);
  }, []);

  const handlePopoverMouseEnter = useCallback(() => {
    isHoveringPopoverRef.current = true;
  }, []);

  const handlePopoverMouseLeave = useCallback(() => {
    isHoveringPopoverRef.current = false;
    setHoveredItem(null);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
      }
    };
  }, []);

  const handleLeft = isRTL ? goNext : goPrev;
  const handleRight = isRTL ? goPrev : goNext;
  const showLeftArrow = isRTL ? canGoNext : canGoPrev;
  const showRightArrow = isRTL ? canGoPrev : canGoNext;

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 100 : -100, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -100 : 100, opacity: 0 }),
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mb-12 -mx-6 px-6 py-10 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900/50 dark:via-blue-950/20 dark:to-slate-900/50 border-y border-slate-200/80 dark:border-slate-700/50 shadow-inner">
      {/* Header with special styling */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/25">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
        </div>
        <Link
          href={href}
          className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1.5 px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30"
        >
          {t("home.sections.viewAll")}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="relative group">
        {/* Desktop navigation arrows */}
        {showLeftArrow && (
          <button
            onClick={handleLeft}
            disabled={isLoading}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-12 h-12 md:w-14 md:h-14 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-xl border border-blue-200 dark:border-blue-700 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:bg-blue-50 dark:hover:bg-gray-700 hover:scale-110 cursor-pointer"
            aria-label={isRTL ? t("common.next") : t("common.previous")}
          >
            <ChevronLeft className="w-7 h-7 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />
          </button>
        )}

        {showRightArrow && (
          <button
            onClick={handleRight}
            disabled={isLoading}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-12 h-12 md:w-14 md:h-14 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-xl border border-blue-200 dark:border-blue-700 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:bg-blue-50 dark:hover:bg-gray-700 hover:scale-110 cursor-pointer"
            aria-label={isRTL ? t("common.previous") : t("common.next")}
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 md:w-7 md:h-7 text-blue-600 dark:text-blue-400 animate-spin" />
            ) : (
              <ChevronRight className="w-7 h-7 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />
            )}
          </button>
        )}

        {/* Mobile: Horizontal scroll */}
        <div className="sm:hidden overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
          <div className="flex gap-4" style={{ width: "max-content" }}>
            {items.map((item) => {
              const imageUrl = getImageUrl(item);
              const rawSubtitle = getSubtitle?.(item);
              const subtitle = rawSubtitle ? stripHtml(rawSubtitle) : null;
              const itemLink =
                useSlug && item.slug
                  ? `${linkPrefix}/${item.slug}`
                  : `${linkPrefix}/${item.id}`;

              return (
                <Link
                  key={item.id}
                  href={itemLink}
                  className="block group/card flex-shrink-0 w-56"
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-lg ring-2 ring-blue-300/50 dark:ring-blue-600/30">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="224px"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-indigo-300 dark:from-blue-800 dark:to-indigo-900" />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {item.isPremium && (
                      <div className="absolute top-2 right-2">
                        <PremiumBadge size="sm" />
                      </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                      <h3 className="text-white font-bold text-sm line-clamp-2 drop-shadow-lg">
                        {item.title}
                      </h3>
                      {subtitle && (
                        <p className="text-white/80 text-xs mt-0.5 line-clamp-1 drop-shadow-md">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop: Paginated grid */}
        <div className="hidden sm:block overflow-hidden px-1">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3"
            >
              {currentItems.map((item) => {
                const imageUrl = getImageUrl(item);
                const itemLink =
                  useSlug && item.slug
                    ? `${linkPrefix}/${item.slug}`
                    : `${linkPrefix}/${item.id}`;

                return (
                  <Link
                    key={item.id}
                    href={itemLink}
                    className="block group/card"
                    onMouseEnter={(e) => handleCardMouseEnter(item, e)}
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                  >
                    <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-lg ring-2 ring-blue-300/50 dark:ring-blue-600/30 hover:ring-blue-400 dark:hover:ring-blue-500 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-indigo-300 dark:from-blue-800 dark:to-indigo-900" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Desktop pagination dots */}
        {totalPages > 1 && (
          <div className="hidden sm:flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToPage(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === page
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 w-8"
                    : "bg-blue-300 dark:bg-blue-700 w-2 hover:bg-blue-400 dark:hover:bg-blue-600"
                }`}
                aria-label={`${t("common.page")} ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hover Preview Popover */}
      <AnimatePresence>
        {hoveredItem && (
          <ContentPreviewPopover
            item={hoveredItem}
            imageUrl={getImageUrl(hoveredItem)}
            subtitle={
              getSubtitle ? stripHtml(getSubtitle(hoveredItem) || "") : null
            }
            position={hoverPosition}
            onMouseEnter={handlePopoverMouseEnter}
            onMouseLeave={handlePopoverMouseLeave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeaturedCarouselSection;
