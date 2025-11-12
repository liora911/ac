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
import { useNotification } from "@/contexts/NotificationContext";

type StatusFilter = "" | ArticleStatus;

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function ArticlesAdmin() {
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
          You must sign in with an authorized account to manage articles.
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
          showSuccess(
            `המאמר "${article.title}" ${
              nextStatus === "PUBLISHED" ? "פורסם" : "הועבר לטיוטה"
            } בהצלחה`
          );
          refetch();
        },
        onError: () => {
          showError("שגיאה בעדכון סטטוס המאמר");
        },
      }
    );
  };

  const onChangeCategory = (article: Article, newCategoryId: string) => {
    updateMutation.mutate(
      { id: article.id, categoryId: newCategoryId || undefined },
      {
        onSuccess: () => {
          showSuccess(`קטגוריית המאמר "${article.title}" עודכנה בהצלחה`);
          refetch();
        },
        onError: () => {
          showError("שגיאה בעדכון קטגוריית המאמר");
        },
      }
    );
  };

  const onDelete = (article: Article) => {
    if (
      !confirm(
        `Delete article "${article.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    deleteMutation.mutate(article.id, {
      onSuccess: () => {
        showSuccess(`המאמר "${article.title}" נמחק בהצלחה`);
        refetch();
      },
      onError: () => {
        showError("שגיאה במחיקת המאמר");
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/articles/create"
            className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New Article
          </Link>
        </div>
      </div>

      <div
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        role="region"
        aria-labelledby="filters-heading"
      >
        <h3 id="filters-heading" className="sr-only">
          Article filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <label
              htmlFor="search-input"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <input
              id="search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or content…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-describedby="search-help"
            />
            <div id="search-help" className="sr-only">
              Search articles by title or content
            </div>
          </div>

          <div>
            <label
              htmlFor="status-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="category-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category
            </label>
            <select
              id="category-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All categories</option>
              {loadingCategories ? (
                <option disabled>Loading…</option>
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
              Per page
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
          className="mt-3 text-xs text-gray-500"
          aria-live="polite"
          aria-atomic="true"
        >
          {isFetching ? "Refreshing…" : `Found ${total} articles`}
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
                  Title
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  role="columnheader"
                  scope="col"
                >
                  Status
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  role="columnheader"
                  scope="col"
                >
                  Category
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  role="columnheader"
                  scope="col"
                >
                  Updated
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  role="columnheader"
                  scope="col"
                >
                  Actions
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
                    No articles found. Try adjusting filters or create a new
                    one.
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
                            a.status === "PUBLISHED" ? "Unpublish" : "Publish"
                          } article "${a.title}"`}
                        >
                          {a.status === "PUBLISHED" ? "Unpublish" : "Publish"}
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
                        <option value="">No category</option>
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
                          href={`/articles/${a.id}`}
                          className="text-sm text-gray-700 hover:text-gray-900 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                          aria-label={`View article "${a.title}"`}
                        >
                          View
                        </Link>
                        <Link
                          href={`/articles/${a.id}/edit`}
                          className="text-sm text-blue-600 hover:text-blue-800 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                          aria-label={`Edit article "${a.title}"`}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => onDelete(a)}
                          disabled={deleteMutation.isPending}
                          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                          aria-label={`Delete article "${a.title}"`}
                        >
                          Delete
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
              Previous
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
              Next
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
