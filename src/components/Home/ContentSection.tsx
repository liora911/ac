"use client";

import React, { useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useHomePreview, useDiscoverCategories } from "@/hooks/useHomePreview";
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

const ContentSection: React.FC = () => {
  const { t } = useTranslation();
  const { data: previewData, isLoading: previewLoading } = useHomePreview();
  const { data: discoverCategories } = useDiscoverCategories();

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
      <div className="px-6 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-start mb-8 text-[var(--foreground)]">
          {t("home.sections.exploreContent")}
        </h2>
      </div>
      <div>

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

            {/* Recent Articles */}
            <CarouselSection
              title={t("home.sections.recentArticles")}
              items={previewData?.articles || []}
              href="/articles"
              linkPrefix="/articles"
              useSlug={true}
              contentType="articles"
              onLoadMore={handleLoadMore}
              getImageUrl={getArticleImage}
              getSubtitle={getArticleSubtitle}
            />

            {/* Lectures */}
            <CarouselSection
              title={t("home.sections.latestLectures")}
              items={previewData?.lectures || []}
              href="/lectures"
              linkPrefix="/lectures"
              contentType="lectures"
              onLoadMore={handleLoadMore}
              getImageUrl={getLectureImage}
              getSubtitle={getDescriptionSubtitle}
            />

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
