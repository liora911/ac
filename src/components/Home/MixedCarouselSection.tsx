"use client";

import React, { useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import PremiumBadge from "@/components/PremiumBadge";
import type { ContentItem, MixedCarouselSectionProps } from "@/types/Home/home";
import { stripHtml } from "@/lib/utils/stripHtml";
import { ITEMS_PER_PAGE } from "@/constants/pagination";
import { COOLDOWN_MS } from "@/constants/timing";

function getItemLink(item: ContentItem): string {
  switch (item._contentType) {
    case "article":
      return `/articles/${item.slug || item.id}`;
    case "lecture":
      return `/lectures/${item.id}`;
    case "presentation":
      return `/presentations/${item.id}`;
    default:
      return "#";
  }
}

function getTypeBadgeColor(type?: string): string {
  switch (type) {
    case "article":
      return "bg-blue-600";
    case "lecture":
      return "bg-purple-600";
    case "presentation":
      return "bg-emerald-600";
    default:
      return "bg-gray-600";
  }
}

const MixedCarouselSection: React.FC<MixedCarouselSectionProps> = ({
  title,
  items,
  getImageUrl,
  getSubtitle,
}) => {
  const { t, locale } = useTranslation();
  const isRTL = locale === "he";

  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const cooldownRef = useRef(false);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const currentItems = items.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const canNavigate = items.length > ITEMS_PER_PAGE;
  const canGoNext = canNavigate && page < totalPages - 1;
  const canGoPrev = canNavigate && page > 0;

  const navigate = useCallback((dir: 1 | -1, newPage: number) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setDirection(dir);
    setPage(newPage);
    setTimeout(() => { cooldownRef.current = false; }, COOLDOWN_MS);
  }, []);

  const goNext = useCallback(() => {
    if (page < totalPages - 1) navigate(1, page + 1);
  }, [page, totalPages, navigate]);

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

  if (items.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[var(--foreground)]">{title}</h2>
      </div>

      <div className="relative group">
        {/* Desktop navigation arrows */}
        {showLeftArrow && (
          <button
            onClick={handleLeft}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-12 h-12 md:w-14 md:h-14 items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/90 shadow-xl backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-gray-700 hover:scale-110 cursor-pointer"
            aria-label={isRTL ? t("common.next") : t("common.previous")}
          >
            <ChevronLeft className="w-7 h-7 md:w-8 md:h-8 text-gray-700 dark:text-gray-200" />
          </button>
        )}

        {showRightArrow && (
          <button
            onClick={handleRight}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-12 h-12 md:w-14 md:h-14 items-center justify-center rounded-full bg-white/90 dark:bg-gray-800/90 shadow-xl backdrop-blur-sm transition-all duration-300 opacity-0 group-hover:opacity-100 hover:bg-white dark:hover:bg-gray-700 hover:scale-110 cursor-pointer"
            aria-label={isRTL ? t("common.previous") : t("common.next")}
          >
            <ChevronRight className="w-7 h-7 md:w-8 md:h-8 text-gray-700 dark:text-gray-200" />
          </button>
        )}

        {/* Mobile: Horizontal scroll */}
        <div className="sm:hidden overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2">
          <div className="flex gap-4" style={{ width: "max-content" }}>
            {items.map((item) => (
              <MixedCard
                key={item.id}
                item={item}
                getImageUrl={getImageUrl}
                getSubtitle={getSubtitle}
                t={t}
              />
            ))}
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
              {currentItems.map((item) => (
                <MixedCard
                  key={item.id}
                  item={item}
                  getImageUrl={getImageUrl}
                  getSubtitle={getSubtitle}
                  t={t}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Desktop pagination dots */}
        {totalPages > 1 && (
          <div className="hidden sm:flex justify-center gap-1 mt-4">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToPage(idx)}
                className="p-2 cursor-pointer"
                aria-label={`${t("common.page")} ${idx + 1}`}
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-300 ${
                    idx === page
                      ? "bg-blue-500 w-6"
                      : "bg-gray-300 dark:bg-gray-600 w-1.5 hover:bg-gray-400 dark:hover:bg-gray-500"
                  }`}
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function MixedCard({
  item,
  getImageUrl,
  getSubtitle,
  t,
}: {
  item: ContentItem;
  getImageUrl: (item: ContentItem) => string | null;
  getSubtitle?: (item: ContentItem) => string | null;
  t: (key: string) => string;
}) {
  const imageUrl = getImageUrl(item);
  const rawSubtitle = getSubtitle?.(item);
  const subtitle = rawSubtitle ? stripHtml(rawSubtitle) : null;
  const itemLink = getItemLink(item);
  const typeLabel = item._contentType
    ? t(`home.sections.${item._contentType}`)
    : "";

  return (
    <Link
      href={itemLink}
      className="block group/card flex-shrink-0 w-56 sm:w-auto"
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-md hover:shadow-xl transition-shadow duration-300">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-500 group-hover/card:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Content type badge - top left */}
        <div className="absolute top-2 left-2">
          <span
            className={`${getTypeBadgeColor(item._contentType)} text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-lg`}
          >
            {typeLabel}
          </span>
        </div>

        {/* Premium badge - top right */}
        {item.isPremium && (
          <div className="absolute top-2 right-2">
            <PremiumBadge size="sm" />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <h3 className="text-white font-semibold text-sm line-clamp-2 drop-shadow-lg">
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
}

export default MixedCarouselSection;
