"use client";

import React, { useState, Suspense, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useArticles,
  useSearchArticles,
  useCategories,
} from "../../hooks/useArticles";
import type { Article, ArticlesListProps, SortOption } from "../../types/Articles/articles";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { X, Star, ArrowUpDown, Share2, Grid3X3, List, Filter } from "lucide-react";
import { useNotification } from "@/contexts/NotificationContext";
import AuthorAvatars from "./AuthorAvatars";
import FavoriteButton from "@/components/FavoriteButton";
import PremiumBadge from "@/components/PremiumBadge";
import SemanticSearch from "./SemanticSearch";
import { useCategoryPreferences } from "@/contexts/CategoryPreferencesContext";
import { Settings2 } from "lucide-react";
import BottomSheet from "@/components/BottomSheet/BottomSheet";
import MobileArticleCard from "./MobileArticleCard";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { DEFAULT_ARTICLE_IMAGE } from "@/constants/images";
import { shareUrl } from "@/lib/utils/share";
import { formatDate, formatDateShort } from "@/lib/utils/date";
import { stripHtml } from "@/lib/utils/stripHtml";

// Pure function - defined outside component to avoid recreation on every render
const getSortParams = (option: SortOption) => {
  switch (option) {
    case "newest":
      return { sortBy: "createdAt" as const, sortOrder: "desc" as const };
    case "oldest":
      return { sortBy: "createdAt" as const, sortOrder: "asc" as const };
    case "title-asc":
      return { sortBy: "title" as const, sortOrder: "asc" as const };
    case "title-desc":
      return { sortBy: "title" as const, sortOrder: "desc" as const };
    default:
      return { sortBy: "createdAt" as const, sortOrder: "desc" as const };
  }
};

// Wrapper component to handle Suspense for useSearchParams
export default function ArticlesList(props: ArticlesListProps) {
  return (
    <Suspense fallback={<ArticlesListSkeleton />}>
      <ArticlesListContent {...props} />
    </Suspense>
  );
}

