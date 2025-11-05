"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import {
  useLectures,
  useUpdateLecture,
  useDeleteLecture,
} from "@/hooks/useLectures";
import { useCategories } from "@/hooks/useArticles";
import type { Lecture } from "@/types/Lectures/lectures";
import LoginForm from "@/components/Login/login";

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function LecturesAdmin() {
  const { data: session } = useSession();
  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );

  // Filters / state
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const [categoryId, setCategoryId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading, isFetching, error, refetch } = useLectures();
  const { data: categories, isLoading: loadingCategories } = useCategories();

  const updateMutation = useUpdateLecture();
  const deleteMutation = useDeleteLecture();

  // Flatten lectures from categories and subcategories
  const allLectures = useMemo(() => {
    if (!data) return [];

    const lectures: (Lecture & { categoryName: string })[] = [];

    const processCategories = (cats: any[], parentName = "") => {
      cats.forEach((cat) => {
        const catName = parentName ? `${parentName} > ${cat.name}` : cat.name;

        cat.lectures.forEach((lecture: Lecture) => {
          lectures.push({ ...lecture, categoryName: catName });
        });

        if (cat.subcategories) {
          processCategories(cat.subcategories, catName);
        }
      });
    };

    processCategories(data);
    return lectures;
  }, [data]);

  // Filter lectures client-side
  const filteredLectures = useMemo(() => {
    return allLectures.filter((lecture) => {
      const matchesSearch =
        lecture.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        lecture.description
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase());
      const matchesCategory =
        categoryId === "" ||
        lecture.categoryName.includes(
          categories?.find((c) => c.id === categoryId)?.name || ""
        );

      return matchesSearch && matchesCategory;
    });
  }, [allLectures, debouncedSearch, categoryId, categories]);

  // Pagination
  const total = filteredLectures.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedLectures = filteredLectures.slice(
    (page - 1) * limit,
    page * limit
  );

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [categoryId, debouncedSearch, limit]);

  if (!isAuthorized) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <p className="mb-4">
          You must sign in with an authorized account to manage lectures.
        </p>
        <LoginForm />
      </div>
    );
  }

  const onChangeCategory = (lecture: Lecture, newCategoryId: string) => {
    updateMutation.mutate(
      { id: lecture.id, categoryId: newCategoryId },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  const onDelete = (lecture: Lecture) => {
    if (
      !confirm(
        `Delete lecture "${lecture.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }
    deleteMutation.mutate(lecture.id, {
      onSuccess: () => {
        refetch();
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Lectures Management
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Create, search, filter and manage lectures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/create-lecture"
            className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New Lecture
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or description…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
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
          {isFetching ? "Refreshing…" : `Found ${total} lectures`}
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
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
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
                      <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-24 bg-gray-200 rounded"></div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="h-8 w-32 bg-gray-200 rounded ml-auto"></div>
                    </td>
                  </tr>
                ))
              ) : paginatedLectures.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                  >
                    No lectures found. Try adjusting filters or create a new
                    one.
                  </td>
                </tr>
              ) : (
                paginatedLectures.map((lecture) => (
                  <tr key={lecture.id}>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {lecture.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {lecture.id}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {lecture.categoryName}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {lecture.duration}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600">
                      {lecture.date
                        ? new Date(lecture.date).toLocaleDateString()
                        : "N/A"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/lectures/${lecture.id}`}
                          className="text-sm text-gray-700 hover:text-gray-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/edit-lecture/${lecture.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => onDelete(lecture)}
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
    </div>
  );
}
