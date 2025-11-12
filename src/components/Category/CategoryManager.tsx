"use client";

import React, { useState, useEffect } from "react";

interface Category {
  id: string;
  name: string;
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to fetch categories";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newCategoryName.trim()) {
      setError("Category name cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      if (!response.ok) {
        const errData = (await response.json().catch(() => null)) as unknown;
        const msg =
          errData &&
          typeof errData === "object" &&
          "message" in errData &&
          typeof (errData as any).message === "string"
            ? (errData as any).message
            : "Failed to add category";
        throw new Error(msg);
      }

      setNewCategoryName("");
      await fetchCategories();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add category";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!editingCategory || !editedCategoryName.trim()) {
      setError("Category name cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: editedCategoryName.trim() }),
      });

      if (!response.ok) {
        const errData = (await response.json().catch(() => null)) as unknown;
        const msg =
          errData &&
          typeof errData === "object" &&
          "message" in errData &&
          typeof (errData as any).message === "string"
            ? (errData as any).message
            : "Failed to update category";
        throw new Error(msg);
      }

      setEditingCategory(null);
      setEditedCategoryName("");
      await fetchCategories();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to update category";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    setError(null);
    try {
      setSaving(true);
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errData = (await response.json().catch(() => null)) as unknown;
        const msg =
          errData &&
          typeof errData === "object" &&
          "message" in errData &&
          typeof (errData as any).message === "string"
            ? (errData as any).message
            : "Failed to delete category";
        throw new Error(msg);
      }

      await fetchCategories();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to delete category";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            {loading ? "Loading…" : `${categories.length} total`}
          </span>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Add Category */}
            <div className="md:col-span-1">
              <div className="h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900">
                  Add new category
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Give it a clear, descriptive name.
                </p>

                <form onSubmit={handleAddCategory} className="mt-4 space-y-3">
                  <div>
                    <label
                      htmlFor="newCategory"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Category name
                    </label>
                    <input
                      id="newCategory"
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g. Quantum Mechanics"
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving || !newCategoryName.trim()}
                    className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving…" : "Add Category"}
                  </button>
                </form>
              </div>
            </div>

            {/* Categories List */}
            <div className="md:col-span-2">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Existing categories
                  </h3>
                  <button
                    onClick={fetchCategories}
                    disabled={loading || saving}
                    className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    title="Refresh list"
                  >
                    Refresh
                  </button>
                </div>

                {loading ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                    Loading categories…
                  </div>
                ) : categories.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                    <p className="text-sm text-gray-500">No categories yet.</p>
                    <p className="mt-1 text-xs text-gray-400">
                      Use the form on the left to add your first category.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {categories.map((category) => (
                      <li
                        key={category.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition hover:shadow-sm"
                      >
                        {editingCategory?.id === category.id ? (
                          <form
                            onSubmit={handleEditCategory}
                            className="flex w-full items-center gap-2"
                          >
                            <input
                              type="text"
                              value={editedCategoryName}
                              onChange={(e) =>
                                setEditedCategoryName(e.target.value)
                              }
                              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              autoFocus
                            />
                            <button
                              type="submit"
                              disabled={saving || !editedCategoryName.trim()}
                              className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCategory(null);
                                setEditedCategoryName("");
                              }}
                              className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <>
                            <span className="truncate text-sm font-medium text-gray-900">
                              {category.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingCategory(category);
                                  setEditedCategoryName(category.name);
                                }}
                                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteCategory(category.id)
                                }
                                className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
