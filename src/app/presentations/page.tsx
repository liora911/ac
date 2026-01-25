"use client";

import React, { Suspense, useMemo } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { usePresentations } from "@/hooks/usePresentations";

// Dynamic import for code splitting - loads only when needed
const PresentationsCarouselView = dynamic(
  () => import("@/components/Presentations/PresentationsCarouselView"),
  {
    loading: () => <PresentationsLoadingSkeleton />,
  }
);

// Loading skeleton component - extracted for reusability
function PresentationsLoadingSkeleton() {
  return (
    <div className="space-y-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-4">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, j) => (
              <div
                key={j}
                className="flex-shrink-0 w-[280px] sm:w-[300px] md:w-[320px] bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Main content component - separated for clean Suspense boundary
function PresentationsPageContent() {
  const { t, locale } = useTranslation();
  const { data: categories, isLoading, error } = usePresentations();

  // Check if there are any presentations across all categories
  const hasPresentations = useMemo(() => {
    return categories?.some(
      (cat) =>
        cat.presentations.length > 0 ||
        cat.subcategories?.some((sub) => sub.presentations.length > 0)
    );
  }, [categories]);

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      {/* Hero Banner */}
      <div className="relative h-[200px] sm:h-[250px] md:h-[300px] overflow-hidden">
        <Image
          src="/gstudioPresentations.jpg"
          alt={t("presentationsPage.title")}
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
              {t("nav.presentations")}
            </h1>
            <p className="mt-2 text-white/80 text-sm sm:text-base max-w-xl mx-auto px-4">
              {t("presentationsPage.subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && <PresentationsLoadingSkeleton />}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-xl text-red-500">
              {t("presentationsPage.errorPrefix")}: {error.message}
            </p>
          </div>
        )}

        {/* Presentations Grid */}
        {!isLoading && !error && categories && hasPresentations && (
          <PresentationsCarouselView categories={categories} />
        )}

        {/* Empty State */}
        {!isLoading && !error && (!categories || !hasPresentations) && (
          <div className="text-center py-12">
            <p className="text-xl text-gray-400">
              {t("presentationsPage.noPresentationsFound")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Default export with Suspense boundary for better hydration
export default function PresentationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <PresentationsPageContent />
    </Suspense>
  );
}
