"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import {
  useArticles,
  useCategories,
  useUpdateArticle,
  useDeleteArticle,
} from "@/hooks/useArticles";
import type {
  Article,
  ArticleStatus,
  ArticlesQueryParams,
} from "@/types/Articles/articles";
import LoginForm from "@/components/Login/login";
import Modal from "@/components/Modal/Modal";
import { AlertTriangle, Trash2, RefreshCw, Sparkles, Loader2 } from "lucide-react";
import { useNotification } from "@/contexts/NotificationContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

type StatusFilter = "" | ArticleStatus;

export default function ArticlesAdmin() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );
  const { showSuccess, showError } = useNotification();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const [status, setStatus] = useState<StatusFilter>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);

  // Embedding state
  const [embeddingStatus, setEmbeddingStatus] = useState<{
    total: number;
    withEmbeddings: number;
    withoutEmbeddings: number;
    progress: number;
  } | null>(null);
  const [isGeneratingEmbeddings, setIsGeneratingEmbeddings] = useState(false);
  const [embeddingStatusLoading, setEmbeddingStatusLoading] = useState(false);

  const queryParams: ArticlesQueryParams = useMemo(
    () => ({
      page,
      limit,
      status: status || undefined,
      categoryId: categoryId || undefined,
      search: debouncedSearch || undefined,
      sortBy: "updatedAt",
      sortOrder: "desc",
    }),
    [page, limit, status, categoryId, debouncedSearch]
  );

  const { data, isLoading, isFetching, error, refetch } =
    useArticles(queryParams);
  const { data: categories, isLoading: loadingCategories } = useCategories();

  const updateMutation = useUpdateArticle();
  const deleteMutation = useDeleteArticle();

  useEffect(() => {
    setPage(1);
  }, [status, categoryId, debouncedSearch, limit]);

  if (!isAuthorized) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <p className="mb-4">
          {t("admin.auth.signInRequired")}
        </p>
        <LoginForm />
      </div>
    );
  }

  const articles = data?.articles ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const onTogglePublish = (article: Article) => {
    const nextStatus: ArticleStatus =
      article.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    updateMutation.mutate(
      { id: article.id, status: nextStatus },
      {
        onSuccess: () => {
          const statusText = nextStatus === "PUBLISHED"
            ? t("admin.articles.statusPublished")
            : t("admin.articles.statusDraft");
          showSuccess(
            t("admin.articles.statusChanged")
              .replace("{title}", article.title)
              .replace("{status}", statusText)
          );
          refetch();
        },
        onError: () => {
          showError(t("admin.articles.statusError"));
        },
      }
    );
  };

  const onChangeCategory = (article: Article, newCategoryId: string) => {
    updateMutation.mutate(
      { id: article.id, categoryId: newCategoryId || undefined },
      {
        onSuccess: () => {
          showSuccess(
            t("admin.articles.categoryUpdated").replace("{title}", article.title)
          );
          refetch();
        },
        onError: () => {
          showError(t("admin.articles.categoryError"));
        },
      }
    );
  };

  const openDeleteModal = (article: Article) => {
    setArticleToDelete(article);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setArticleToDelete(null);
  };

  const confirmDelete = () => {
    if (!articleToDelete) return;

    deleteMutation.mutate(articleToDelete.id, {
      onSuccess: () => {
        showSuccess(
          t("admin.articles.deleteSuccess").replace("{title}", articleToDelete.title)
        );
        refetch();
        closeDeleteModal();
      },
      onError: () => {
        showError(t("admin.articles.deleteError"));
      },
    });
  };

  // Fetch embedding status
  const fetchEmbeddingStatus = async () => {
    setEmbeddingStatusLoading(true);
    try {
      const response = await fetch("/api/articles/embeddings");
      if (response.ok) {
        const data = await response.json();
        setEmbeddingStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch embedding status:", err);
    } finally {
      setEmbeddingStatusLoading(false);
    }
  };

  // Generate embeddings for articles without them
  const generateEmbeddings = async () => {
    setIsGeneratingEmbeddings(true);
    try {
      const response = await fetch("/api/articles/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerate: false }),
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess(
          t("admin.embeddings.success")
            .replace("{processed}", String(data.processed))
            .replace("{total}", String(data.total))
        );
        fetchEmbeddingStatus();
      } else {
        const error = await response.json();
        showError(error.error || t("admin.embeddings.error"));
      }
    } catch (err) {
      console.error("Failed to generate embeddings:", err);
      showError(t("admin.embeddings.error"));
    } finally {
      setIsGeneratingEmbeddings(false);
    }
  };

  // Fetch embedding status on mount
  useEffect(() => {
    if (isAuthorized) {
      fetchEmbeddingStatus();
    }
  }, [isAuthorized]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/articles/create"
            className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {t("admin.articles.newArticle")}
          </Link>
        </div>
      </div>

      {/* AI Embeddings Section */}
      <div className="rounded-xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-purple-900">
                {t("admin.embeddings.title")}
              </h3>
              <p className="text-xs text-purple-700">
                {t("admin.embeddings.description")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {embeddingStatusLoading ? (
              <div className="text-xs text-purple-600 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t("admin.common.loading")}
              </div>
            ) : embeddingStatus ? (
              <div className="text-right">
                <div className="text-sm font-medium text-purple-900">
                  {embeddingStatus.withEmbeddings} / {embeddingStatus.total}
                </div>
                <div className="text-xs text-purple-600">
                  {embeddingStatus.withoutEmbeddings > 0
                    ? t("admin.embeddings.pending").replace("{count}", String(embeddingStatus.withoutEmbeddings))
                    : t("admin.embeddings.allComplete")}
                </div>
              </div>
            ) : null}

            <button
              onClick={generateEmbeddings}
              disabled={isGeneratingEmbeddings || (embeddingStatus?.withoutEmbeddings === 0)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingEmbeddings ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("admin.embeddings.generating")}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {t("admin.embeddings.generate")}
                </>
              )}
            </button>

            <button
              onClick={fetchEmbeddingStatus}
              disabled={embeddingStatusLoading}
              className="p-2 text-purple-600 hover:bg-purple-100 rounded-md transition-colors disabled:opacity-50"
              title={t("admin.common.refresh")}
            >
              <RefreshCw className={`w-4 h-4 ${embeddingStatusLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {embeddingStatus && embeddingStatus.total > 0 && (
          <div className="mt-3">
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${embeddingStatus.progress}%` }}
              />
            </div>
            <div className="text-xs text-purple-600 mt-1 text-right">
              {embeddingStatus.progress}% {t("admin.embeddings.complete")}
            </div>
          </div>
        )}
      </div>

      <div
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        role="region"
        aria-labelledby="filters-heading"
      >
        <h3 id="filters-heading" className="sr-only">
          {t("admin.articles.filters")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <label
              htmlFor="search-input"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("admin.common.search")}
            </label>
            <input
              id="search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.articles.searchPlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-describedby="search-help"
            />
            <div id="search-help" className="sr-only">
              {t("admin.articles.searchHelp")}
            </div>
          </div>

          <div>
            <label
              htmlFor="status-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("admin.common.status")}
            </label>
            <select
              id="status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t("admin.common.all")}</option>
              <option value="PUBLISHED">{t("admin.common.published")}</option>
              <option value="DRAFT">{t("admin.common.draft")}</option>
              <option value="ARCHIVED">{t("admin.common.archived")}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="category-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("admin.common.category")}
            </label>
            <select
              id="category-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t("admin.common.allCategories")}</option>
              {loadingCategories ? (
                <option disabled>{t("admin.common.loading")}</option>
              ) : (
                categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="limit-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("admin.common.perPage")}
            </label>
            <select
              id="limit-select"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {[10, 12, 24, 48].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className="mt-3 flex items-center justify-between text-xs text-gray-500"
          aria-live="polite"
          aria-atomic="true"
        >
          <span>
            {isFetching ? t("admin.common.refreshing") : t("admin.articles.foundArticles").replace("{count}", String(total))}
          </span>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-50"
            title={t("admin.common.refresh")}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            {t("admin.common.refresh")}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="min-w-full divide-y divide-gray-200"
            role="table"
            aria-label="Articles management table"
          >
            <thead className="bg-gray-50">
              <tr role="row">
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  role="columnheader"
                  scope="col"
                >
                  {t("admin.common.title")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  role="columnheader"
                  scope="col"
                >
                  {t("admin.common.status")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  role="columnheader"
                  scope="col"
                >
                  {t("admin.common.category")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  role="columnheader"
                  scope="col"
                >
                  {t("admin.common.updated")}
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  role="columnheader"
                  scope="col"
                >
                  {t("admin.common.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <tr
                    key={i}
                    className="animate-pulse"
                    role="row"
                    aria-label="Loading article"
                  >
                    <td className="px-4 py-4" role="cell">
                      <div
                        className="h-4 w-48 bg-gray-200 rounded"
                        aria-hidden="true"
                      ></div>
                    </td>
                    <td className="px-4 py-4" role="cell">
                      <div
                        className="h-6 w-24 bg-gray-200 rounded-full"
                        aria-hidden="true"
                      ></div>
                    </td>
                    <td className="px-4 py-4" role="cell">
                      <div
                        className="h-4 w-32 bg-gray-200 rounded"
                        aria-hidden="true"
                      ></div>
                    </td>
                    <td className="px-4 py-4" role="cell">
                      <div
                        className="h-4 w-24 bg-gray-200 rounded"
                        aria-hidden="true"
                      ></div>
                    </td>
                    <td className="px-4 py-4 text-right" role="cell">
                      <div
                        className="h-8 w-32 bg-gray-200 rounded ml-auto"
                        aria-hidden="true"
                      ></div>
                    </td>
                  </tr>
                ))
              ) : articles.length === 0 ? (
                <tr role="row">
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                    role="cell"
                  >
                    {t("admin.articles.noArticlesFound")}
                  </td>
                </tr>
              ) : (
                articles.map((a) => (
                  <tr key={a.id} role="row">
                    <td className="px-4 py-3" role="cell">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {a.title}
                        </div>
                        <div className="text-xs text-gray-500">ID: {a.id}</div>
                      </div>
                    </td>

                    <td className="px-4 py-3" role="cell">
                      <span
                        className={[
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          a.status === "PUBLISHED"
                            ? "bg-green-100 text-green-800"
                            : a.status === "DRAFT"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800",
                        ].join(" ")}
                        aria-label={`Status: ${a.status}`}
                      >
                        {a.status}
                      </span>
                      <div className="mt-2">
                        <button
                          onClick={() => onTogglePublish(a)}
                          disabled={updateMutation.isPending}
                          className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                          aria-label={`${
                            a.status === "PUBLISHED" ? t("admin.common.unpublish") : t("admin.common.publish")
                          } article "${a.title}"`}
                        >
                          {a.status === "PUBLISHED" ? t("admin.common.unpublish") : t("admin.common.publish")}
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3" role="cell">
                      <select
                        value={a.categoryId || ""}
                        onChange={(e) => onChangeCategory(a, e.target.value)}
                        disabled={updateMutation.isPending || loadingCategories}
                        className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                        aria-label={`Change category for article "${a.title}"`}
                      >
                        <option value="">{t("admin.common.noCategory")}</option>
                        {categories?.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600" role="cell">
                      <time dateTime={a.updatedAt}>
                        {new Date(a.updatedAt).toLocaleString()}
                      </time>
                    </td>

                    <td className="px-4 py-3" role="cell">
                      <div
                        className="flex items-center gap-2 justify-end"
                        role="group"
                        aria-label="Article actions"
                      >
                        <Link
                          href={`/articles/${a.slug || a.id}`}
                          className="text-sm text-gray-700 hover:text-gray-900 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                          aria-label={`View article "${a.title}"`}
                        >
                          {t("admin.common.view")}
                        </Link>
                        <Link
                          href={`/articles/${a.id}/edit`}
                          className="text-sm text-blue-600 hover:text-blue-800 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                          aria-label={`Edit article "${a.title}"`}
                        >
                          {t("admin.common.edit")}
                        </Link>
                        <button
                          onClick={() => openDeleteModal(a)}
                          disabled={deleteMutation.isPending}
                          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                          aria-label={`Delete article "${a.title}"`}
                        >
                          {t("admin.common.delete")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <nav className="flex justify-center" aria-label="Articles pagination">
          <div className="flex items-center space-x-2" role="group">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isFetching}
              className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
              aria-label="Go to previous page"
            >
              {t("admin.common.previous")}
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(totalPages - 4, page - 2));
              const p = start + i;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  disabled={isFetching}
                  className={[
                    "px-3 py-2 text-sm font-medium rounded-md focus:outline-2 focus:outline-blue-500 focus:outline-offset-2",
                    p === page
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 bg-white border border-gray-300 hover:bg-gray-50",
                  ].join(" ")}
                  aria-label={`Go to page ${p}`}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isFetching}
              className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
              aria-label="Go to next page"
            >
              {t("admin.common.next")}
            </button>
          </div>
        </nav>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        title={t("admin.articles.deleteTitle")}
        hideFooter
      >
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("admin.articles.deleteConfirm")}
          </h3>
          <p className="text-gray-600 text-sm mb-6">
            {t("admin.articles.deleteWarning")}
            <span className="font-medium text-gray-900"> "{articleToDelete?.title}"</span>.
            <br />
            {t("admin.articles.deleteIrreversible")}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={closeDeleteModal}
              disabled={deleteMutation.isPending}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              {t("admin.common.cancel")}
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="px-5 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {deleteMutation.isPending ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t("admin.articles.deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {t("admin.articles.deleteButton")}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
