"use client";

import React, { useState, Suspense, useCallback, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useInfiniteArticles,
  useInfiniteSearchArticles,
  useCategories,
} from "../../hooks/useArticles";
import type { Article, ArticlesListProps, SortOption } from "../../types/Articles/articles";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { X, Star, ArrowUpDown, Share2, Grid3X3, List, Filter, ChevronUp, Clock } from "lucide-react";
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
import { formatDateShort } from "@/lib/utils/date";
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

  // Read URL params for initial state (support both ?categoryId= and legacy ?c=)
  const urlCategoryId = searchParams.get("categoryId") || searchParams.get("c");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryId || urlCategoryId || "");
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  // Sort state - combined sortBy and sortOrder for easier dropdown handling
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  // Sync selectedCategory with URL when user navigates back/forward
  useEffect(() => {
    setSelectedCategory(categoryId || urlCategoryId || "");
  }, [categoryId, urlCategoryId]);

  // Debounce search query to prevent API call on every keystroke
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 350);

  const { sortBy, sortOrder } = getSortParams(sortOption);

  // Infinite scroll queries
  const browseQuery = useInfiniteArticles({
    limit: initialLimit,
    categoryId: selectedCategory || undefined,
    featured: featuredOnly || undefined,
    sortBy,
    sortOrder,
  });

  const searchInfiniteQuery = useInfiniteSearchArticles(
    debouncedSearchQuery,
    {
      limit: initialLimit,
      categoryId: selectedCategory || undefined,
      sortBy,
      sortOrder,
    }
  );

  // Pick the active query based on whether user is searching
  const activeQuery = debouncedSearchQuery ? searchInfiniteQuery : browseQuery;
  const { data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } = activeQuery;

  const { data: categories, isLoading: isLoadingCategories } = useCategories();

  // Intersection Observer for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Show "back to top" button when filters scroll out of view
  useEffect(() => {
    const top = topRef.current;
    if (!top) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowScrollTop(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(top);
    return () => observer.disconnect();
  }, []);

  // Track which articles are "new" (from the latest page load) for stagger animation
  const prevCountRef = useRef(0);

  // Update URL when filters change
  const updateURL = useCallback((catId: string | null) => {
    const params = new URLSearchParams();
    if (catId) {
      params.set("categoryId", catId);
    }
    const queryString = params.toString();
    router.push(queryString ? `/articles?${queryString}` : "/articles", { scroll: false });
  }, [router]);

  // Memoize selected category data to avoid duplicate lookups
  const selectedCategoryData = useMemo(() => {
    return categories?.find((c) => c.id === selectedCategory);
  }, [categories, selectedCategory]);

  // Flatten all pages into a single articles array
  const rawArticles = useMemo(() => {
    return data?.pages.flatMap((page) => page.articles) || [];
  }, [data]);

  // Filter articles by user's category preferences (client-side filtering)
  const articles = useMemo(() => {
    if (!shouldFilterContent) return rawArticles;
    return rawArticles.filter((article: Article) => {
      const articleCategoryIds = [
        ...(article.categories?.map((c: { id: string }) => c.id) || []),
        article.category?.id,
      ].filter(Boolean) as string[];
      if (articleCategoryIds.length === 0) return true;
      return articleCategoryIds.some((catId) =>
        preferredCategories.includes(catId)
      );
    });
  }, [rawArticles, shouldFilterContent, preferredCategories]);

  const total = shouldFilterContent ? articles.length : (data?.pages[0]?.total || 0);

  // Track new items for stagger animation
  const newItemStartIdx = prevCountRef.current;
  useEffect(() => {
    prevCountRef.current = articles.length;
  }, [articles.length]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const handleCategoryChange = useCallback((newCategoryId: string) => {
    setSelectedCategory(newCategoryId);
    updateURL(newCategoryId || null);
  }, [updateURL]);

  const handleSortChange = useCallback((sort: SortOption) => {
    setSortOption(sort);
  }, []);

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
      <div ref={topRef} />
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

      {/* Desktop: Category pill bar + compact controls */}
      {showFilters && (
        <div className="hidden sm:flex flex-col gap-3">
          {/* Category pill bar - horizontal scroll */}
          <div className="overflow-x-auto scrollbar-hide -mx-2 px-2 pb-1">
            <div className="flex gap-2 w-max">
              <button
                onClick={() => handleCategoryChange("")}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  !selectedCategory
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                    : "bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 backdrop-blur-sm"
                }`}
              >
                {t("articlesPage.allTopics")}
              </button>
              {!isLoadingCategories && categories?.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id === selectedCategory ? "" : category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    selectedCategory === category.id
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                      : "bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 backdrop-blur-sm"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Compact controls row: search + sort + view toggle + count */}
          <div className="flex items-center gap-3">
            {/* Inline search */}
            <div className="flex-1 max-w-sm">
              <SemanticSearch
                onSearch={handleSearch}
                onClear={handleClearSearch}
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={sortOption}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                <option value="newest">{t("articlesPage.sortNewest")}</option>
                <option value="oldest">{t("articlesPage.sortOldest")}</option>
                <option value="title-asc">{t("articlesPage.sortTitleAZ")}</option>
                <option value="title-desc">{t("articlesPage.sortTitleZA")}</option>
              </select>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-0.5 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                title="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Results count */}
            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {isLoading ? t("loading") : t("articlesPage.articlesFound").replace("{total}", total.toString())}
            </span>
          </div>
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
          {articles.map((article, idx) => {
            const isNew = idx >= newItemStartIdx;
            return (
              <motion.div
                key={article.id}
                initial={isNew ? { opacity: 0, y: 20 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: isNew ? (idx - newItemStartIdx) * 0.05 : 0, ease: "easeOut" }}
              >
                <MobileArticleCard article={article} />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Desktop: Articles Grid/List */}
      {!isLoading &&
        articles.length > 0 && (
          <div className="hidden sm:block">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {articles.map((article, idx) => {
                  const isNew = idx >= newItemStartIdx;
                  const isBento = article.isFeatured && idx < 3;
                  return (
                    <motion.div
                      key={article.id}
                      initial={isNew ? { opacity: 0, y: 30 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: isNew ? (idx - newItemStartIdx) * 0.06 : 0, ease: "easeOut" }}
                      className={isBento ? "md:col-span-2 lg:col-span-2 md:row-span-2" : ""}
                    >
                      <ArticleCard article={article} isBento={isBento} />
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {articles.map((article, idx) => {
                  const isNew = idx >= newItemStartIdx;
                  return (
                    <motion.div
                      key={article.id}
                      initial={isNew ? { opacity: 0, y: 20 } : false}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: isNew ? (idx - newItemStartIdx) * 0.05 : 0, ease: "easeOut" }}
                    >
                    <Link
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
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      {/* Empty State */}
      {!isLoading && articles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t("articlesPage.noArticlesFound")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery
              ? t("articlesPage.noArticlesMatch").replace(
                  "{query}",
                  searchQuery
                )
              : t("articlesPage.noArticlesAvailable")}
          </p>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Scroll to top / back to filters */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => topRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-500/30 transition-colors cursor-pointer"
          aria-label={t("articlesPage.backToTop")}
        >
          <ChevronUp className="w-5 h-5" />
          <span className="text-sm font-medium hidden sm:inline">{t("articlesPage.backToTop")}</span>
        </motion.button>
      )}
    </div>
  );
}

// Category color palette for card accents
const CATEGORY_COLORS = [
  "from-blue-500 to-cyan-500",
  "from-violet-500 to-purple-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-rose-500 to-pink-500",
  "from-indigo-500 to-blue-500",
  "from-lime-500 to-green-500",
  "from-fuchsia-500 to-pink-500",
];

function getCategoryColor(categoryId?: string): string {
  if (!categoryId) return "from-gray-400 to-gray-500";
  let hash = 0;
  for (let i = 0; i < categoryId.length; i++) {
    hash = categoryId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

const ArticleCard = React.memo(function ArticleCard({ article, isBento = false }: { article: Article; isBento?: boolean }) {
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

  const hasAccess = !article.isPremium || session?.user?.role === "ADMIN" || session?.user?.hasActiveSubscription;
  const displayImage = article.featuredImage || DEFAULT_ARTICLE_IMAGE;
  const categoryId = article.categories?.[0]?.id || article.category?.id;
  const categoryName = article.categories?.[0]?.name || article.category?.name;
  const accentGradient = getCategoryColor(categoryId);

  return (
    <article className={`group/card relative rounded-xl overflow-hidden transition-all duration-300 flex flex-col h-full ${
      hasAccess ? "hover:shadow-xl hover:-translate-y-1" : ""
    } ${isBento ? "min-h-[420px]" : ""}`}>
      {/* Category color accent - top edge */}
      <div className={`h-1 w-full bg-gradient-to-r ${accentGradient}`} />

      {/* Overlay for non-accessible premium content */}
      {!hasAccess && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-[1px] z-[5] rounded-xl pointer-events-none" />
      )}

      <Link href={`/articles/${article.slug || article.id}`} className="block relative flex-1 flex flex-col">
        {/* Image section */}
        <div className={`relative overflow-hidden ${isBento ? "h-64" : "h-48"} ${!hasAccess ? "grayscale-[30%]" : ""}`}>
          <Image
            src={displayImage}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover/card:scale-105"
            sizes={isBento ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Top badges row */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            <div className="flex items-center gap-2">
              {article.isFeatured && (
                <span className="flex items-center gap-1 bg-amber-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold shadow-lg">
                  <Star className="w-3 h-3 fill-white" />
                  {t("articlesPage.featured")}
                </span>
              )}
              {article.isPremium && <PremiumBadge size="sm" />}
            </div>
            <FavoriteButton itemId={article.id} itemType="ARTICLE" size="sm" />
          </div>

          {/* Title + hover abstract overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className={`text-white font-bold drop-shadow-lg line-clamp-2 ${isBento ? "text-xl" : "text-base"}`}>
              {article.title}
            </h3>
            {/* Abstract - reveals on hover */}
            {article.excerpt && (
              <p className="text-white/0 group-hover/card:text-white/80 text-sm line-clamp-1 mt-1 drop-shadow-md transition-colors duration-300">
                {stripHtml(article.excerpt)}
              </p>
            )}
          </div>
        </div>

        {/* Bottom metadata section */}
        <div className="bg-white dark:bg-gray-800 p-3.5 flex flex-col flex-1 border-x border-b border-gray-100 dark:border-gray-700/50 rounded-b-xl">
          {/* Reading time + category */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3 h-3" />
                {t("articlesPage.readingTime").replace("{min}", String(article.readTime))}
              </span>
            </div>
            {categoryName && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold text-white bg-gradient-to-r ${accentGradient} shadow-sm`}>
                {categoryName}
              </span>
            )}
          </div>

          <div className="flex-1" />

          {/* Author row + share + date */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2 min-w-0">
              {article.authors && article.authors.length > 0 ? (
                <AuthorAvatars authors={article.authors} size="sm" />
              ) : (
                <span className="truncate max-w-[100px]">{article.publisherName || article.author?.name}</span>
              )}
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className="whitespace-nowrap">{formatDateShort(article.createdAt, locale)}</span>
            </div>
            <button
              onClick={handleShare}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
              title={t("articleDetail.share")}
            >
              <Share2 className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            </button>
          </div>
        </div>
      </Link>
    </article>
  );
});

ArticleCard.displayName = "ArticleCard";
