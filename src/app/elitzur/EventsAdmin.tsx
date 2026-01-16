"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useEvents, useUpdateEvent, useDeleteEvent } from "@/hooks/useEvents";
import { useCategories } from "@/hooks/useArticles";
import type { Event } from "@/types/Events/events";
import LoginForm from "@/components/Login/login";
import Modal from "@/components/Modal/Modal";
import { AlertTriangle, Trash2, Ticket, RefreshCw } from "lucide-react";
import { useNotification } from "@/contexts/NotificationContext";
import { useTranslation } from "@/hooks/useTranslation";

type EventStatus = "active" | "cancelled" | "completed";

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function EventsAdmin() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );
  const { showSuccess, showError } = useNotification();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const [status, setStatus] = useState<EventStatus | "">("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useEvents();
  const { data: categories, isLoading: loadingCategories } = useCategories();

  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

  const filteredEvents = useMemo(() => {
    if (!data) return [];

    return data.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        event.description.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory =
        categoryId === "" || event.categoryId === categoryId;

      const matchesStatus = status === "" || status === "active";

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [data, debouncedSearch, categoryId, status]);

  const total = filteredEvents.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedEvents = filteredEvents.slice(
    (page - 1) * limit,
    page * limit
  );

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

  const onChangeCategory = (event: Event, newCategoryId: string) => {
    updateMutation.mutate(
      { id: event.id, categoryId: newCategoryId },
      {
        onSuccess: () => {
          showSuccess(
            t("admin.events.categoryUpdated").replace("{title}", event.title)
          );
          refetch();
        },
        onError: () => {
          showError(t("admin.events.categoryError"));
        },
      }
    );
  };

  const openDeleteModal = (event: Event) => {
    setEventToDelete(event);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setEventToDelete(null);
  };

  const confirmDelete = () => {
    if (!eventToDelete) return;

    deleteMutation.mutate(eventToDelete.id, {
      onSuccess: () => {
        showSuccess(
          t("admin.events.deleteSuccess").replace("{title}", eventToDelete.title)
        );
        refetch();
        closeDeleteModal();
      },
      onError: () => {
        showError(t("admin.events.deleteError"));
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/create-event"
            className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            {t("admin.events.newEvent")}
          </Link>
        </div>
      </div>

      <div
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        role="region"
        aria-labelledby="event-filters-heading"
      >
        <h3 id="event-filters-heading" className="sr-only">
          {t("admin.events.filters")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <label
              htmlFor="event-search-input"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("admin.common.search")}
            </label>
            <input
              id="event-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("admin.events.searchPlaceholder")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-describedby="event-search-help"
            />
            <div id="event-search-help" className="sr-only">
              {t("admin.events.searchHelp")}
            </div>
          </div>

          <div>
            <label
              htmlFor="event-status-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("admin.common.status")}
            </label>
            <select
              id="event-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as EventStatus | "")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t("admin.common.all")}</option>
              <option value="active">{t("admin.common.active")}</option>
              <option value="completed">{t("admin.common.completed")}</option>
              <option value="cancelled">{t("admin.common.cancelled")}</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="event-category-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("admin.common.category")}
            </label>
            <select
              id="event-category-select"
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
              htmlFor="event-limit-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("admin.common.perPage")}
            </label>
            <select
              id="event-limit-select"
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
            {isFetching ? t("admin.common.refreshing") : t("admin.events.foundEvents").replace("{count}", String(total))}
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
            aria-label="Events management table"
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
                  {t("admin.events.dateTime")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  role="columnheader"
                  scope="col"
                >
                  {t("admin.events.type")}
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
                    aria-label="Loading event"
                  >
                    <td className="px-4 py-4" role="cell">
                      <div
                        className="h-4 w-48 bg-gray-200 rounded"
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
                        className="h-6 w-20 bg-gray-200 rounded-full"
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
              ) : paginatedEvents.length === 0 ? (
                <tr role="row">
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                    role="cell"
                  >
                    {t("admin.events.noEventsFound")}
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((event) => (
                  <tr key={event.id} role="row">
                    <td className="px-4 py-3" role="cell">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {event.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {event.id}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600" role="cell">
                      <div>
                        <time
                          dateTime={new Date(event.eventDate).toISOString()}
                        >
                          {new Date(event.eventDate).toLocaleDateString()}
                        </time>
                      </div>
                      {event.eventTime && (
                        <div className="text-xs text-gray-500">
                          {event.eventTime}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3" role="cell">
                      <span
                        className={[
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          event.eventType === "online"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800",
                        ].join(" ")}
                        aria-label={`Event type: ${
                          event.eventType === "online" ? t("admin.common.online") : t("admin.common.inPerson")
                        }`}
                      >
                        {event.eventType === "online" ? t("admin.common.online") : t("admin.common.inPerson")}
                      </span>
                    </td>

                    <td className="px-4 py-3" role="cell">
                      <select
                        value={event.categoryId || ""}
                        onChange={(e) =>
                          onChangeCategory(event, e.target.value)
                        }
                        disabled={updateMutation.isPending || loadingCategories}
                        className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                        aria-label={`Change category for event "${event.title}"`}
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
                      <time
                        dateTime={new Date(
                          event.updatedAt || event.createdAt
                        ).toISOString()}
                      >
                        {new Date(
                          event.updatedAt || event.createdAt
                        ).toLocaleString()}
                      </time>
                    </td>

                    <td className="px-4 py-3" role="cell">
                      <div
                        className="flex items-center gap-2 justify-end"
                        role="group"
                        aria-label="Event actions"
                      >
                        <Link
                          href={`/events/${event.id}`}
                          className="text-sm text-gray-700 hover:text-gray-900 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                          aria-label={`View event "${event.title}"`}
                        >
                          {t("admin.common.view")}
                        </Link>
                        <Link
                          href={`/elitzur/events/${event.id}/tickets`}
                          className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-800 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                          aria-label={`Manage tickets for event "${event.title}"`}
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          {t("admin.events.tickets")}
                        </Link>
                        <Link
                          href={`/edit-event/${event.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                          aria-label={`Edit event "${event.title}"`}
                        >
                          {t("admin.common.edit")}
                        </Link>
                        <button
                          onClick={() => openDeleteModal(event)}
                          disabled={deleteMutation.isPending}
                          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                          aria-label={`Delete event "${event.title}"`}
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
        <nav className="flex justify-center" aria-label="Events pagination">
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
        title={t("admin.events.deleteTitle")}
        hideFooter
      >
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("admin.events.deleteConfirm")}
          </h3>
          <p className="text-gray-600 text-sm mb-6">
            {t("admin.events.deleteWarning")}
            <span className="font-medium text-gray-900"> "{eventToDelete?.title}"</span>.
            <br />
            {t("admin.events.deleteIrreversible")}
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
                  {t("admin.events.deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {t("admin.events.deleteButton")}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
