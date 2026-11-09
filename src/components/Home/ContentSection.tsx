"use client";

import React, { useMemo, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, Compass } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useHomePreview, useDiscoverCategories } from "@/hooks/useHomePreview";
import { useRecentlyRead } from "@/hooks/useRecentlyRead";
import type { ContentItem } from "@/types/Home/home";
import { getYouTubeThumbnailFromUrl } from "@/lib/utils/youtube";
import { FETCH_BATCH_SIZE } from "@/constants/pagination";

// Skeleton loader for carousels
const CarouselSkeleton = () => (
  <div className="mb-10">
    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
        />
      ))}
    </div>
  </div>
);

// Lazy load carousel components - they're below the fold and include framer-motion
const CarouselSection = dynamic(() => import("./CarouselSection"), {
  loading: () => <CarouselSkeleton />,
});

const FeaturedCarouselSection = dynamic(() => import("./FeaturedCarouselSection"), {
  loading: () => <CarouselSkeleton />,
});

const MixedCarouselSection = dynamic(() => import("./MixedCarouselSection"), {
  loading: () => <CarouselSkeleton />,
});

const GuestsCarouselSection = dynamic(() => import("./GuestsCarouselSection"));

const ContentSection: React.FC = () => {
  const { t } = useTranslation();
  const { data: previewData, isLoading: previewLoading } = useHomePreview();
  const { data: discoverCategories } = useDiscoverCategories();
  const { data: recentlyRead } = useRecentlyRead();
  const carouselsRef = useRef<HTMLDivElement>(null);

  // "Explore Content" scrolls to the first carousel
  const scrollToCarousels = useCallback(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    carouselsRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  // Convert recently read articles to ContentItem format for carousel
  const recentlyReadItems: ContentItem[] = useMemo(() => {
    if (!recentlyRead || recentlyRead.length === 0) return [];
    return recentlyRead.map((item) => ({
      id: item.id,
      slug: item.slug || undefined,
      title: item.title,
      subtitle: item.subtitle || undefined,
      articleImage: item.articleImage || undefined,
      isPremium: item.isPremium,
      isFeatured: item.isFeatured,
      _contentType: "article" as const,
    }));
  }, [recentlyRead]);

  // Load more items for carousel pagination
  const handleLoadMore = useCallback(async (type: string, skip: number): Promise<{ items: ContentItem[]; hasMore: boolean }> => {
    try {
      const response = await fetch(`/api/home-preview?type=${type}&skip=${skip}&limit=${FETCH_BATCH_SIZE}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      return {
        items: data.items || [],
        hasMore: data.hasMore ?? false,
      };
    } catch (error) {
      console.error("Failed to load more items:", error);
      return { items: [], hasMore: false };
    }
  }, []);

  // Helper functions to get image URLs for each content type
  const getArticleImage = useCallback((item: ContentItem) => {
    return item.articleImage || null;
  }, []);

  const getLectureImage = useCallback((item: ContentItem) => {
    return item.bannerImageUrl || getYouTubeThumbnailFromUrl(item.videoUrl);
  }, []);

  const getEventImage = useCallback((item: ContentItem) => {
    return item.bannerImageUrl || null;
  }, []);

  const getPresentationImage = useCallback((item: ContentItem) => {
    return item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : null;
  }, []);

  // Helper functions to get subtitles
  const getArticleSubtitle = useCallback((item: ContentItem) => {
    return item.subtitle || null;
  }, []);

  const getDescriptionSubtitle = useCallback((item: ContentItem) => {
    return item.description || null;
  }, []);

  // Per-category random items: for each category, pick items from its content
  const categoryCarousels = useMemo(() => {
    if (!discoverCategories) return [];

    return discoverCategories.map((cat) => {
      const pool: ContentItem[] = [
        ...(cat.articles || []).map((item) => ({ ...item, _contentType: "article" as const })),
        ...(cat.lectures || []).map((item) => ({ ...item, _contentType: "lecture" as const })),
        ...(cat.presentations || []).map((item) => ({ ...item, _contentType: "presentation" as const })),
      ];

      // Sort alphabetically by title
      const sorted = [...pool].sort((a, b) => a.title.localeCompare(b.title));

      return {
        id: cat.id,
        name: cat.name,
        items: sorted,
      };
    }).filter((cat) => cat.items.length > 0);
  }, [discoverCategories]);

  const getMixedImage = useCallback((item: ContentItem) => {
    switch (item._contentType) {
      case "article":
        return item.articleImage || null;
      case "lecture":
        return item.bannerImageUrl || getYouTubeThumbnailFromUrl(item.videoUrl);
      case "presentation":
        return item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls[0] : null;
      default:
        return null;
    }
  }, []);

  const getMixedSubtitle = useCallback((item: ContentItem) => {
    switch (item._contentType) {
      case "article":
        return item.subtitle || null;
      case "lecture":
      case "presentation":
        return item.description || null;
      default:
        return null;
    }
  }, []);

  return (
    <section className="py-8 md:py-12 bg-[var(--background)] overflow-x-hidden">
      <div className="px-6 max-w-6xl mx-auto flex items-center gap-4 sm:gap-6 mb-10">
        <span aria-hidden="true" className="h-px flex-1 bg-slate-200 dark:bg-slate-700/70" />
        <h2>
          <button
            type="button"
            onClick={scrollToCarousels}
            className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-100 text-base sm:text-lg font-semibold tracking-tight whitespace-nowrap shadow-sm cursor-pointer transition-colors hover:border-slate-400 hover:bg-slate-50 dark:hover:border-slate-500 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
          >
            <Compass className="w-5 h-5 text-slate-500 dark:text-slate-400 shrink-0" />
            {t("home.sections.exploreContent")}
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 group-hover:translate-y-0.5" />
          </button>
        </h2>
        <span aria-hidden="true" className="h-px flex-1 bg-slate-200 dark:bg-slate-700/70" />
      </div>
      {/* scroll-mt clears the fixed header when "Explore Content" scrolls here */}
      <div ref={carouselsRef} className="scroll-mt-24">

        {previewLoading ? (
          <div className="space-y-10">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {[...Array(6)].map((_, j) => (
                    <div
                      key={j}
                      className="aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {/* Featured Articles */}
            {previewData?.featuredArticles && previewData.featuredArticles.length > 0 && (
              <FeaturedCarouselSection
                title={t("home.sections.featuredArticles")}
                items={previewData.featuredArticles}
                href="/articles?featured=true"
                linkPrefix="/articles"
                useSlug={true}
                contentType="featuredArticles"
                onLoadMore={handleLoadMore}
                getImageUrl={getArticleImage}
                getSubtitle={getArticleSubtitle}
              />
            )}

            {/* Recently Read - only for logged-in users */}
            {recentlyReadItems.length > 0 && (
              <MixedCarouselSection
                title={t("home.sections.recentlyRead")}
                items={recentlyReadItems}
                getImageUrl={getMixedImage}
                getSubtitle={getMixedSubtitle}
              />
            )}

            {/* Presentations */}
            <CarouselSection
              title={t("home.sections.presentations")}
              items={previewData?.presentations || []}
              href="/presentations"
              linkPrefix="/presentations"
              contentType="presentations"
              onLoadMore={handleLoadMore}
              getImageUrl={getPresentationImage}
              getSubtitle={getDescriptionSubtitle}
            />

            {/* Guests — featured only; renders nothing when none are featured */}
            <GuestsCarouselSection />

            {/* Featured Events */}
            {previewData?.featuredEvents && previewData.featuredEvents.length > 0 && (
              <CarouselSection
                title={t("home.sections.featuredEvents")}
                items={previewData.featuredEvents}
                href="/events?featured=true"
                linkPrefix="/events"
                contentType="featuredEvents"
                onLoadMore={handleLoadMore}
                getImageUrl={getEventImage}
                getSubtitle={getDescriptionSubtitle}
              />
            )}

            {/* Events */}
            <CarouselSection
              title={t("home.sections.upcomingEvents")}
              items={previewData?.events || []}
              href="/events"
              linkPrefix="/events"
              contentType="events"
              onLoadMore={handleLoadMore}
              getImageUrl={getEventImage}
              getSubtitle={getDescriptionSubtitle}
            />

            {/* Discover by Category - Random mixed content per category */}
            {categoryCarousels.length > 0 && categoryCarousels.map((cat) => (
              <MixedCarouselSection
                key={cat.id}
                title={cat.name}
                items={cat.items}
                getImageUrl={getMixedImage}
                getSubtitle={getMixedSubtitle}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ContentSection;
