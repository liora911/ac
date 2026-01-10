"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useArticles,
  useSearchArticles,
  useCategories,
} from "../../hooks/useArticles";
import { Article } from "../../types/Articles/articles";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "../../constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";
import Modal from "@/components/Modal/Modal";
import { Grid3X3, List, Tag, X, Star } from "lucide-react";
import AuthorAvatars from "./AuthorAvatars";
import FavoriteButton from "@/components/FavoriteButton";

// Custom hook for debouncing values
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface ArticlesListProps {
  initialLimit?: number;
  showFilters?: boolean;
  showPagination?: boolean;
  categoryId?: string;
  featuredOnly?: boolean;
  viewMode?: "grid" | "list";
}

export default function ArticlesList({
  initialLimit = 12,
  showFilters = true,
  showPagination = true,
  categoryId,
  featuredOnly = false,
  viewMode: initialViewMode = "grid",
}: ArticlesListProps) {
  const { data: session } = useSession();
  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());
  const { t, locale } = useTranslation();
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryId || "");
  const [currentPage, setCurrentPage] = useState(1);
  type StatusFilter = "" | "PUBLISHED" | "DRAFT" | "ARCHIVED";
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);

  // Debounce search query to prevent API call on every keystroke
  const debouncedSearchQuery = useDebouncedValue(searchQuery, 350);

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
        status: statusFilter || undefined,
      })
    : useArticles({
        page: currentPage,
        limit: initialLimit,
        categoryId: selectedCategory || undefined,
        status: statusFilter || undefined,
        featured: featuredOnly || undefined,
      });

  const { data: categories, isLoading: isLoadingCategories } = useCategories();

  const articles = articlesData?.articles || [];
  const totalPages = articlesData?.totalPages || 1;
  const total = articlesData?.total || 0;

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const handleStatusChange = (status: StatusFilter) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
      {showFilters && (
        <div className="flex justify-end mb-4">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              title="Grid view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("articleForm.searchLabel")}
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t("articleForm.searchPlaceholder") as string}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("articleForm.categoryLabel")}
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

            {}
            {
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("articleForm.statusLabel")}
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    handleStatusChange(e.target.value as StatusFilter)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t("articleForm.allStatus")}</option>
                  <option value="PUBLISHED">
                    {t("articleForm.statusPublished")}
                  </option>
                  <option value="DRAFT">{t("articleForm.statusDraft")}</option>
                  <option value="ARCHIVED">
                    {t("articleForm.statusArchived")}
                  </option>
                </select>
              </div>
            }

            {}
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                {isLoading ? (
                  t("loading")
                ) : (
                  <>
                    {t("articlesPage.articlesFound").replace(
                      "{total}",
                      total.toString()
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Category Tags / Quick Filters */}
          {categories && categories.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  {t("articlesPage.quickFilters") || "Quick filters:"}
                </span>
                <button
                  onClick={() => handleCategoryChange("")}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === ""
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t("articleForm.allCategories")}
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategoryChange(category.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Filters Display */}
          {(selectedCategory || searchQuery || statusFilter) && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500">
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
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  {categories?.find((c) => c.id === selectedCategory)?.name}
                  <button
                    onClick={() => handleCategoryChange("")}
                    className="hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {statusFilter && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  {statusFilter}
                  <button
                    onClick={() => handleStatusChange("")}
                    className="hover:bg-yellow-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  handleSearch("");
                  handleCategoryChange("");
                  handleStatusChange("");
                }}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                {t("articlesPage.clearAllFilters") || "Clear all"}
              </button>
            </div>
          )}
        </div>
      )}

      {}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: initialLimit }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border overflow-hidden animate-pulse"
            >
              <div className="h-48 bg-gray-200"></div>
              <div className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      {!isLoading &&
        articles.length > 0 &&
        (viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isAuthorized={!!isAuthorized}
                onDeleteSuccess={() => {
                  console.log("update interface then delete");
                }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {articles.map((article) => (
              <div
                key={article.id}
                className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex">
                  {article.featuredImage && (
                    <div className="w-32 h-24 flex-shrink-0">
                      <Image
                        src={article.featuredImage}
                        alt={article.title}
                        width={128}
                        height={96}
                        className="object-cover w-full h-full"
                        sizes="128px"
                      />
                    </div>
                  )}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          <Link
                            href={`/articles/${article.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {article.title}
                          </Link>
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                          {article.excerpt?.replace(/<[^>]*>?/gm, "") || ""}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center gap-2">
                            {article.authors && article.authors.length > 0 ? (
                              <AuthorAvatars authors={article.authors} size="sm" />
                            ) : (
                              <span>
                                By:{" "}
                                {article.publisherName ||
                                  article.author?.name ||
                                  "Anonymous"}
                              </span>
                            )}
                          </div>
                          <span>{article.readTime} {t("articleCard.minRead")}</span>
                          <span>
                            {new Date(article.createdAt).toLocaleDateString(dateLocale, {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

      {}
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

      {}
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

interface ArticleCardProps {
  article: Article;
  isAuthorized: boolean;
  onDeleteSuccess: () => void;
}

function ArticleCard({ article, isAuthorized }: ArticleCardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isStarHovered, setIsStarHovered] = useState(false);
  const dateLocale = locale === "he" ? "he-IL" : "en-US";

  // Check if user has premium access
  const hasAccess = !article.isPremium || session?.user?.role === "ADMIN" || session?.user?.hasActiveSubscription;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "bg-green-100 text-green-800";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <article className={`bg-white rounded-lg shadow-sm border overflow-hidden transition-shadow relative ${
      hasAccess ? "hover:shadow-md" : ""
    }`}>
      {/* Overlay for non-accessible premium content */}
      {!hasAccess && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-[5] rounded-lg pointer-events-none" />
      )}
      {}
      {article.featuredImage && (
        <div className={`relative h-48 overflow-hidden ${!hasAccess ? "grayscale-[30%]" : ""}`}>
          <Image
            src={article.featuredImage}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {article.isFeatured && (
            <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-semibold">
              {t("articleCard.featured")}
            </div>
          )}
          {/* Favorite Button */}
          <div className="absolute top-2 right-2 z-10">
            <FavoriteButton itemId={article.id} itemType="ARTICLE" size="sm" />
          </div>
        </div>
      )}

      {}
      <div className="p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {isAuthorized && (
              <div className="mb-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    article.status
                  )}`}
                >
                  {article.status}
                </span>
              </div>
            )}
          </div>
          {/* Favorite button for cards without image */}
          {!article.featuredImage && (
            <FavoriteButton itemId={article.id} itemType="ARTICLE" size="sm" />
          )}
        </div>

        {}
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          <Link
            href={`/articles/${article.id}`}
            className="hover:text-blue-600 transition-colors cursor-pointer"
          >
            {article.title}
          </Link>
        </h3>

        {}
        <div className="mb-4">
          {/* <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {t("articleForm.excerptLabel")}
          </span> */}
          {article.excerpt && (
            <p className="text-gray-600 text-sm mt-1 line-clamp-3">
              {article.excerpt.replace(/<[^>]*>?/gm, "")}
            </p>
          )}
        </div>

        {/* Author(s) and Meta Info */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            {article.authors && article.authors.length > 0 ? (
              <AuthorAvatars authors={article.authors} size="sm" />
            ) : (
              // Fallback for articles without the new authors array
              <div className="flex items-center space-x-2">
                {article.author?.image && (
                  <Image
                    src={article.author.image}
                    alt={
                      article.author.name ||
                      article.publisherName ||
                      (t("articleCard.authorAnonymous") as string)
                    }
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                )}
                <span>{article.publisherName || article.author?.name}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <span>
              {article.readTime} {t("articleCard.minRead")}
            </span>
            <span>{formatDate(article.createdAt)}</span>
          </div>
        </div>

        {}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {article.categories && article.categories.length > 0 ? (
              article.categories.map((cat) => (
                <span
                  key={cat.id}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {cat.name}
                </span>
              ))
            ) : article.category ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {article.category.name}
              </span>
            ) : null}
          </div>
          {/* Premium star indicator */}
          {article.isPremium && (
            hasAccess ? (
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push("/pricing");
                }}
                onMouseEnter={() => setIsStarHovered(true)}
                onMouseLeave={() => setIsStarHovered(false)}
                className="w-8 h-8 rounded-full border border-amber-300 hover:bg-amber-50 transition-all flex items-center justify-center cursor-pointer relative z-10 flex-shrink-0"
                aria-label="תוכן פרימיום - הרשם למנוי"
                title="תוכן פרימיום - לחץ להרשמה"
              >
                <Star className={`w-4 h-4 transition-all ${
                  isStarHovered
                    ? "text-amber-500 fill-amber-500"
                    : "text-amber-400"
                }`} />
              </button>
            )
          )}
        </div>
      </div>
      {errorModalOpen && (
        <Modal
          isOpen={errorModalOpen}
          onClose={() => setErrorModalOpen(false)}
          title="שגיאה"
          message={errorMessage}
          confirmText="סגור"
        />
      )}
    </article>
  );
}
