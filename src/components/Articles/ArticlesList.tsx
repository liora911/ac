"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useArticles, useSearchArticles } from "../../hooks/useArticles";
import { Article } from "../../types/Articles/articles";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "../../constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";

interface ArticlesListProps {
  initialLimit?: number;
  showFilters?: boolean;
  showPagination?: boolean;
  categoryId?: string;
  featuredOnly?: boolean;
}

export default function ArticlesList({
  initialLimit = 12,
  showFilters = true,
  showPagination = true,
  categoryId,
  featuredOnly = false,
}: ArticlesListProps) {
  const { data: session } = useSession();
  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryId || "");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    "PUBLISHED" | "DRAFT" | "ARCHIVED" | ""
  >("");

  const {
    data: articlesData,
    isLoading,
    error,
    isFetching,
    refetch, // Add refetch from useArticles
  } = searchQuery
    ? useSearchArticles(searchQuery, {
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

  const handleStatusChange = (status: string) => {
    setStatusFilter(status as any);
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
                {}
                <option value="tech">{t("articleForm.categoryTech")}</option>
                <option value="science">
                  {t("articleForm.categoryScience")}
                </option>
                <option value="philosophy">
                  {t("articleForm.categoryPhilosophy")}
                </option>
              </select>
            </div>

            {}
            {isAuthorized && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("articleForm.statusLabel")}
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusChange(e.target.value)}
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
            )}

            {}
            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                {isLoading ? (
                  t("loading")
                ) : (
                  <>
                    {total} {t("articlesPage.articlesFound")}
                  </>
                )}
              </div>
            </div>
          </div>
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
      {!isLoading && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              isAuthorized={!!isAuthorized}
              onDeleteSuccess={refetch} // Pass refetch to ArticleCard
            />
          ))}
        </div>
      )}

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
          {isAuthorized && (
            <Link
              href="/articles/create"
              className="inline-flex items-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {t("articlesPage.createFirstArticle")}
            </Link>
          )}
        </div>
      )}

      {}
      {showPagination && totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || isFetching}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
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
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
  onDeleteSuccess: () => void; // Add onDeleteSuccess prop
}

function ArticleCard({
  article,
  isAuthorized,
  onDeleteSuccess,
}: ArticleCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
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

  const handleDelete = async () => {
    if (confirm(t("articleCard.deleteConfirm") as string)) {
      try {
        const response = await fetch(`/api/articles/${article.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`Failed to delete article: ${response.statusText}`);
        }

        onDeleteSuccess(); // Call the callback to refresh the list
        router.push("/articles"); // Redirect to articles list after deletion
      } catch (error) {
        console.error("Error deleting article:", error);
        alert(t("articleCard.deleteError") as string); // Assuming a new translation key for delete error
      }
    }
  };

  return (
    <article className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
      {}
      {article.featuredImage && (
        <div className="relative h-48 overflow-hidden">
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
        </div>
      )}

      {}
      <div className="p-6">
        {}
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

        {}
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          <Link
            href={`/articles/${article.id}`}
            className="hover:text-blue-600 transition-colors"
          >
            {article.title}
          </Link>
        </h3>

        {}
        {article.excerpt && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {article.excerpt}
          </p>
        )}

        {}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-2">
            {article.author.image && (
              <Image
                src={article.author.image}
                alt={
                  article.author.name ||
                  (t("articleCard.authorAnonymous") as string)
                }
                width={24}
                height={24}
                className="rounded-full"
              />
            )}
            <span>
              {article.author.name || t("articleCard.authorAnonymous")}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span>
              {article.readTime} {t("articleCard.minRead")}
            </span>
            <span>{formatDate(article.createdAt)}</span>
          </div>
        </div>

        {}
        {article.category && (
          <div className="mt-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {article.category.name}
            </span>
          </div>
        )}

        {}
        {isAuthorized && (
          <div className="mt-4 flex space-x-2">
            <Link
              href={`/articles/${article.id}/edit`}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {t("articleCard.editButton")}
            </Link>
            <button
              onClick={handleDelete}
              className="text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              {t("articleCard.deleteButton")}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
