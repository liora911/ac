"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, Star } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import PremiumBadge from "@/components/PremiumBadge";
import type { ContentItem } from "@/types/Home/home";
import { stripHtml } from "@/lib/utils/stripHtml";

const ITEMS_PER_PAGE = 3;
const COOLDOWN_MS = 500;
const BATCH_SIZE = 9;

interface CarouselSectionProps {
  title: string;
  items: ContentItem[];
  href: string;
  linkPrefix: string;
  useSlug?: boolean;
  contentType: string;
  onLoadMore: (type: string, skip: number) => Promise<{ items: ContentItem[]; hasMore: boolean }>;
  getImageUrl: (item: ContentItem) => string | null;
  getSubtitle?: (item: ContentItem) => string | null;
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
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length >= BATCH_SIZE);
  const cooldownRef = useRef(false);

  useEffect(() => {
    setItems(initialItems);
    setPage(0);
    setHasMore(initialItems.length >= BATCH_SIZE);
  }, [initialItems]);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const currentItems = items.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const canNavigate = items.length > ITEMS_PER_PAGE || hasMore;
  const canGoNext = canNavigate && (page < totalPages - 1 || hasMore);
  const canGoPrev = canNavigate && page > 0;

  const navigate = useCallback((dir: 1 | -1, newPage: number) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setDirection(dir);
    setPage(newPage);
    setTimeout(() => { cooldownRef.current = false; }, COOLDOWN_MS);
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return false;
    setIsLoading(true);
    try {
      const result = await onLoadMore(contentType, items.length);
      if (result.items.length > 0) {
        setItems(prev => [...prev, ...result.items]);
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

  const goToPage = useCallback((idx: number) => {
    if (idx !== page) navigate(idx > page ? 1 : -1, idx);
  }, [page, navigate]);


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
    return (
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--foreground)]">{title}</h2>
          <Link href={href} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            {t("home.sections.viewAll")}
          </Link>
        </div>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {t("home.sections.noContent")}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--foreground)]">{title}</h2>
        <Link href={href} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          {t("home.sections.viewAll")}
        </Link>
      </div>

      <div className="relative group">
        {showLeftArrow && (
          <button
            onClick={handleLeft}
            disabled={isLoading}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/90 shadow-xl backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-gray-700 hover:scale-110 cursor-pointer"
            aria-label={isRTL ? t("common.next") : t("common.previous")}
          >
            <ChevronLeft className="w-7 h-7 md:w-8 md:h-8 text-gray-700 dark:text-gray-200" />
          </button>
        )}

        {showRightArrow && (
          <button
            onClick={handleRight}
            disabled={isLoading}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/90 shadow-xl backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-gray-700 hover:scale-110 cursor-pointer"
            aria-label={isRTL ? t("common.previous") : t("common.next")}
          >
            {isLoading ? (
              <Loader2 className="w-6 h-6 md:w-7 md:h-7 text-gray-700 dark:text-gray-200 animate-spin" />
            ) : (
              <ChevronRight className="w-7 h-7 md:w-8 md:h-8 text-gray-700 dark:text-gray-200" />
            )}
          </button>
        )}

        <div className="overflow-hidden px-1">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={page}
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
                const rawSubtitle = getSubtitle?.(item);
                const subtitle = rawSubtitle ? stripHtml(rawSubtitle) : null;
                const itemLink = useSlug && item.slug
                  ? `${linkPrefix}/${item.slug}`
                  : `${linkPrefix}/${item.id}`;

                return (
                  <Link key={item.id} href={itemLink} className="block group/card">
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-md hover:shadow-xl transition-shadow duration-300">
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

                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        {item.isFeatured && (
                          <div className="bg-amber-500 p-1.5 rounded-full shadow-lg">
                            <Star className="w-4 h-4 text-white fill-white" />
                          </div>
                        )}
                        {item.isPremium && <PremiumBadge size="sm" />}
                      </div>

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

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToPage(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === page
                    ? "bg-blue-500 w-6"
                    : "bg-gray-300 dark:bg-gray-600 w-1.5 hover:bg-gray-400 dark:hover:bg-gray-500"
                }`}
                aria-label={`${t("common.page")} ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CarouselSection;
