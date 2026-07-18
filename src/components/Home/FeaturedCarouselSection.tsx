"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Star } from "lucide-react";
import { useMouseSwipe } from "@/hooks/useCarouselInteractions";
import ChevronDisc from "@/components/Carousel/ChevronDisc";
import { useTranslation } from "@/contexts/Translation/translation.context";
import PremiumBadge from "@/components/PremiumBadge";
import type {
  ContentItem,
  FeaturedCarouselSectionProps,
} from "@/types/Home/home";
import { stripHtml } from "@/lib/utils/stripHtml";
import { ITEMS_PER_PAGE, BATCH_SIZE } from "@/constants/pagination";
import { COOLDOWN_MS } from "@/constants/timing";

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

  const handleLeft = isRTL ? goNext : goPrev;
  const handleRight = isRTL ? goPrev : goNext;

  const swipeHandlers = useMouseSwipe({ onLeft: handleLeft, onRight: handleRight });

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
    <motion.div
      className="mb-12 py-10 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-900/50 dark:via-blue-950/20 dark:to-slate-900/50 border-y border-slate-200/80 dark:border-slate-700/50 shadow-inner"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Header - integrated badge style */}
      <div className="flex items-center mb-8 px-4 sm:px-6 md:px-10 lg:px-12">
        <div className="relative flex items-center">
          {/* Soft glow behind the badge */}
          <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-500/20 via-red-500/15 to-indigo-500/20 dark:from-orange-500/10 dark:via-red-500/10 dark:to-indigo-500/10 rounded-2xl blur-lg" />
          {/* Badge */}
          <div className="relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-red-500 to-indigo-500 shadow-lg shadow-red-500/25">
            <Flame className="w-5 h-5 text-white/90 shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight whitespace-nowrap">
              {title}
            </h2>
          </div>
        </div>
      </div>

      <div className="relative group">
        {/* Desktop navigation - gradient edge overlays (Netflix-style) */}
        {showLeftArrow && (
          <button
            onClick={handleLeft}
            disabled={isLoading}
            className="hidden sm:flex absolute left-0 top-0 bottom-0 z-20 w-12 md:w-16 items-center justify-center bg-gradient-to-r from-slate-50 dark:from-slate-900/80 via-slate-50/60 dark:via-slate-900/40 to-transparent transition-opacity duration-300 opacity-70 group-hover:opacity-100 cursor-pointer"
            aria-label={isRTL ? t("common.next") : t("common.previous")}
          >
            <ChevronDisc dir="left" iconClassName="text-blue-600 dark:text-blue-400" />
          </button>
        )}

        {showRightArrow && (
          <button
            onClick={handleRight}
            disabled={isLoading}
            className="hidden sm:flex absolute right-0 top-0 bottom-0 z-20 w-12 md:w-16 items-center justify-center bg-gradient-to-l from-slate-50 dark:from-slate-900/80 via-slate-50/60 dark:via-slate-900/40 to-transparent transition-opacity duration-300 opacity-70 group-hover:opacity-100 cursor-pointer"
            aria-label={isRTL ? t("common.previous") : t("common.next")}
          >
            <ChevronDisc
              dir="right"
              loading={isLoading}
              iconClassName="text-blue-600 dark:text-blue-400"
            />
          </button>
        )}

        {/* Mobile: Horizontal scroll */}
        <div className="sm:hidden overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2" dir={isRTL ? "rtl" : "ltr"}>
          <div className="flex gap-4 w-max">
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
                  className="block group/card flex-shrink-0 w-44"
                >
                  <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-lg ring-2 ring-blue-300/50 dark:ring-blue-600/30">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="176px"
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

        {/* Desktop: Paginated grid - full bleed, mouse-swipeable */}
        <div
          className="hidden sm:block overflow-hidden px-6 md:px-10 lg:px-12 cursor-grab active:cursor-grabbing select-none"
          {...swipeHandlers}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={page}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {currentItems.map((item) => {
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
                      className="group/card block rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                    >
                      {/* Landscape thumbnail — editorial, matches the rest of the site */}
                      <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-700">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={item.title}
                            fill
                            className="object-cover group-hover/card:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-blue-900 dark:to-indigo-950" />
                        )}

                        {/* Featured ribbon */}
                        <span className="absolute top-2.5 start-2.5 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/95 text-white text-[11px] font-semibold shadow-md">
                          <Star className="w-3 h-3 fill-current" />
                          {t("home.sections.featured")}
                        </span>

                        {item.isPremium && (
                          <div className="absolute top-2.5 end-2.5">
                            <PremiumBadge size="sm" />
                          </div>
                        )}
                      </div>

                      {/* Title & subtitle in solid, always-readable text */}
                      <div className="p-4">
                        <h3
                          dir="auto"
                          className="font-bold text-gray-900 dark:text-white line-clamp-2 group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors"
                        >
                          {item.title}
                        </h3>
                        {subtitle && (
                          <p
                            dir="auto"
                            className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2"
                          >
                            {subtitle}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
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
    </motion.div>
  );
};

export default FeaturedCarouselSection;
