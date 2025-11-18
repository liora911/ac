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
} from "../../types/Articles/articles";
import { useSession } from "next-auth/react";
import TiptapEditor from "@/lib/editor/editor";
import { useTranslation } from "@/contexts/Translation/translation.context";
import Modal from "@/components/Modal/Modal";

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

  const [formData, setFormData] = useState<ArticleFormData>({
    title: article?.title || "",
    content: article?.content || "",
    excerpt: article?.excerpt || "",
    featuredImage: article?.featuredImage || "",
    categoryId: article?.categoryId || "",
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
  });

  const [tagInput, setTagInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [categories, setCategories] = useState<ArticleCategory[]>([]);

  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

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

    if (!formData.title.trim() || !formData.content.trim()) {
      setValidationModalOpen(true);
      return;
    }

    try {
      if (isEditing && article) {
        await updateMutation.mutateAsync({
          id: article.id,
          ...formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("articleForm.titleLabel")}
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("articleForm.titlePlaceholder") as string}
              required
            />
          </div>

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
              required
            />
          </div>

          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("articleForm.excerptLabel")}
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => handleInputChange("excerpt", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("articleForm.excerptPlaceholder") as string}
            />
          </div> */}

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("articleForm.publisherNameLabel")}
              </label>
              <input
                type="text"
                value={formData.publisherName}
                onChange={(e) =>
                  handleInputChange("publisherName", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={
                  t("articleForm.publisherNamePlaceholder") as string
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("articleForm.publisherImageUrlLabel")}
              </label>
              <input
                type="url"
                value={formData.publisherImage || ""}
                onChange={(e) =>
                  handleInputChange("publisherImage", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("articleForm.categoryLabel")}
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => handleInputChange("categoryId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">{t("articleForm.selectCategory")}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

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

          <div className="flex justify-end space-x-4 pt-6 border-t">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
                disabled={isLoading}
              >
                {t("articleForm.cancelButton")}
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {isLoading
                ? t("articleForm.savingButton")
                : isEditing
                ? t("articleForm.updateArticleButton")
                : t("articleForm.createArticleButton")}
            </button>
          </div>
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
