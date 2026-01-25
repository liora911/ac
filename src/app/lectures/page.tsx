"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { CategoryDef } from "@/types/Lectures/lectures";
import { useTranslation } from "@/contexts/Translation/translation.context";

// Dynamic import for code splitting
const LecturesCarouselView = dynamic(
  () => import("@/components/Lectures/LecturesCarouselView"),
  {
    loading: () => <LecturesLoadingSkeleton />,
  }
);

// Loading skeleton component
function LecturesLoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Search skeleton */}
      <div className="max-w-xl mx-auto">
        <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
      </div>
      {/* Carousel skeletons */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse" />
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((j) => (
              <div
                key={j}
                className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px]"
              >
                <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Loading spinner for Suspense fallback
function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );
}

// Main content component
function LecturesPageContent() {
  const { t, locale } = useTranslation();
  const [categories, setCategories] = useState<CategoryDef[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLectures = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/lectures");
        if (!response.ok) {
          throw new Error(`Failed to fetch lectures: ${response.statusText}`);
        }
        const data: CategoryDef[] = await response.json();
        setCategories(data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "An unknown error occurred";
        setError(msg);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLectures();
  }, []);

  // Get a random banner image from categories
  const bannerImage = React.useMemo(() => {
    if (!categories || categories.length === 0) return null;
    const allImages: string[] = [];
    const collectImages = (cats: CategoryDef[]) => {
      cats.forEach((cat) => {
        if (cat.bannerImageUrl) allImages.push(cat.bannerImageUrl);
        cat.lectures.forEach((lecture) => {
          if (lecture.bannerImageUrl) allImages.push(lecture.bannerImageUrl);
        });
        if (cat.subcategories) collectImages(cat.subcategories);
      });
    };
    collectImages(categories);
    return allImages.length > 0 ? allImages[Math.floor(Math.random() * allImages.length)] : null;
  }, [categories]);

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      {/* Hero Banner */}
      <div className="relative h-[200px] sm:h-[250px] md:h-[300px] overflow-hidden">
        <Image
          src={bannerImage || "/lecture.jpg"}
          alt={t("lecturesPage.title")}
          fill
          className="object-cover"
          priority
          sizes="100vw"
          quality={85}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-gray-950 via-black/40 to-black/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
              {t("lecturesPage.title")}
            </h1>
            <p className="mt-2 text-white/80 text-sm sm:text-base max-w-xl mx-auto px-4">
              {t("lecturesPage.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && <LecturesLoadingSkeleton />}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400 text-lg">
              {t("lecturesPage.errorPrefix")}: {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              {t("common.tryAgain")}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && categories && categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {t("lecturesPage.noLecturesFound")}
            </p>
          </div>
        )}

        {/* Lectures Carousel View */}
        {!isLoading && !error && categories && categories.length > 0 && (
          <LecturesCarouselView categories={categories} />
        )}
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function LecturesPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LecturesPageContent />
    </Suspense>
  );
}
