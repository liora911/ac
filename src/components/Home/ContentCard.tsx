"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { ContentItem, ContentCardProps } from "@/types/Home/home";

export type { ContentItem, ContentCardProps };

const ITEMS_PER_PAGE = 3;

interface ExtendedContentCardProps extends ContentCardProps {
  contentType?: string;
  onLoadMore?: (type: string, skip: number) => Promise<{ items: ContentItem[]; hasMore: boolean }>;
}

const ContentCard: React.FC<ExtendedContentCardProps> = React.memo(({
  title,
  icon: Icon,
  items: initialItems,
  href,
  renderItem,
  iconColor,
  itemVariants,
  contentType,
  onLoadMore,
}) => {
  const { t, locale } = useTranslation();
  const isRTL = locale === "he";
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const [items, setItems] = useState<ContentItem[]>(initialItems);
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Update items when initialItems change
  useEffect(() => {
    setItems(initialItems);
    setCurrentPage(0);
    setHasMore(true);
  }, [initialItems]);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const isOnLastPage = currentPage === totalPages - 1;

  const currentItems = items.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const loadMoreItems = useCallback(async () => {
    if (!onLoadMore || !contentType || isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const result = await onLoadMore(contentType, items.length);
      if (result.items.length > 0) {
        setItems(prev => [...prev, ...result.items]);
      }
      setHasMore(result.hasMore);
    } catch (error) {
      console.error("Failed to load more items:", error);
    } finally {
      setIsLoading(false);
    }
  }, [onLoadMore, contentType, items.length, isLoading, hasMore]);

  const goToNext = useCallback(async () => {
    // If on last page and there might be more, fetch more
    if (isOnLastPage && hasMore && onLoadMore && contentType) {
      await loadMoreItems();
    }

    if (currentPage < totalPages - 1) {
      setDirection(1);
      setCurrentPage(prev => prev + 1);
    } else if (hasMore) {
      // After loading, go to next page
      setDirection(1);
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages, isOnLastPage, hasMore, onLoadMore, contentType, loadMoreItems]);

  const goToPrev = useCallback(() => {
    if (currentPage > 0) {
      setDirection(-1);
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  // For RTL, swap the navigation direction
  const handleLeftClick = isRTL ? goToNext : goToPrev;
  const handleRightClick = isRTL ? goToPrev : goToNext;
  const canGoLeft = isRTL ? (currentPage < totalPages - 1 || hasMore) : currentPage > 0;
  const canGoRight = isRTL ? currentPage > 0 : (currentPage < totalPages - 1 || hasMore);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -50 : 50,
      opacity: 0,
    }),
  };

  // Check if we need to show arrows (more than 3 items OR hasMore)
  const showArrows = items.length > ITEMS_PER_PAGE || hasMore;

  return (
    <motion.div
      variants={itemVariants}
      className="bg-[var(--card)] rounded-xl border border-[var(--border)] shadow-sm hover:shadow-md transition-shadow relative group"
    >
      {/* Left Arrow */}
      {showArrows && (
        <button
          onClick={handleLeftClick}
          disabled={!canGoLeft || isLoading}
          className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 shadow-lg backdrop-blur-sm transition-all duration-200 ${
            canGoLeft && !isLoading
              ? "opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-gray-700 hover:scale-110 cursor-pointer"
              : "opacity-0 cursor-not-allowed"
          }`}
          aria-label={isRTL ? t("common.next") : t("common.previous")}
        >
          <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      {/* Right Arrow */}
      {showArrows && (
        <button
          onClick={handleRightClick}
          disabled={!canGoRight || isLoading}
          className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-800/80 shadow-lg backdrop-blur-sm transition-all duration-200 ${
            canGoRight && !isLoading
              ? "opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-gray-700 hover:scale-110 cursor-pointer"
              : "opacity-0 cursor-not-allowed"
          }`}
          aria-label={isRTL ? t("common.previous") : t("common.next")}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-gray-600 dark:text-gray-300 animate-spin" />
          ) : (
            <ChevronRight className="w-6 h-6 md:w-7 md:h-7 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      )}

      <div className="p-5 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${iconColor}`}>
              <Icon size={20} className="text-white" />
            </div>
            <h3 className="font-semibold text-lg text-[var(--foreground)]">
              {title}
            </h3>
          </div>
          <Link
            href={href}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 group/link"
          >
            {t("home.sections.viewAll")}
            <ArrowIcon
              size={14}
              className="group-hover/link:translate-x-0.5 transition-transform"
            />
          </Link>
        </div>
      </div>

      <div className="p-4 overflow-hidden">
        {items.length > 0 ? (
          <div className="relative min-h-[180px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.ul
                key={currentPage}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="space-y-3"
              >
                {currentItems.map((item) => renderItem(item))}
              </motion.ul>
            </AnimatePresence>

            {/* Page Indicators - only show if multiple pages */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-1.5 mt-4">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setDirection(idx > currentPage ? 1 : -1);
                      setCurrentPage(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      idx === currentPage
                        ? "bg-blue-500 w-4"
                        : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                    }`}
                    aria-label={`${t("common.page")} ${idx + 1}`}
                  />
                ))}
                {hasMore && (
                  <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">...</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--muted-foreground)] text-center py-4">
            {t("home.sections.noItems")}
          </p>
        )}
      </div>
    </motion.div>
  );
});

ContentCard.displayName = "ContentCard";

export default ContentCard;