// Skeleton loader for the suspense fallback
function ArticlesListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full max-w-md" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ArticlesListContent({
  initialLimit = 12,
  showFilters = true,
  showPagination = true,
  categoryId,
  featuredOnly = false,
  viewMode: initialViewMode = "grid",
}: ArticlesListProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Category preferences for filtering
  const {
    selectedCategoryIds: preferredCategories,
    shouldFilterContent,
    resetPreferences,
  } = useCategoryPreferences();

  // Read URL params for initial state
  const urlCategoryId = searchParams.get("c");
  const urlPage = searchParams.get("page");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryId || urlCategoryId || "");
  const [currentPage, setCurrentPage] = useState(urlPage ? parseInt(urlPage, 10) : 1);
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Sort state - combined sortBy and sortOrder for easier dropdown handling
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  // Debounce search query to prevent API call on every keystroke
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 350);

  const { sortBy, sortOrder } = getSortParams(sortOption);

  const {
    data: articlesData,
    isLoading,
    error,
    isFetching,
  } = debouncedSearchQuery
    ? useSearchArticles(debouncedSearchQuery, {
        page: currentPage,
        limit: initialLimit,
        categoryId: selectedCategory || undefined,
        sortBy,
        sortOrder,
      })
    : useArticles({
        page: currentPage,
        limit: initialLimit,
        categoryId: selectedCategory || undefined,
        featured: featuredOnly || undefined,
        sortBy,
        sortOrder,
      });

  const { data: categories, isLoading: isLoadingCategories } = useCategories();


  // Update URL when filters change
  const updateURL = useCallback((categoryId: string | null, page: number) => {
    const params = new URLSearchParams();
    if (categoryId) {
      params.set("c", categoryId);
    }
    if (page > 1) {
      params.set("page", page.toString());
    }
    const queryString = params.toString();
    router.push(queryString ? `/articles?${queryString}` : "/articles", { scroll: false });
  }, [router]);

  // Memoize selected category data to avoid duplicate lookups
  const selectedCategoryData = useMemo(() => {
    return categories?.find((c) => c.id === selectedCategory);
  }, [categories, selectedCategory]);

  // Get raw articles from API
  const rawArticles = articlesData?.articles || [];

  // Filter articles by user's category preferences (client-side filtering)
  const articles = useMemo(() => {
    if (!shouldFilterContent) return rawArticles;
    return rawArticles.filter((article: Article) => {
      // Check if article has any category that matches user's preferences
      const articleCategoryIds = [
        ...(article.categories?.map((c: { id: string }) => c.id) || []),
        article.category?.id,
      ].filter(Boolean) as string[];

      // If article has no categories, include it by default
      if (articleCategoryIds.length === 0) return true;

      // Check if any of the article's categories match user preferences
      return articleCategoryIds.some((catId) =>
        preferredCategories.includes(catId)
      );
    });
  }, [rawArticles, shouldFilterContent, preferredCategories]);

  const totalPages = articlesData?.totalPages || 1;
  const total = shouldFilterContent ? articles.length : (articlesData?.total || 0);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setCurrentPage(1);
  }, []);

  const handleCategoryChange = useCallback((newCategoryId: string) => {
    setSelectedCategory(newCategoryId);
    setCurrentPage(1);
    updateURL(newCategoryId || null, 1);
  }, [updateURL]);

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortOption(sort);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    updateURL(selectedCategory || null, page);
  }, [selectedCategory, updateURL]);

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg font-semibold mb-2">
          {t("articleForm.errorLoading")}
        </div>
        <p className="text-gray-600">
          {error.message || t("articleForm.errorMessage")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Preference Indicator */}
      {shouldFilterContent && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
            <Settings2 className="w-4 h-4" />
            <span className="text-sm font-medium">
              {t("categoryPreferences.filterActive") || "Filtered by your preferences"}
            </span>
            <span className="text-xs text-purple-500 dark:text-purple-400">
              ({preferredCategories.length} {preferredCategories.length === 1 ? t("categoryPreferences.categorySelected") : t("categoryPreferences.categoriesSelected")})
            </span>
          </div>
          <button
            onClick={resetPreferences}
            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 underline"
          >
            {t("categoryPreferences.resetToAll") || "Show all content"}
          </button>
        </div>
      )}

      {/* Mobile: Filter button + Results count */}
      {showFilters && (
        <div className="sm:hidden">
          <div className="flex items-center justify-between gap-3 mb-4">
            <button
              onClick={() => setIsFilterSheetOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="font-medium">{t("articlesPage.filters")}</span>
              {(selectedCategory || searchQuery) && (
                <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {[selectedCategory, searchQuery].filter(Boolean).length}
                </span>
              )}
            </button>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {isLoading ? (
                t("loading")
              ) : (
                t("articlesPage.articlesFound").replace("{total}", total.toString())
              )}
            </div>
          </div>

          {/* Mobile Bottom Sheet for Filters */}
          <BottomSheet
            isOpen={isFilterSheetOpen}
            onClose={() => setIsFilterSheetOpen(false)}
            title={t("articlesPage.filters")}
          >
            <div className="space-y-4">
              {/* Search */}
              <div>
                <SemanticSearch
                  onSearch={handleSearch}
                  onClear={handleClearSearch}
                />
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("articleForm.categoryLabel")}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="">{t("articleForm.allCategories")}</option>
                  {isLoadingCategories ? (
                    <option disabled>{t("articleForm.loadingCategories")}</option>
                  ) : (
                    categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t("articlesPage.sortBy") || "Sort by"}
                </label>
                <select
                  value={sortOption}
                  onChange={(e) => handleSortChange(e.target.value as SortOption)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="newest">{t("articlesPage.sortNewest") || "Newest first"}</option>
                  <option value="oldest">{t("articlesPage.sortOldest") || "Oldest first"}</option>
                  <option value="title-asc">{t("articlesPage.sortTitleAZ") || "Title A-Z"}</option>
                  <option value="title-desc">{t("articlesPage.sortTitleZA") || "Title Z-A"}</option>
                </select>
              </div>

              {/* Apply button */}
              <button
                onClick={() => setIsFilterSheetOpen(false)}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors mt-4"
              >
                {t("articlesPage.applyFilters")}
              </button>
            </div>
          </BottomSheet>
        </div>
      )}

      {/* Desktop: Full filter panel */}
      {showFilters && (
        <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
          {/* Search Component */}
          <div className="mb-4">
            <SemanticSearch
              onSearch={handleSearch}
              onClear={handleClearSearch}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t("articleForm.categoryLabel")}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">{t("articleForm.allCategories")}</option>
                {isLoadingCategories ? (
                  <option disabled>{t("articleForm.loadingCategories")}</option>
                ) : (
                  categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Sort, View Toggle and Results Count Row */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("articlesPage.sortBy") || "Sort by:"}
              </label>
              <select
                value={sortOption}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="newest">{t("articlesPage.sortNewest") || "Newest first"}</option>
                <option value="oldest">{t("articlesPage.sortOldest") || "Oldest first"}</option>
                <option value="title-asc">{t("articlesPage.sortTitleAZ") || "Title A-Z"}</option>
                <option value="title-desc">{t("articlesPage.sortTitleZA") || "Title Z-A"}</option>
              </select>
            </div>

            {/* View Toggle and Results Count */}
            <div className="flex items-center gap-3">
              {/* Results Count */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {isLoading ? (
                  t("loading")
                ) : (
                  t("articlesPage.articlesFound").replace(
                    "{total}",
                    total.toString()
                  )
                )}
              </div>

              {/* View Toggle Buttons */}
              <div className="flex items-center gap-1 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  title="Grid view"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded transition-colors ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedCategory || searchQuery) && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t("articlesPage.activeFilters") || "Active filters:"}
              </span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {t("articleForm.searchLabel")}: &quot;{searchQuery}&quot;
                  <button
                    onClick={() => handleSearch("")}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedCategoryData && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  {selectedCategoryData.name}
                  <button
                    onClick={() => handleCategoryChange("")}
                    className="hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  handleSearch("");
                  handleCategoryChange("");
                }}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                {t("articlesPage.clearAllFilters") || "Clear all"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Category Description */}
      {selectedCategoryData?.description && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            {stripHtml(selectedCategoryData.description)}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <>
          {/* Mobile Loading Skeleton */}
          <div className="sm:hidden space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 animate-pulse"
              >
                <div className="flex gap-3">
                  <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/2" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Loading Skeleton */}
          <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: initialLimit }).map((_, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Mobile: Compact card list */}
      {!isLoading && articles.length > 0 && (
        <div className="sm:hidden space-y-3">
          {articles.map((article) => (
            <MobileArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      {/* Desktop: Articles Grid/List */}
      {!isLoading &&
        articles.length > 0 && (
          <div className="hidden sm:block">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.slug || article.id}`}
                    className="group block"
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all p-4">
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        {article.featuredImage && (
                          <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden">
                            <Image
                              src={article.featuredImage}
                              alt={article.title}
                              width={128}
                              height={128}
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                              sizes="128px"
                            />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          {/* Top Section */}
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                                {article.title}
                              </h3>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {article.isPremium && <PremiumBadge size="sm" />}
                                {article.isFeatured && (
                                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                )}
                              </div>
                            </div>

                            {article.subtitle && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">
                                {article.subtitle}
                              </p>
                            )}

                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                              {stripHtml(article.excerpt || "")}
                            </p>
                          </div>

                          {/* Bottom Section - Meta */}
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                            {article.authors && article.authors.length > 0 ? (
                              <div className="flex items-center gap-2">
                                <AuthorAvatars authors={article.authors} size="sm" />
                              </div>
                            ) : (
                              <span>
                                {article.publisherName || article.author?.name || "Anonymous"}
                              </span>
                            )}
                            <span>•</span>
                            <span>{article.readTime} {t("articleCard.minRead")}</span>
                            <span>•</span>
                            <span>
                              {formatDateShort(article.createdAt, locale)}
                            </span>
                            {article.category && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600 dark:text-blue-400">
                                  {article.category.name}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

      {/* Empty State */}
      {!isLoading && articles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {t("articlesPage.noArticlesFound")}
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? t("articlesPage.noArticlesMatch").replace(
                  "{query}",
                  searchQuery
                )
              : t("articlesPage.noArticlesAvailable")}
          </p>
        </div>
      )}

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isFetching}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {t("articlesPage.previousButton")}
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page =
                Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  disabled={isFetching}
                  className={`px-3 py-2 text-sm font-medium rounded-md cursor-pointer ${
                    page === currentPage
                      ? "bg-blue-600 text-white"
                      : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || isFetching}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {t("articlesPage.nextButton")}
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

const ArticleCard = React.memo(function ArticleCard({ article }: { article: Article }) {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  const { showSuccess } = useNotification();

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/articles/${article.slug || article.id}`;
    await shareUrl(url);
    showSuccess(t("articleDetail.linkCopied"));
  };

  // Check if user has premium access
  const hasAccess = !article.isPremium || session?.user?.role === "ADMIN" || session?.user?.hasActiveSubscription;

  // Default fallback image for articles without a featured image
  const displayImage = article.featuredImage || DEFAULT_ARTICLE_IMAGE;

  return (
    <article className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-shadow relative flex flex-col ${
      hasAccess ? "hover:shadow-md" : ""
    }`}>
      {/* Overlay for non-accessible premium content */}
      {!hasAccess && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-[5] rounded-lg pointer-events-none" />
      )}

      {/* Top Section: Image with Title Overlay */}
      <Link href={`/articles/${article.slug || article.id}`} className="block relative">
        <div className={`relative h-52 overflow-hidden ${!hasAccess ? "grayscale-[30%]" : ""}`}>
          <Image
            src={displayImage}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Dark gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Featured badge */}
          {article.isFeatured && (
            <div className="absolute top-3 left-3 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">
              {t("articleCard.featured")}
            </div>
          )}

          {/* Favorite Button */}
          <div className="absolute top-3 right-3 z-10">
            <FavoriteButton itemId={article.id} itemType="ARTICLE" size="sm" />
          </div>

          {/* Title overlaid on image */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-lg font-semibold text-white line-clamp-2 drop-shadow-md">
              {article.title}
            </h3>
            {article.subtitle && (
              <p className="text-sm text-gray-200 line-clamp-1 mt-1 drop-shadow-md">
                {article.subtitle}
              </p>
            )}
          </div>
        </div>
      </Link>

      {/* Bottom Section: Metadata on white background */}
      <div className="p-4 flex flex-col flex-1">
        {/* Excerpt if available */}
        {article.excerpt && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {stripHtml(article.excerpt)}
          </p>
        )}

        {/* Spacer to push metadata to bottom */}
        <div className="flex-1" />

        {/* Author(s) and Read Time */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <div className="flex items-center gap-2">
            {article.authors && article.authors.length > 0 ? (
              <AuthorAvatars authors={article.authors} size="sm" />
            ) : (
              <div className="flex items-center space-x-2">
                {article.author?.image && (
                  <Image
                    src={article.author.image}
                    alt={
                      article.author.name ||
                      article.publisherName ||
                      (t("articleCard.authorAnonymous") as string)
                    }
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                )}
                <span className="truncate max-w-[100px]">{article.publisherName || article.author?.name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span>
              {article.readTime} {t("articleCard.minRead")}
            </span>
            <button
              onClick={handleShare}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={t("articleDetail.share")}
            >
              <Share2 className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Date, Categories, and Premium indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            <span className="text-xs text-gray-400 flex-shrink-0">{formatDate(article.createdAt, locale)}</span>
            {(article.categories && article.categories.length > 0) ? (
              article.categories.slice(0, 1).map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 truncate max-w-[80px]"
                >
                  {cat.name}
                </span>
              ))
            ) : article.category ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 truncate max-w-[80px]">
                {article.category.name}
              </span>
            ) : null}
          </div>
          {/* Premium badge indicator */}
          {article.isPremium && <PremiumBadge size="sm" />}
        </div>
      </div>
    </article>
  );
});

ArticleCard.displayName = "ArticleCard";
