"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import {
  usePresentations,
  useUpdatePresentation,
  useDeletePresentation,
} from "@/hooks/usePresentations";
import type {
  Presentation,
  PresentationCategory,
} from "@/types/Presentations/presentations";
import LoginForm from "@/components/Login/login";
import Modal from "@/components/Modal/Modal";
import { AlertTriangle, Trash2, RefreshCw } from "lucide-react";
import { useNotification } from "@/contexts/NotificationContext";
import { useTranslation } from "@/hooks/useTranslation";

type StatusFilter = "" | "published" | "unpublished";

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function PresentationsAdmin() {
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
  const [presentationToDelete, setPresentationToDelete] = useState<Presentation | null>(null);

  const { data, isLoading, isFetching, error, refetch } = usePresentations();

  const updateMutation = useUpdatePresentation();
  const deleteMutation = useDeletePresentation();

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

  const allPresentations = useMemo(() => {
    if (!data) return [];
    return data.flatMap((category) => category.presentations);
  }, [data]);

  const filteredPresentations = useMemo(() => {
    let filtered = allPresentations;

    if (debouncedSearch) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          p.description.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    if (status) {
      filtered = filtered.filter((p) =>
        status === "published" ? p.published : !p.published
      );
    }

    if (categoryId) {
      filtered = filtered.filter((p) => p.categoryId === categoryId);
    }

    return filtered;
  }, [allPresentations, debouncedSearch, status, categoryId]);

  const paginatedPresentations = useMemo(() => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return filteredPresentations.slice(start, end);
  }, [filteredPresentations, page, limit]);

  const totalPages = Math.ceil(filteredPresentations.length / limit);
  const total = filteredPresentations.length;

  const onTogglePublish = (presentation: Presentation) => {
    const nextPublished = !presentation.published;
    updateMutation.mutate(
      { id: presentation.id, published: nextPublished },
      {
        onSuccess: () => {
          const statusText = nextPublished
            ? t("admin.presentations.statusPublished")
            : t("admin.presentations.statusUnpublished");
          showSuccess(
            t("admin.presentations.statusChanged")
              .replace("{title}", presentation.title)
              .replace("{status}", statusText)
          );
          refetch();
        },
        onError: () => {
          showError(t("admin.presentations.statusError"));
        },
      }
    );
  };

  const onChangeCategory = (
    presentation: Presentation,
    newCategoryId: string
  ) => {
    updateMutation.mutate(
      { id: presentation.id, categoryId: newCategoryId },
      {
        onSuccess: () => {
          showSuccess(
            t("admin.presentations.categoryUpdated").replace("{title}", presentation.title)
          );
          refetch();
        },
        onError: () => {
          showError(t("admin.presentations.categoryError"));
        },
      }
    );
  };

  const openDeleteModal = (presentation: Presentation) => {
    setPresentationToDelete(presentation);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setPresentationToDelete(null);
  };

  const confirmDelete = () => {
    if (!presentationToDelete) return;

    deleteMutation.mutate(presentationToDelete.id, {
      onSuccess: () => {
        showSuccess(
          t("admin.presentations.deleteSuccess").replace("{title}", presentationToDelete.title)
        );
        refetch();
        closeDeleteModal();
      },
      onError: () => {
        showError(t("admin.presentations.deleteError"));
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/create-presentation"
            className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {t("admin.presentations.newPresentation")}
          </Link>
        </div>
      </div>

      <div
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        role="region"
        aria-labelledby="presentation-filters-heading"
      >
        <h3 id="presentation-filters-heading" className="sr-only">
          {t("admin.presentations.filters")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <label
              htmlFor="presentation-search-input"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("admin.common.search")}
            </label>
            <input
              id="presentation-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.presentations.searchPlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-describedby="presentation-search-help"
            />
            <div id="presentation-search-help" className="sr-only">
              {t("admin.presentations.searchHelp")}
            </div>
          </div>

          <div>
            <label
              htmlFor="presentation-status-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("admin.common.status")}
            </label>
            <select
              id="presentation-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t("admin.common.all")}</option>
              <option value="published">{t("admin.common.published")}</option>
              <option value="unpublished">{t("admin.presentations.unpublished")}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="presentation-category-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("admin.common.category")}
            </label>
            <select
              id="presentation-category-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t("admin.common.allCategories")}</option>
              {data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="presentation-limit-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("admin.common.perPage")}
            </label>
            <select
              id="presentation-limit-select"
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
            {isFetching ? t("admin.common.refreshing") : t("admin.presentations.foundPresentations").replace("{count}", String(total))}
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
            aria-label="Presentations management table"
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
                    aria-label="Loading presentation"
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
              ) : paginatedPresentations.length === 0 ? (
                <tr role="row">
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                    role="cell"
                  >
                    {t("admin.presentations.noPresentationsFound")}
                  </td>
                </tr>
              ) : (
                paginatedPresentations.map((p) => (
                  <tr key={p.id} role="row">
                    <td className="px-4 py-3" role="cell">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {p.title}
                        </div>
                        <div className="text-xs text-gray-500">ID: {p.id}</div>
                      </div>
                    </td>

                    <td className="px-4 py-3" role="cell">
                      <span
                        className={[
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          p.published
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800",
                        ].join(" ")}
                        aria-label={`Status: ${
                          p.published ? t("admin.common.published") : t("admin.presentations.unpublished")
                        }`}
                      >
                        {p.published ? t("admin.common.published") : t("admin.presentations.unpublished")}
                      </span>
                      <div className="mt-2">
                        <button
                          onClick={() => onTogglePublish(p)}
                          disabled={updateMutation.isPending}
                          className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                          aria-label={`${
                            p.published ? t("admin.common.unpublish") : t("admin.common.publish")
                          } presentation "${p.title}"`}
                        >
                          {p.published ? t("admin.common.unpublish") : t("admin.common.publish")}
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3" role="cell">
                      <select
                        value={p.categoryId}
                        onChange={(e) => onChangeCategory(p, e.target.value)}
                        disabled={updateMutation.isPending}
                        className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                        aria-label={`Change category for presentation "${p.title}"`}
                      >
                        {data?.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600" role="cell">
                      <time dateTime={new Date(p.updatedAt).toISOString()}>
                        {new Date(p.updatedAt).toLocaleString()}
                      </time>
                    </td>

                    <td className="px-4 py-3" role="cell">
                      <div
                        className="flex items-center gap-2 justify-end"
                        role="group"
                        aria-label="Presentation actions"
                      >
                        <Link
                          href={`/presentations/${p.id}`}
                          className="text-sm text-gray-700 hover:text-gray-900 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                          aria-label={`${t("admin.common.view")} "${p.title}"`}
                        >
                          {t("admin.common.view")}
                        </Link>
                        <Link
                          href={`/edit-presentation/${p.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                          aria-label={`${t("admin.common.edit")} "${p.title}"`}
                        >
                          {t("admin.common.edit")}
                        </Link>
                        <button
                          onClick={() => openDeleteModal(p)}
                          disabled={deleteMutation.isPending}
                          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                          aria-label={`${t("admin.common.delete")} "${p.title}"`}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        title={t("admin.presentations.deleteTitle")}
        hideFooter
      >
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("admin.presentations.deleteConfirm")}
          </h3>
          <p className="text-gray-600 text-sm mb-6">
            {t("admin.presentations.deleteWarning")}
            <span className="font-medium text-gray-900"> &quot;{presentationToDelete?.title}&quot;</span>.
            <br />
            {t("admin.presentations.deleteIrreversible")}
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
                  {t("admin.presentations.deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {t("admin.presentations.deleteButton")}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {totalPages > 1 && (
        <nav
          className="flex justify-center"
          aria-label="Presentations pagination"
        >
          <div className="flex items-center space-x-2" role="group">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isFetching}
              className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
              aria-label={t("admin.common.previous")}
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
              aria-label={t("admin.common.next")}
            >
              {t("admin.common.next")}
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
