"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateArticle, useUpdateArticle } from "../../hooks/useArticles";
import {
  ArticleFormData,
  Article,
  ArticleCategory,
  ArticleStatus,
  ArticleFormProps,
  ArticleAuthorInput,
} from "../../types/Articles/articles";
import { useSession } from "next-auth/react";
import TiptapEditor from "@/lib/editor/editor";
import { useTranslation } from "@/contexts/Translation/translation.context";
import Modal from "@/components/Modal/Modal";
import AuthorInput from "./AuthorInput";

export default function ArticleForm({
  article,
  onSuccess,
  onCancel,
}: ArticleFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isEditing = !!article;
  const { t, locale } = useTranslation();
  const [validationModalOpen, setValidationModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
  const [confirmedTabs, setConfirmedTabs] = useState<Set<1 | 2 | 3>>(new Set());

  const [formData, setFormData] = useState<ArticleFormData>({
    title: article?.title || "",
    content: article?.content || "",
    excerpt: article?.excerpt || "",
    featuredImage: article?.featuredImage || "",
    categoryId: article?.categoryId || "",
    categoryIds: article?.categories?.map((c) => c.id) || (article?.categoryId ? [article.categoryId] : []),
    tags: article?.tags?.map((tag) => tag.name) || [],
    status: article?.status || "DRAFT",
    isFeatured: article?.isFeatured || false,
    direction: article?.direction || (locale === "en" ? "ltr" : "rtl"),
    metaTitle: article?.metaTitle || "",
    metaDescription: article?.metaDescription || "",
    keywords: article?.keywords || [],
    publisherName:
      article?.publisherName ||
      article?.author?.name ||
      session?.user?.name ||
      "",
    publisherImage:
      article?.publisherImage ||
      article?.author?.image ||
      session?.user?.image ||
      "",
    authors: article?.authors || [
      {
        name: article?.publisherName || session?.user?.name || "",
        imageUrl: article?.publisherImage || session?.user?.image || null,
        order: 0,
      },
    ],
  });

  // Authors state
  const [authors, setAuthors] = useState<ArticleAuthorInput[]>(
    article?.authors?.map((a) => ({
      id: a.id,
      name: a.name,
      imageUrl: a.imageUrl || null,
      order: a.order,
    })) || [
      {
        name: article?.publisherName || session?.user?.name || "",
        imageUrl: article?.publisherImage || session?.user?.image || null,
        order: 0,
      },
    ]
  );
  const [authorsError, setAuthorsError] = useState<string>("");

  const [tagInput, setTagInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [categories, setCategories] = useState<ArticleCategory[]>([]);

  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  // Validation for Tab 1 (required fields: Title and at least one author with name)
  const isTab1Complete = formData.title.trim() !== "" && authors.length > 0 && authors.every(a => a.name && a.name.trim() !== "");
  // Validation for Tab 2 (required field: Content)
  const isTab2Complete = formData.content.trim() !== "";

  const confirmTab = (tab: 1 | 2 | 3) => {
    setConfirmedTabs((prev) => new Set([...prev, tab]));
    if (tab < 3) {
      setActiveTab((tab + 1) as 1 | 2 | 3);
    }
  };

  const canAccessTab = (tab: 1 | 2 | 3): boolean => {
    if (tab === 1) return true;
    return confirmedTabs.has((tab - 1) as 1 | 2 | 3) || confirmedTabs.has(tab);
  };

  const handleTabClick = (tab: 1 | 2 | 3) => {
    if (canAccessTab(tab)) {
      setActiveTab(tab);
    }
  };

  useEffect(() => {
    if (!isEditing && !formData.excerpt && formData.content) {
      const excerpt = formData.content
        .replace(/<[^>]*>/g, "")
        .substring(0, 150)
        .trim();
      if (excerpt) {
        setFormData((prev) => ({ ...prev, excerpt: excerpt + "..." }));
      }
    }
  }, [isEditing, formData.content, formData.excerpt]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) {
          throw new Error("Failed to fetch categories");
        }
        const data: ArticleCategory[] = await response.json();
        setCategories(data);
      } catch (error) {}
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthorsError("");

    // Validate Tab 1 fields (Title and Authors)
    if (!formData.title.trim()) {
      setActiveTab(1);
      setValidationModalOpen(true);
      return;
    }

    // Validate authors
    if (authors.length === 0) {
      setActiveTab(1);
      setAuthorsError("יש להוסיף לפחות מחבר אחד");
      return;
    }

    const hasEmptyAuthorName = authors.some((a) => !a.name || a.name.trim() === "");
    if (hasEmptyAuthorName) {
      setActiveTab(1);
      setAuthorsError("כל מחבר חייב לכלול שם");
      return;
    }

    // Validate Tab 2 fields (Content)
    if (!formData.content.trim()) {
      setActiveTab(2);
      setValidationModalOpen(true);
      return;
    }

    try {
      const submissionData = {
        ...formData,
        categoryIds: formData.categoryIds, // Send multiple categories
        publisherName: authors[0]?.name || formData.publisherName,
        publisherImage: authors[0]?.imageUrl || formData.publisherImage,
        authors: authors.map((a, index) => ({
          name: a.name.trim(),
          imageUrl: a.imageUrl || null,
          order: index,
        })),
      };

      if (isEditing && article) {
        await updateMutation.mutateAsync({
          id: article.id,
          ...submissionData,
        });
      } else {
        await createMutation.mutateAsync(submissionData);
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/articles");
      }
    } catch (error) {}
  };

  const handleInputChange = <K extends keyof ArticleFormData>(
    field: K,
    value: ArticleFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const addKeyword = () => {
    if (
      keywordInput.trim() &&
      !formData.keywords.includes(keywordInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()],
      }));
      setKeywordInput("");
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((keyword) => keyword !== keywordToRemove),
    }));
  };

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">{t("articleForm.signInPrompt")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing
              ? t("articleForm.editArticleTitle")
              : t("articleForm.createNewArticleTitle")}
          </h2>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              {t("articleForm.cancelButton")}
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{t("articleForm.errorMessage")}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-1" aria-label="Tabs">
            {([1, 2, 3] as const).map((tab) => {
              const isAccessible = canAccessTab(tab);
              const isConfirmed = confirmedTabs.has(tab);
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => handleTabClick(tab)}
                  disabled={!isAccessible}
                  className={`relative px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                    !isAccessible
                      ? "border-transparent text-gray-300 cursor-not-allowed"
                      : activeTab === tab
                        ? "border-blue-600 text-blue-600 cursor-pointer"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {isConfirmed && (
                      <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {tab === 1 && (t("articleForm.tabs.basicInfo") as string || "Basic Info")}
                    {tab === 2 && (t("articleForm.tabs.content") as string || "Content")}
                    {tab === 3 && (t("articleForm.tabs.settings") as string || "Settings")}
                  </span>
                  {tab === 1 && !isTab1Complete && !isConfirmed && (
                    <span className="absolute top-2 -right-0 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                  {tab === 2 && !isTab2Complete && !isConfirmed && (
                    <span className="absolute top-2 -right-0 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tab 1: Basic Info */}
          {activeTab === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("articleForm.titleLabel")}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formData.title.trim() === "" ? "border-gray-300" : "border-green-300"
                  }`}
                  placeholder={t("articleForm.titlePlaceholder") as string}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("articleForm.categoryLabel")}
                  <span className="text-gray-400 text-xs mr-2">(ניתן לבחור מספר קטגוריות)</span>
                </label>
                <div className="border border-gray-300 rounded-md p-3 max-h-48 overflow-y-auto">
                  {categories.length === 0 ? (
                    <p className="text-gray-400 text-sm">{t("articleForm.noCategories") as string || "No categories available"}</p>
                  ) : (
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <label
                          key={category.id}
                          className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={formData.categoryIds.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleInputChange("categoryIds", [...formData.categoryIds, category.id]);
                              } else {
                                handleInputChange("categoryIds", formData.categoryIds.filter((id) => id !== category.id));
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {formData.categoryIds.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {formData.categoryIds.map((catId) => {
                      const cat = categories.find((c) => c.id === catId);
                      return cat ? (
                        <span
                          key={catId}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {cat.name}
                          <button
                            type="button"
                            onClick={() => handleInputChange("categoryIds", formData.categoryIds.filter((id) => id !== catId))}
                            className="ml-1 text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Authors Section */}
              <AuthorInput
                authors={authors}
                onChange={setAuthors}
                error={authorsError}
              />

              {/* Confirm Tab 1 Button */}
              <div className="pt-4 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={() => confirmTab(1)}
                  disabled={!isTab1Complete}
                  className="w-full sm:w-auto bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium flex items-center justify-center gap-2"
                >
                  {t("articleForm.confirmAndContinue") || "אישור והמשך"}
                  <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {!isTab1Complete && (
                  <p className="text-sm text-red-600 mt-2">
                    {t("articleForm.tab1RequiredHint") || "* יש למלא כותרת ולהוסיף לפחות מחבר אחד"}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Tab 2: Content */}
          {activeTab === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("articleForm.contentLabel")}
                </label>
                <TiptapEditor
                  value={formData.content}
                  onChange={(value) => handleInputChange("content", value)}
                  placeholder={t("articleForm.contentPlaceholder") as string}
                  direction={formData.direction}
                  onDirectionChange={(direction) =>
                    handleInputChange("direction", direction)
                  }
                />
                <input
                  type="hidden"
                  name="content"
                  value={formData.content}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("articleForm.featuredImageUrlLabel")}
                </label>
                <input
                  type="url"
                  value={formData.featuredImage}
                  onChange={(e) =>
                    handleInputChange("featuredImage", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://"
                />
              </div>

              {/* Confirm Tab 2 Button */}
              <div className="pt-4 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={() => confirmTab(2)}
                  disabled={!isTab2Complete}
                  className="w-full sm:w-auto bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium flex items-center justify-center gap-2"
                >
                  {t("articleForm.confirmAndContinue") || "אישור והמשך"}
                  <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {!isTab2Complete && (
                  <p className="text-sm text-red-600 mt-2">
                    {t("articleForm.tab2RequiredHint") || "* יש למלא את תוכן המאמר"}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Tab 3: Settings */}
          {activeTab === 3 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("articleForm.tagsLabel")}
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addTag())
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t("articleForm.addTagPlaceholder") as string}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    {t("articleForm.addButton")}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("articleForm.statusLabel")}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      handleInputChange("status", e.target.value as ArticleStatus)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="DRAFT">{t("articleForm.statusDraft")}</option>
                    <option value="PUBLISHED">
                      {t("articleForm.statusPublished")}
                    </option>
                    <option value="ARCHIVED">
                      {t("articleForm.statusArchived")}
                    </option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) =>
                      handleInputChange("isFeatured", e.target.checked)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="isFeatured"
                    className="ml-2 text-sm text-gray-700"
                  >
                    {t("articleForm.featuredArticleLabel")}
                  </label>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {t("articleForm.seoSettingsTitle")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("articleForm.metaTitleLabel")}
                    </label>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={(e) =>
                        handleInputChange("metaTitle", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t("articleForm.metaTitlePlaceholder") as string}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("articleForm.metaDescriptionLabel")}
                    </label>
                    <input
                      type="text"
                      value={formData.metaDescription}
                      onChange={(e) =>
                        handleInputChange("metaDescription", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={
                        t("articleForm.metaDescriptionPlaceholder") as string
                      }
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("articleForm.keywordsLabel")}
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addKeyword())
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t("articleForm.addKeywordPlaceholder") as string}
                    />
                    <button
                      type="button"
                      onClick={addKeyword}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
                    >
                      {t("articleForm.addButton")}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(keyword)}
                          className="ml-1 text-green-600 hover:text-green-800 cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Submit Button - only visible on last tab */}
          {activeTab === 3 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t">
              <div className="text-sm text-gray-500">
                {(!isTab1Complete || !isTab2Complete) && (
                  <span className="text-red-600">
                    {t("articleForm.requiredFieldsHint") as string || "* Required fields are missing"}
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors cursor-pointer w-full sm:w-auto"
                    disabled={isLoading}
                  >
                    {t("articleForm.cancelButton")}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer w-full sm:w-auto"
                >
                  {isLoading
                    ? t("articleForm.savingButton")
                    : isEditing
                    ? t("articleForm.updateArticleButton")
                    : t("articleForm.createArticleButton")}
                </button>
              </div>
            </div>
          )}
        </form>

        <Modal
          isOpen={validationModalOpen}
          onClose={() => setValidationModalOpen(false)}
          title="שגיאה"
          message={t("articleForm.titleAndContentRequired") as string}
          confirmText="סגור"
        />
      </div>
    </div>
  );
}
