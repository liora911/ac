"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, Star } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import PremiumBadge from "@/components/PremiumBadge";
import type { ContentItem } from "@/types/Home/home";

const ITEMS_PER_PAGE = 3;
const FETCH_BATCH_SIZE = 9;

interface CarouselSectionProps {
  title: string;
  items: ContentItem[];
  href: string;
  linkPrefix: string; // e.g., "/articles", "/lectures"
  useSlug?: boolean; // Use slug instead of id for links
  contentType: string;
  onLoadMore: (type: string, skip: number) => Promise<{ items: ContentItem[]; hasMore: boolean }>;
  getImageUrl: (item: ContentItem) => string | null;
  getSubtitle: (item: ContentItem) => string | null;
}

const CarouselSection: React.FC<CarouselSectionProps> = ({
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
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

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
    if (isLoading || !hasMore) return;

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
    if (isOnLastPage && hasMore) {
      await loadMoreItems();
    }
    if (currentPage < totalPages - 1 || hasMore) {
      setDirection(1);
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages, isOnLastPage, hasMore, loadMoreItems]);

  const goToPrev = useCallback(() => {
    if (currentPage > 0) {
      setDirection(-1);
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const handleLeftClick = isRTL ? goToNext : goToPrev;
  const handleRightClick = isRTL ? goToPrev : goToNext;
  const canGoLeft = isRTL ? (currentPage < totalPages - 1 || hasMore) : currentPage > 0;
  const canGoRight = isRTL ? currentPage > 0 : (currentPage < totalPages - 1 || hasMore);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
    }),
  };

  if (items.length === 0) return null;

  return (
    <div className="mb-10">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--foreground)]">{title}</h2>
        <Link
          href={href}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t("home.sections.viewAll")}
        </Link>
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={handleLeftClick}
          disabled={!canGoLeft || isLoading}
          className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/90 shadow-xl backdrop-blur-sm transition-all duration-300 ${
            canGoLeft && !isLoading
              ? "opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-gray-700 hover:scale-110 cursor-pointer"
              : "opacity-0 pointer-events-none"
          }`}
          aria-label={isRTL ? t("common.next") : t("common.previous")}
        >
          <ChevronLeft className="w-7 h-7 md:w-8 md:h-8 text-gray-700 dark:text-gray-200" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={handleRightClick}
          disabled={!canGoRight || isLoading}
          className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/90 shadow-xl backdrop-blur-sm transition-all duration-300 ${
            canGoRight && !isLoading
              ? "opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-gray-700 hover:scale-110 cursor-pointer"
              : "opacity-0 pointer-events-none"
          }`}
          aria-label={isRTL ? t("common.previous") : t("common.next")}
        >
          {isLoading ? (
            <Loader2 className="w-6 h-6 md:w-7 md:h-7 text-gray-700 dark:text-gray-200 animate-spin" />
          ) : (
            <ChevronRight className="w-7 h-7 md:w-8 md:h-8 text-gray-700 dark:text-gray-200" />
          )}
        </button>

        {/* Cards Container */}
        <div className="overflow-hidden px-1">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentPage}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {currentItems.map((item) => {
                const imageUrl = getImageUrl(item);
                const subtitle = getSubtitle(item);
                const itemLink = useSlug && item.slug
                  ? `${linkPrefix}/${item.slug}`
                  : `${linkPrefix}/${item.id}`;

                return (
                  <Link
                    key={item.id}
                    href={itemLink}
                    className="block group/card"
                  >
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-md hover:shadow-xl transition-shadow duration-300">
                      {/* Background Image */}
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700" />
                      )}

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        {item.isFeatured && (
                          <div className="bg-amber-500 p-1.5 rounded-full shadow-lg">
                            <Star className="w-4 h-4 text-white fill-white" />
                          </div>
                        )}
                        {item.isPremium && <PremiumBadge size="sm" />}
                      </div>

                      {/* Text Content */}
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-white font-semibold text-lg line-clamp-2 drop-shadow-lg">
                          {item.title}
                        </h3>
                        {subtitle && (
                          <p className="text-white/80 text-sm mt-1 line-clamp-1 drop-shadow-md">
                            {subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Page Indicators */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentPage ? 1 : -1);
                  setCurrentPage(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentPage
                    ? "bg-blue-500 w-6"
                    : "bg-gray-300 dark:bg-gray-600 w-1.5 hover:bg-gray-400 dark:hover:bg-gray-500"
                }`}
                aria-label={`${t("common.page")} ${idx + 1}`}
              />
            ))}
            {(totalPages > 5 || hasMore) && (
              <span className="text-gray-400 dark:text-gray-500 text-xs self-center">...</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CarouselSection;
