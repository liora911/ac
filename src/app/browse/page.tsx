"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/contexts/Translation/translation.context";
import type { BrowseData, BrowseCategoryItem } from "@/types/Browse/browse";
import { FolderOpen, FileText, Video, Presentation, Calendar } from "lucide-react";

function CategoryCard({ category }: { category: BrowseCategoryItem }) {
  const { locale, t } = useTranslation();
  const hasSubcategories = category.subcategories.length > 0;

  // Use category ID for URL
  const categoryParam = category.id;

  return (
    <div className="space-y-4">
      {/* Main Category */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <FolderOpen className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {category.name}
            </h3>

            {/* Content Type Links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Articles */}
              <Link
                href={`/articles?c=${categoryParam}`}
                className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                  category.counts.articles > 0
                    ? "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    : "border-gray-200 dark:border-gray-800 opacity-50 cursor-not-allowed"
                }`}
                {...(category.counts.articles === 0 && { onClick: (e) => e.preventDefault() })}
              >
                <FileText className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t("nav.articles")}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {category.counts.articles}
                  </span>
                </div>
              </Link>

              {/* Lectures */}
              <Link
                href="/lectures"
                className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                  category.counts.lectures > 0
                    ? "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    : "border-gray-200 dark:border-gray-800 opacity-50 cursor-not-allowed"
                }`}
                {...(category.counts.lectures === 0 && { onClick: (e) => e.preventDefault() })}
              >
                <Video className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t("nav.lectures")}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {category.counts.lectures}
                  </span>
                </div>
              </Link>

              {/* Presentations */}
              <Link
                href="/presentations"
                className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                  category.counts.presentations > 0
                    ? "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    : "border-gray-200 dark:border-gray-800 opacity-50 cursor-not-allowed"
                }`}
                {...(category.counts.presentations === 0 && { onClick: (e) => e.preventDefault() })}
              >
                <Presentation className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t("nav.presentations")}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {category.counts.presentations}
                  </span>
                </div>
              </Link>

              {/* Events */}
              <Link
                href="/events"
                className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
                  category.counts.events > 0
                    ? "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    : "border-gray-200 dark:border-gray-800 opacity-50 cursor-not-allowed"
                }`}
                {...(category.counts.events === 0 && { onClick: (e) => e.preventDefault() })}
              >
                <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t("nav.events")}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {category.counts.events}
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Subcategories */}
      {hasSubcategories && (
        <div className={`${locale === "he" ? "mr-8" : "ml-8"} space-y-4`}>
          {category.subcategories.map((subcategory) => (
            <CategoryCard key={subcategory.id} category={subcategory} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BrowsePage() {
  const { t, locale } = useTranslation();
  const [browseData, setBrowseData] = useState<BrowseData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/browse");
        if (!response.ok) {
          throw new Error("Failed to fetch browse data");
        }
        const data: BrowseData = await response.json();
        setBrowseData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-gray-950"
      style={{ direction: locale === "he" ? "rtl" : "ltr" }}
    >
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t("browse.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("browse.subtitle")}
          </p>
          {browseData && (
            <div className="mt-4 flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {browseData.totalCounts.articles} {t("browse.articles")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {browseData.totalCounts.lectures} {t("browse.lectures")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Presentation className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {browseData.totalCounts.presentations} {t("browse.presentations")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {browseData.totalCounts.events} {t("browse.events")}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400">{error}</p>
          </div>
        )}

        {browseData && (
          <div className="space-y-6">
            {browseData.categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}

            {browseData.categories.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">
                  {t("browse.noCategories")}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
