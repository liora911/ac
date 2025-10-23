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

  // Filters / state
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
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingArticle, setPendingArticle] = useState<Article | null>(null);

  // Reset to first page when filters change (except page itself)
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
          // local refresh
          refetch();
        },
      }
    );
  };

  const onChangeCategory = (article: Article, newCategoryId: string) => {
    // Allow clearing category with empty string
    updateMutation.mutate(
      { id: article.id, categoryId: newCategoryId || undefined },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  const onDelete = (article: Article) => {
    setPendingArticle(article);
    setConfirmModalOpen(true);
  };

  const confirmDelete = () => {
    if (!pendingArticle) return;
    deleteMutation.mutate(pendingArticle.id, {
      onSuccess: () => {
        refetch();
      },
      onSettled: () => {
        setConfirmModalOpen(false);
        setPendingArticle(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Articles Management
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Create, search, filter and manage article status and categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/articles/create"
            className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New Article
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or content…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Per page
            </label>
            <select
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

        <div className="mt-3 text-xs text-gray-500">
          {isFetching ? "Refreshing…" : `Found ${total} articles`}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="h-4 w-48 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="h-8 w-32 bg-gray-200 rounded ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : articles.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    No articles found. Try adjusting filters or create a new
                    one.
                  </td>
                </tr>
              ) : (
                articles.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {a.title}
                        </div>
                        <div className="text-xs text-gray-500">ID: {a.id}</div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={[
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          a.status === "PUBLISHED"
                            ? "bg-green-100 text-green-800"
                            : a.status === "DRAFT"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800",
                        ].join(" ")}
                      >
                        {a.status}
                      </span>
                      <div className="mt-2">
                        <button
                          onClick={() => onTogglePublish(a)}
                          disabled={updateMutation.isPending}
                          className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {a.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={a.categoryId || ""}
                        onChange={(e) => onChangeCategory(a, e.target.value)}
                        disabled={updateMutation.isPending || loadingCategories}
                        className="px-2 py-1 text-sm border border-gray-300 rounded-md"
                      >
                        <option value="">No category</option>
                        {categories?.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(a.updatedAt).toLocaleString()}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/articles/${a.id}`}
                          className="text-sm text-gray-700 hover:text-gray-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/articles/${a.id}/edit`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => onDelete(a)}
                          disabled={deleteMutation.isPending}
                          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isFetching}
              className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
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
                    "px-3 py-2 text-sm font-medium rounded-md",
                    p === page
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 bg-white border border-gray-300 hover:bg-gray-50",
                  ].join(" ")}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isFetching}
              className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}
      {confirmModalOpen && (
        <Modal
          isOpen={confirmModalOpen}
          onClose={() => {
            setConfirmModalOpen(false);
            setPendingArticle(null);
          }}
          title="Confirm Deletion"
          message={`Delete article "${
            pendingArticle?.title ?? ""
          }"? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={confirmDelete}
          showCancel
          cancelText="Cancel"
        />
      )}
    </div>
  );
}
