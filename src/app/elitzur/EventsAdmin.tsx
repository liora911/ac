"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useEvents, useUpdateEvent, useDeleteEvent } from "@/hooks/useEvents";
import { useCategories } from "@/hooks/useArticles";
import type { Event } from "@/types/Events/events";
import LoginForm from "@/components/Login/login";
import { useNotification } from "@/contexts/NotificationContext";

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
  const { data: session } = useSession();
  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );
  const { showSuccess, showError } = useNotification();

  // Filters / state
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const [status, setStatus] = useState<EventStatus | "">("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading, isFetching, error, refetch } = useEvents();
  const { data: categories, isLoading: loadingCategories } = useCategories();

  const updateMutation = useUpdateEvent();
  const deleteMutation = useDeleteEvent();

  // Filter events client-side since API doesn't have filtering yet
  const filteredEvents = useMemo(() => {
    if (!data) return [];

    return data.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        event.description.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory =
        categoryId === "" || event.categoryId === categoryId;
      // For now, assume all events are active unless we add status field
      const matchesStatus = status === "" || status === "active";

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [data, debouncedSearch, categoryId, status]);

  // Pagination
  const total = filteredEvents.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedEvents = filteredEvents.slice(
    (page - 1) * limit,
    page * limit
  );

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [status, categoryId, debouncedSearch, limit]);

  if (!isAuthorized) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <p className="mb-4">
          You must sign in with an authorized account to manage events.
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
          showSuccess(`קטגוריית האירוע "${event.title}" עודכנה בהצלחה`);
          refetch();
        },
        onError: () => {
          showError("שגיאה בעדכון קטגוריית האירוע");
        },
      }
    );
  };

  const onDelete = (event: Event) => {
    if (
      !confirm(`Delete event "${event.title}"? This action cannot be undone.`)
    ) {
      return;
    }
    deleteMutation.mutate(event.id, {
      onSuccess: () => {
        showSuccess(`האירוע "${event.title}" נמחק בהצלחה`);
        refetch();
      },
      onError: () => {
        showError("שגיאה במחיקת האירוע");
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Events Management
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Create, search, filter and manage events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/create-event"
            className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New Event
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        role="region"
        aria-labelledby="event-filters-heading"
      >
        <h3 id="event-filters-heading" className="sr-only">
          Event filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2">
            <label
              htmlFor="event-search-input"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <input
              id="event-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or description…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-describedby="event-search-help"
            />
            <div id="event-search-help" className="sr-only">
              Search events by title or description
            </div>
          </div>

          <div>
            <label
              htmlFor="event-status-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="event-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as EventStatus | "")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="event-category-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category
            </label>
            <select
              id="event-category-select"
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
              htmlFor="event-limit-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Per page
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
          className="mt-3 text-xs text-gray-500"
          aria-live="polite"
          aria-atomic="true"
        >
          {isFetching ? "Refreshing…" : `Found ${total} events`}
        </div>
      </div>

      {/* Table */}
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
                  Title
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  role="columnheader"
                  scope="col"
                >
                  Date & Time
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  role="columnheader"
                  scope="col"
                >
                  Type
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
                    No events found. Try adjusting filters or create a new one.
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
                        <time dateTime={event.eventDate.toISOString()}>
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
                          event.eventType === "online" ? "Online" : "In-person"
                        }`}
                      >
                        {event.eventType === "online" ? "Online" : "In-person"}
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
                        <option value="">No category</option>
                        {categories?.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600" role="cell">
                      <time
                        dateTime={(
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
                          View
                        </Link>
                        <Link
                          href={`/edit-event/${event.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                          aria-label={`Edit event "${event.title}"`}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => onDelete(event)}
                          disabled={deleteMutation.isPending}
                          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                          aria-label={`Delete event "${event.title}"`}
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
        <nav className="flex justify-center" aria-label="Events pagination">
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
