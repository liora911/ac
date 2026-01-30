"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import type { PresentationCategory, Presentation, PresentationsCarouselViewProps, PresentationCategoryCarouselProps, PresentationCardProps } from "@/types/Presentations/presentations";
import { ChevronLeft, ChevronRight, Search, X, Share2, Lock, Images, Mic } from "lucide-react";
import { useNotification } from "@/contexts/NotificationContext";
import PremiumBadge from "@/components/PremiumBadge";
import FavoriteButton from "@/components/FavoriteButton";
import { PresentationPlaceholder } from "@/components/Placeholders";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useSpeechToText } from "@/hooks/useSpeechToText";

/**
 * Presentations page with horizontal carousels per category.
 * Each category is displayed as a section with a horizontally scrollable row of presentation cards.
 */
export default function PresentationsCarouselView({ categories }: PresentationsCarouselViewProps) {
  const { t, locale } = useTranslation();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // Speech-to-text for search
  const { isListening, isSupported, toggleListening } = useSpeechToText({
    lang: locale === "he" ? "he-IL" : "en-US",
    onFinalResult: (transcript) => {
      setSearchQuery((prev) => (prev ? prev + " " + transcript : transcript));
    },
  });

  // Flatten all presentations for search
  const allPresentations = React.useMemo(() => {
    const presentations: (Presentation & { categoryName: string })[] = [];
    const collectPresentations = (cats: PresentationCategory[]) => {
      cats.forEach((cat) => {
        cat.presentations.forEach((presentation) => {
          presentations.push({ ...presentation, categoryName: cat.name });
        });
        if (cat.subcategories) {
          collectPresentations(cat.subcategories);
        }
      });
    };
    collectPresentations(categories);
    return presentations;
  }, [categories]);

  // Filter presentations based on search
  const filteredPresentations = React.useMemo(() => {
    if (!debouncedSearch.trim()) return null;
    const query = debouncedSearch.toLowerCase();
    return allPresentations.filter(
      (presentation) =>
        presentation.title.toLowerCase().includes(query) ||
        presentation.description?.toLowerCase().includes(query) ||
        presentation.categoryName.toLowerCase().includes(query)
    );
  }, [allPresentations, debouncedSearch]);

  const hasAccess = (presentation: Presentation): boolean =>
    !presentation.isPremium ||
    session?.user?.role === "ADMIN" ||
    !!session?.user?.hasActiveSubscription;

  // Flatten categories including subcategories for display
  const flatCategories = React.useMemo(() => {
    const result: PresentationCategory[] = [];
    const flatten = (cats: PresentationCategory[]) => {
      cats.forEach((cat) => {
        if (cat.presentations.length > 0) {
          result.push(cat);
        }
        if (cat.subcategories && cat.subcategories.length > 0) {
          flatten(cat.subcategories);
        }
      });
    };
    flatten(categories);
    return result;
  }, [categories]);

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative max-w-xl mx-auto">
        <div className="relative">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("presentationsPage.searchPlaceholder")}
            className="w-full ps-12 pe-20 py-3 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm"
          />
          <div className="absolute end-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isSupported && (
              <button
                onClick={toggleListening}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isListening
                    ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                }`}
                title={isListening ? t("common.stopListening") : t("common.startListening")}
              >
                <Mic className={`w-4 h-4 ${isListening ? "animate-pulse" : ""}`} />
              </button>
            )}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Results */}
      {filteredPresentations !== null ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("presentationsPage.searchResults")} ({filteredPresentations.length})
          </h2>
          {filteredPresentations.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              {t("presentationsPage.noSearchResults")}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPresentations.map((presentation) => (
                <PresentationCard
                  key={presentation.id}
                  presentation={presentation}
                  hasAccess={hasAccess(presentation)}
                  categoryName={presentation.categoryName}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Category Carousels */
        flatCategories.map((category) => (
          <CategoryCarousel
            key={category.id}
            category={category}
            hasAccess={hasAccess}
          />
        ))
      )}
    </div>
  );
}

function CategoryCarousel({ category, hasAccess }: PresentationCategoryCarouselProps) {
  const { locale } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  React.useEffect(() => {
    checkScrollability();
    window.addEventListener("resize", checkScrollability);
    return () => window.removeEventListener("resize", checkScrollability);
  }, [checkScrollability]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.75;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (category.presentations.length === 0) return null;

  return (
    <section className="relative">
      {/* Category Header */}
      <div className="mb-4 px-1">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {category.name}
        </h2>
      </div>

      {/* Carousel Container */}
      <div className="relative group">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute start-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100 -translate-x-1/2 cursor-pointer"
            aria-label={locale === "he" ? "הבא" : "Previous"}
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}

        {/* Scrollable Row */}
        <div
          ref={scrollRef}
          onScroll={checkScrollability}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {category.presentations.map((presentation) => (
            <PresentationCard
              key={presentation.id}
              presentation={presentation}
              hasAccess={hasAccess(presentation)}
            />
          ))}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute end-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100 translate-x-1/2 cursor-pointer"
            aria-label={locale === "he" ? "הקודם" : "Next"}
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        )}

        {/* Gradient Fades */}
        {canScrollLeft && (
          <div className="absolute start-0 top-0 bottom-2 w-8 bg-gradient-to-e from-gray-50 dark:from-gray-950 to-transparent pointer-events-none z-[5]" />
        )}
        {canScrollRight && (
          <div className="absolute end-0 top-0 bottom-2 w-8 bg-gradient-to-s from-gray-50 dark:from-gray-950 to-transparent pointer-events-none z-[5]" />
        )}
      </div>
    </section>
  );
}

function PresentationCard({ presentation, hasAccess, categoryName }: PresentationCardProps) {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();

  const thumbnailUrl = presentation.imageUrls.length > 0 ? presentation.imageUrls[0] : null;

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/presentations/${presentation.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showSuccess(t("presentations.linkCopied"));
    } catch {
      showError(t("presentations.copyError"));
    }
  };

  return (
    <div className="flex-shrink-0 w-[300px] sm:w-[340px] md:w-[360px]">
      <Link
        href={`/presentations/${presentation.id}`}
        className="block bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
        onClick={(e) => !hasAccess && e.preventDefault()}
      >
        {/* Thumbnail */}
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-900">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={presentation.title}
              fill
              className={`object-cover ${!hasAccess ? "grayscale-[40%] brightness-75" : ""}`}
              sizes="(max-width: 640px) 280px, (max-width: 768px) 300px, 320px"
            />
          ) : (
            <PresentationPlaceholder
              id={presentation.id}
              className={`w-full h-full ${!hasAccess ? "grayscale-[40%]" : ""}`}
            />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Slides count badge */}
          {presentation.imageUrls.length > 0 && (
            <div className="absolute bottom-2 start-2 flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-md text-white text-xs">
              <Images className="w-3 h-3" />
              <span>{presentation.imageUrls.length} {t("presentationsPage.slides")}</span>
            </div>
          )}

          {/* Premium badge */}
          {presentation.isPremium && (
            <div className="absolute top-2 start-2">
              <PremiumBadge size="sm" />
            </div>
          )}

          {/* Action buttons - top right */}
          <div className="absolute top-2 end-2 z-20 flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-colors cursor-pointer"
              title={t("common.share")}
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
            <FavoriteButton itemId={presentation.id} itemType="PRESENTATION" size="sm" />
          </div>

          {/* Lock overlay for premium content */}
          {!hasAccess && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
              <div className="w-14 h-14 rounded-full bg-gray-800/80 flex items-center justify-center">
                <Lock className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          )}
        </div>

        {/* Content - fixed height for consistency */}
        <div className="p-4 h-[120px] flex flex-col">
          <h3
            className={`font-semibold line-clamp-2 mb-1 transition-colors ${
              hasAccess
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {presentation.title}
          </h3>
          {categoryName && (
            <p className="text-xs text-green-600 dark:text-green-400 mb-1">
              {categoryName}
            </p>
          )}
          <p
            className={`text-sm line-clamp-2 mt-auto ${
              hasAccess
                ? "text-gray-600 dark:text-gray-400"
                : "text-gray-400 dark:text-gray-500"
            }`}
          >
            {presentation.description ? presentation.description.replace(/<[^>]*>?/gm, "") : ""}
          </p>
        </div>
      </Link>
    </div>
  );
}
