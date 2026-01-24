"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/contexts/Translation/translation.context";

const ArticlesList = dynamic(
  () => import("@/components/Articles/ArticlesList"),
  {
    loading: () => (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    ),
  }
);

function ArticlesPageContent() {
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();
  const featuredOnly = searchParams.get('featured') === 'true';

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      {/* Hero Banner */}
      <div className="relative h-48 md:h-64 lg:h-72 overflow-hidden">
        <Image
          src="/bookwrite.webp"
          alt={t("articlesPage.title")}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">
              {t("nav.articles")}
            </h1>
            <p className="mt-2 text-base md:text-lg text-gray-200">
              {t("articlesPage.description")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ArticlesList
          initialLimit={12}
          showFilters={true}
          showPagination={true}
          viewMode="grid"
          featuredOnly={featuredOnly}
        />
      </div>
    </div>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <ArticlesPageContent />
    </Suspense>
  );
}
