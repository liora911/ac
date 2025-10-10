"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCreateArticle, useUpdateArticle } from "../../hooks/useArticles";
import { ArticleFormData, Article } from "../../types/Articles/articles";
import { useSession } from "next-auth/react";
import TiptapEditor from "@/lib/editor/editor";

interface ArticleFormProps {
  article?: Article; // For editing existing articles
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ArticleForm({
  article,
  onSuccess,
  onCancel,
}: ArticleFormProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const isEditing = !!article;

  const [formData, setFormData] = useState<ArticleFormData>({
    title: article?.title || "",
    content: article?.content || "",
    excerpt: article?.excerpt || "",
    featuredImage: article?.featuredImage || "",
    categoryId: article?.categoryId || "",
    tags: article?.tags?.map((tag) => tag.name) || [],
    status: article?.status || "DRAFT",
    isFeatured: article?.isFeatured || false,
    metaTitle: article?.metaTitle || "",
    metaDescription: article?.metaDescription || "",
    keywords: article?.keywords || [],
  });

  const [tagInput, setTagInput] = useState("");
  const [keywordInput, setKeywordInput] = useState("");

  const createMutation = useCreateArticle();
  const updateMutation = useUpdateArticle();

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const error = createMutation.error || updateMutation.error;

  // Auto-generate excerpt from content
  useEffect(() => {
    if (!formData.excerpt && formData.content) {
      const excerpt = formData.content
        .replace(/<[^>]*>/g, "") // Remove HTML tags
        .substring(0, 150)
        .trim();
      if (excerpt) {
        setFormData((prev) => ({ ...prev, excerpt: excerpt + "..." }));
      }
    }
  }, [formData.content, formData.excerpt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Title and content are required");
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
    } catch (error) {
      console.error("Error saving article:", error);
    }
  };

  const handleInputChange = (field: keyof ArticleFormData, value: any) => {
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
        <p className="text-gray-600">
          Please sign in to create or edit articles.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? "Edit Article" : "Create New Article"}
          </h2>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">
              Error: {error.message || "Something went wrong"}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter article title"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <TiptapEditor
              value={formData.content}
              onChange={(value) => handleInputChange("content", value)}
              placeholder="Write your article content here..."
            />
            <input
              type="hidden"
              name="content"
              value={formData.content}
              required
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => handleInputChange("excerpt", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief summary of the article (auto-generated from content)"
            />
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Featured Image URL
            </label>
            <input
              type="url"
              value={formData.featuredImage}
              onChange={(e) =>
                handleInputChange("featuredImage", e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => handleInputChange("categoryId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              <option value="tech">Technology</option>
              <option value="science">Science</option>
              <option value="philosophy">Philosophy</option>
              {/* TODO: Add dynamic categories */}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
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
                placeholder="Add a tag"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add
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
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Status and Featured */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
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
                Featured Article
              </label>
            </div>
          </div>

          {/* SEO Fields */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              SEO Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) =>
                    handleInputChange("metaTitle", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="SEO title (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meta Description
                </label>
                <input
                  type="text"
                  value={formData.metaDescription}
                  onChange={(e) =>
                    handleInputChange("metaDescription", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="SEO description (optional)"
                />
              </div>
            </div>

            {/* Keywords */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords
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
                  placeholder="Add a keyword"
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add
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
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading
                ? "Saving..."
                : isEditing
                ? "Update Article"
                : "Create Article"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
