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
  },
);

function ArticlesPageContent() {
  const { t, locale } = useTranslation();
  const searchParams = useSearchParams();
  const featuredOnly = searchParams.get("featured") === "true";
  const categoryId = searchParams.get("c");
  const bannerSrc =
    categoryId === "cmldlqdpq0001l804wu8113br"
      ? "https://vo7mgluzosvw8wff.public.blob.vercel-storage.com/1773748531902-imjhdr.png"
      : "/gstudioArticles.jpg";

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      {/* Hero Banner */}
      <div
        className={`relative overflow-hidden ${categoryId === "cmldlqdpq0001l804wu8113br" ? "h-[250px] sm:h-[300px] md:h-[400px] lg:h-[500px]" : "h-[200px] sm:h-[250px] md:h-[300px]"}`}
      >
        <Image
          src={bannerSrc}
          alt={t("articlesPage.title")}
          fill
          className={`object-cover ${categoryId === "cmldlqdpq0001l804wu8113br" ? "object-[center_30%]" : ""}`}
          priority
          sizes="100vw"
          quality={85}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-gray-950 via-black/40 to-black/20" />
        {categoryId !== "cmldlqdpq0001l804wu8113br" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                {t("nav.articles")}
              </h1>
              <p className="mt-2 text-white/80 text-sm sm:text-base max-w-xl mx-auto px-4">
                {t("articlesPage.description")}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content — full width: the topics sidebar hugs the wall and the
          grid gets every remaining pixel */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <ArticlesList
          initialLimit={12}
          showFilters={categoryId !== "cmldlqdpq0001l804wu8113br"}
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
