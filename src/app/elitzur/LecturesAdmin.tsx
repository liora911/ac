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
import Modal from "@/components/Modal/Modal";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useNotification } from "@/contexts/NotificationContext";

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
  const { showSuccess, showError } = useNotification();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);

  const [categoryId, setCategoryId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [lectureToDelete, setLectureToDelete] = useState<Lecture | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useLectures();
  const { data: categories, isLoading: loadingCategories } = useCategories();

  const updateMutation = useUpdateLecture();
  const deleteMutation = useDeleteLecture();

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

  const total = filteredLectures.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedLectures = filteredLectures.slice(
    (page - 1) * limit,
    page * limit
  );

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
          showSuccess(`קטגוריית ההרצאה "${lecture.title}" עודכנה בהצלחה`);
          refetch();
        },
        onError: () => {
          showError("שגיאה בעדכון קטגוריית ההרצאה");
        },
      }
    );
  };

  const openDeleteModal = (lecture: Lecture) => {
    setLectureToDelete(lecture);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setLectureToDelete(null);
  };

  const confirmDelete = () => {
    if (!lectureToDelete) return;

    deleteMutation.mutate(lectureToDelete.id, {
      onSuccess: () => {
        showSuccess(`ההרצאה "${lectureToDelete.title}" נמחקה בהצלחה`);
        refetch();
        closeDeleteModal();
      },
      onError: () => {
        showError("שגיאה במחיקת ההרצאה");
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/create-lecture"
            className="inline-flex items-center px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + New Lecture
          </Link>
        </div>
      </div>

      <div
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        role="region"
        aria-labelledby="lecture-filters-heading"
      >
        <h3 id="lecture-filters-heading" className="sr-only">
          Lecture filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label
              htmlFor="lecture-search-input"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search
            </label>
            <input
              id="lecture-search-input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or description…"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-describedby="lecture-search-help"
            />
            <div id="lecture-search-help" className="sr-only">
              Search lectures by title or description
            </div>
          </div>

          <div>
            <label
              htmlFor="lecture-category-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category
            </label>
            <select
              id="lecture-category-select"
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
              htmlFor="lecture-limit-select"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Per page
            </label>
            <select
              id="lecture-limit-select"
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
          {isFetching ? "Refreshing…" : `Found ${total} lectures`}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="min-w-full divide-y divide-gray-200"
            role="table"
            aria-label="Lectures management table"
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
                  Category
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  role="columnheader"
                  scope="col"
                >
                  Duration
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  role="columnheader"
                  scope="col"
                >
                  Date
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
                    aria-label="Loading lecture"
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
                        className="h-4 w-16 bg-gray-200 rounded"
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
              ) : paginatedLectures.length === 0 ? (
                <tr role="row">
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-gray-500"
                    role="cell"
                  >
                    No lectures found. Try adjusting filters or create a new
                    one.
                  </td>
                </tr>
              ) : (
                paginatedLectures.map((lecture) => (
                  <tr key={lecture.id} role="row">
                    <td className="px-4 py-3" role="cell">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {lecture.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {lecture.id}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600" role="cell">
                      {lecture.categoryName}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600" role="cell">
                      {lecture.duration}
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600" role="cell">
                      {lecture.date ? (
                        <time dateTime={new Date(lecture.date).toISOString()}>
                          {new Date(lecture.date).toLocaleDateString()}
                        </time>
                      ) : (
                        "N/A"
                      )}
                    </td>

                    <td className="px-4 py-3" role="cell">
                      <div
                        className="flex items-center gap-2 justify-end"
                        role="group"
                        aria-label="Lecture actions"
                      >
                        <Link
                          href={`/lectures/${lecture.id}`}
                          className="text-sm text-gray-700 hover:text-gray-900 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                          aria-label={`View lecture "${lecture.title}"`}
                        >
                          View
                        </Link>
                        <Link
                          href={`/edit-lecture/${lecture.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                          aria-label={`Edit lecture "${lecture.title}"`}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => openDeleteModal(lecture)}
                          disabled={deleteMutation.isPending}
                          className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
                          aria-label={`Delete lecture "${lecture.title}"`}
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
        <nav className="flex justify-center" aria-label="Lectures pagination">
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        title="מחיקת הרצאה"
        hideFooter
      >
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            האם אתה בטוח?
          </h3>
          <p className="text-gray-600 text-sm mb-6">
            פעולה זו תמחק לצמיתות את ההרצאה
            <span className="font-medium text-gray-900"> "{lectureToDelete?.title}"</span>.
            <br />
            לא ניתן לבטל פעולה זו.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={closeDeleteModal}
              disabled={deleteMutation.isPending}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              ביטול
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
                  מוחק...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  מחק הרצאה
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
