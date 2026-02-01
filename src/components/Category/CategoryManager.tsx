"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import TiptapEditor from "@/lib/editor/editor";
import { stripHtml } from "@/lib/utils/stripHtml";
import type { Category } from "@/types/Category/category";

export default function CategoryManager() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryParentId, setNewCategoryParentId] = useState<string | "">(
    ""
  );
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState("");
  const [editedCategoryDescription, setEditedCategoryDescription] = useState("");
  const [editedCategoryParentId, setEditedCategoryParentId] = useState<
    string | ""
  >("");
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
      setError(t("admin.categories.nameCannotBeEmpty"));
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || null,
          parentId: newCategoryParentId || null,
        }),
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
      setNewCategoryDescription("");
      setNewCategoryParentId("");
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
      setError(t("admin.categories.nameCannotBeEmpty"));
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editedCategoryName.trim(),
          description: editedCategoryDescription.trim() || null,
          parentId: editedCategoryParentId || null,
        }),
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
      setEditedCategoryDescription("");
      setEditedCategoryParentId("");
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
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            {loading ? t("admin.common.loading") : `${categories.length} total`}
          </span>
        </div>

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
            <div className="md:col-span-1">
              <div className="h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900">
                  {t("admin.categories.addNew")}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  {t("admin.categories.addDescription")}
                </p>

                <form onSubmit={handleAddCategory} className="mt-4 space-y-3">
                  <div>
                    <label
                      htmlFor="newCategory"
                      className="block text-xs font-medium text-gray-700"
                    >
                      {t("admin.categories.categoryName")}
                    </label>
                    <input
                      id="newCategory"
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder={t("admin.categories.categoryNamePlaceholder")}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="newCategoryDescription"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      {t("admin.categories.categoryDescription")}
                    </label>
                    <div className="border border-gray-300 rounded-md overflow-hidden">
                      <TiptapEditor
                        value={newCategoryDescription}
                        onChange={setNewCategoryDescription}
                        placeholder={t("admin.categories.categoryDescriptionPlaceholder")}
                        direction="rtl"
                        theme="light"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-400">
                      {t("admin.categories.categoryDescriptionHelp")}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700">
                      {t("admin.categories.parentCategory")}
                    </label>
                    <select
                      value={newCategoryParentId}
                      onChange={(e) => setNewCategoryParentId(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">{t("admin.categories.noParent")}</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={saving || !newCategoryName.trim()}
                    className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? t("admin.categories.saving") : t("admin.categories.addCategory")}
                  </button>
                </form>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {t("admin.categories.existingCategories")}
                  </h3>
                  <button
                    onClick={fetchCategories}
                    disabled={loading || saving}
                    className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                    title={t("admin.common.refresh")}
                  >
                    {t("admin.common.refresh")}
                  </button>
                </div>

                {loading ? (
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                    {t("admin.categories.loadingCategories")}
                  </div>
                ) : categories.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                    <p className="text-sm text-gray-500">{t("admin.categories.noCategoriesYet")}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {t("admin.categories.addFirstCategory")}
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
                            className="w-full space-y-3"
                          >
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editedCategoryName}
                                onChange={(e) =>
                                  setEditedCategoryName(e.target.value)
                                }
                                placeholder={t("admin.categories.categoryName")}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                autoFocus
                              />
                              <div className="border border-gray-300 rounded-md overflow-hidden">
                                <TiptapEditor
                                  value={editedCategoryDescription}
                                  onChange={setEditedCategoryDescription}
                                  placeholder={t("admin.categories.categoryDescriptionPlaceholder")}
                                  direction="rtl"
                                  theme="light"
                                />
                              </div>
                              <select
                                value={editedCategoryParentId}
                                onChange={(e) =>
                                  setEditedCategoryParentId(e.target.value)
                                }
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              >
                                <option value="">{t("admin.categories.noParent")}</option>
                                {categories
                                  .filter((cat) => cat.id !== category.id)
                                  .map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.name}
                                    </option>
                                  ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="submit"
                                disabled={saving || !editedCategoryName.trim()}
                                className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                {t("admin.common.save")}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCategory(null);
                                  setEditedCategoryName("");
                                  setEditedCategoryDescription("");
                                  setEditedCategoryParentId("");
                                }}
                                className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                              >
                                {t("admin.common.cancel")}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="flex-1 min-w-0">
                              <div className="truncate text-sm font-medium text-gray-900">
                                {category.name}
                              </div>
                              {category.description && (
                                <div className="mt-0.5 text-xs text-gray-600 line-clamp-2">
                                  {stripHtml(category.description)}
                                </div>
                              )}
                              <div className="mt-0.5 text-xs text-gray-400">
                                {category.parentId
                                  ? t("admin.categories.subcategoryOf").replace(
                                      "{parent}",
                                      categories.find(
                                        (c) => c.id === category.parentId
                                      )?.name || t("admin.categories.unknownParent")
                                    )
                                  : t("admin.categories.topLevelCategory")}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingCategory(category);
                                  setEditedCategoryName(category.name);
                                  setEditedCategoryDescription(category.description || "");
                                  setEditedCategoryParentId(
                                    category.parentId || ""
                                  );
                                }}
                                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                              >
                                {t("admin.common.edit")}
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteCategory(category.id)
                                }
                                className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                              >
                                {t("admin.common.delete")}
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
