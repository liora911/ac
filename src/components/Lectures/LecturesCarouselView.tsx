"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import type { Category, Lecture, LecturesCarouselViewProps, CategoryCarouselProps, LectureCardProps } from "@/types/Lectures/lectures";
import { Clock, Play, Lock, ChevronLeft, ChevronRight, Search, X, Share2 } from "lucide-react";
import { useNotification } from "@/contexts/NotificationContext";
import PremiumBadge from "@/components/PremiumBadge";
import FavoriteButton from "@/components/FavoriteButton";
import { LecturePlaceholder } from "@/components/Placeholders";
import { getYouTubeVideoId, getYouTubeThumbnail } from "@/lib/utils/youtube";
import LectureModal from "./LectureModal";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

/**
 * Lectures page with horizontal carousels per category.
 * Each category is displayed as a section with a horizontally scrollable row of lecture cards.
 */
export default function LecturesCarouselView({ categories }: LecturesCarouselViewProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // Flatten all lectures for search
  const allLectures = React.useMemo(() => {
    const lectures: (Lecture & { categoryName: string })[] = [];
    const collectLectures = (cats: Category[]) => {
      cats.forEach((cat) => {
        cat.lectures.forEach((lecture) => {
          lectures.push({ ...lecture, categoryName: cat.name });
        });
        if (cat.subcategories) {
          collectLectures(cat.subcategories);
        }
      });
    };
    collectLectures(categories);
    return lectures;
  }, [categories]);

  // Filter lectures based on search
  const filteredLectures = React.useMemo(() => {
    if (!debouncedSearch.trim()) return null;
    const query = debouncedSearch.toLowerCase();
    return allLectures.filter(
      (lecture) =>
        lecture.title.toLowerCase().includes(query) ||
        lecture.description?.toLowerCase().includes(query) ||
        lecture.categoryName.toLowerCase().includes(query)
    );
  }, [allLectures, debouncedSearch]);

  const hasAccess = (lecture: Lecture): boolean =>
    !lecture.isPremium ||
    session?.user?.role === "ADMIN" ||
    !!session?.user?.hasActiveSubscription;

  const handlePlayLecture = (lecture: Lecture) => {
    if (hasAccess(lecture)) {
      setSelectedLecture(lecture);
    }
  };

  // Flatten categories including subcategories for display
  const flatCategories = React.useMemo(() => {
    const result: Category[] = [];
    const flatten = (cats: Category[], depth = 0) => {
      cats.forEach((cat) => {
        if (cat.lectures.length > 0) {
          result.push(cat);
        }
        if (cat.subcategories && cat.subcategories.length > 0) {
          flatten(cat.subcategories, depth + 1);
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
            placeholder={t("lecturesPage.searchPlaceholder")}
            className="w-full ps-12 pe-12 py-3 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute end-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      {filteredLectures !== null ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("lecturesPage.searchResults")} ({filteredLectures.length})
          </h2>
          {filteredLectures.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              {t("lecturesPage.noSearchResults")}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredLectures.map((lecture) => (
                <LectureCard
                  key={lecture.id}
                  lecture={lecture}
                  hasAccess={hasAccess(lecture)}
                  onPlay={handlePlayLecture}
                  categoryName={lecture.categoryName}
                  inGrid={true}
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
            onPlayLecture={handlePlayLecture}
          />
        ))
      )}

      {/* Lecture Modal */}
      <LectureModal
        lecture={selectedLecture}
        onClose={() => setSelectedLecture(null)}
      />
    </div>
  );
}

function CategoryCarousel({ category, hasAccess, onPlayLecture }: CategoryCarouselProps) {
  const { locale } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canGoPrev, setCanGoPrev] = useState(false);
  const [canGoNext, setCanGoNext] = useState(false);

  const updateButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanGoPrev(scrollLeft > 5);
    setCanGoNext(scrollLeft < scrollWidth - clientWidth - 5);
  }, []);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const timer = setTimeout(updateButtons, 100);
    el.addEventListener("scroll", updateButtons);
    window.addEventListener("resize", updateButtons);

    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", updateButtons);
      window.removeEventListener("resize", updateButtons);
    };
  }, [updateButtons]);

  const scroll = (dir: "prev" | "next") => {
    const el = scrollRef.current;
    if (!el) return;

    const amount = el.clientWidth * 0.75;
    el.scrollTo({
      left: el.scrollLeft + (dir === "next" ? amount : -amount),
      behavior: "smooth",
    });
  };

  if (category.lectures.length === 0) return null;

  const isRTL = locale === "he";

  return (
    <section>
      {/* Header with navigation buttons */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          {category.name}
        </h2>

        {/* Navigation arrows in header */}
        <div className="flex gap-2">
          <button
            onClick={() => scroll("prev")}
            disabled={!canGoPrev}
            className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            aria-label={isRTL ? "הבא" : "Previous"}
          >
            <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
          </button>
          <button
            onClick={() => scroll("next")}
            disabled={!canGoNext}
            className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            aria-label={isRTL ? "הקודם" : "Next"}
          >
            <ChevronRight className="w-5 h-5 rtl:rotate-180" />
          </button>
        </div>
      </div>

      {/* Scrollable Row */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {category.lectures.map((lecture) => (
          <LectureCard
            key={lecture.id}
            lecture={lecture}
            hasAccess={hasAccess(lecture)}
            onPlay={onPlayLecture}
          />
        ))}
      </div>
    </section>
  );
}

function LectureCard({ lecture, hasAccess, onPlay, categoryName, inGrid = false }: LectureCardProps) {
  const { t } = useTranslation();
  const { showSuccess, showError } = useNotification();

  const youtubeId = getYouTubeVideoId(lecture.videoUrl);
  const thumbnailUrl =
    lecture.bannerImageUrl || (youtubeId ? getYouTubeThumbnail(youtubeId) : null);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hasAccess) {
      onPlay(lecture);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/lectures/${lecture.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showSuccess(t("lectureDetail.linkCopied"));
    } catch {
      showError(t("lectureDetail.copyError"));
    }
  };

  return (
    <div className={inGrid ? "" : "flex-shrink-0 w-[300px] sm:w-[340px] md:w-[360px]"}>
      <Link
        href={`/lectures/${lecture.id}`}
        className="block bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
        onClick={(e) => !hasAccess && e.preventDefault()}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-900">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={lecture.title}
              className={`w-full h-full object-cover ${!hasAccess ? "grayscale-[40%] brightness-75" : ""}`}
            />
          ) : (
            <LecturePlaceholder
              id={lecture.id}
              className={`w-full h-full ${!hasAccess ? "grayscale-[40%]" : ""}`}
            />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Duration badge */}
          <div className="absolute bottom-2 start-2 flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-md text-white text-xs">
            <Clock className="w-3 h-3" />
            <span>{lecture.duration} {t("lecturesPage.min")}</span>
          </div>

          {/* Premium badge */}
          {lecture.isPremium && (
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
            <FavoriteButton itemId={lecture.id} itemType="LECTURE" size="sm" />
          </div>

          {/* Play button overlay - center */}
          {hasAccess ? (
            <button
              onClick={handlePlayClick}
              className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-blue-600/90 flex items-center justify-center shadow-lg">
                <Play className="w-6 h-6 text-white fill-white ms-0.5" />
              </div>
            </button>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
              <div className="w-14 h-14 rounded-full bg-gray-800/80 flex items-center justify-center">
                <Lock className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 min-h-[120px] flex flex-col">
          <h3
            className={`font-semibold line-clamp-2 mb-1 transition-colors ${
              hasAccess
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {lecture.title}
          </h3>
          {categoryName && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
              {categoryName}
            </p>
          )}
          {lecture.description && (
            <p
              className={`text-sm line-clamp-2 ${
                hasAccess
                  ? "text-gray-600 dark:text-gray-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {lecture.description.replace(/<[^>]*>?/gm, "")}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
