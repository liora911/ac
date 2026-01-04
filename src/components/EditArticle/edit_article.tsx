"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import UploadImage from "@/components/Upload/upload";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";
import dynamic from "next/dynamic";
import AuthorInput from "@/components/Articles/AuthorInput";
import { ArticleAuthorInput } from "@/types/Articles/articles";

const TiptapEditor = dynamic(() => import("@/lib/editor/editor"), {
  ssr: false,
});

type CategoryNode = {
  id: string;
  name: string;
  parentId?: string | null;
};

interface EditArticleFormProps {
  articleId: string;
  onSuccess?: () => void;
}

export default function EditArticleForm({
  articleId,
  onSuccess,
}: EditArticleFormProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    articleImage: "",
    publisherName: "",
    publisherImage: "",
    readDuration: 5,
    categoryId: "",
    direction: (locale === "en" ? "ltr" : "rtl") as "ltr" | "rtl",
  });
  const [authors, setAuthors] = useState<ArticleAuthorInput[]>([
    { name: "", imageUrl: null, order: 0 },
  ]);
  const [authorsError, setAuthorsError] = useState<string>("");

  const [articleImageFile, setArticleImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);

  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  // Validation for Tab 1 (required fields: Title and at least one author with name)
  const isTab1Complete = formData.title.trim() !== "" && authors.length > 0 && authors.every(a => a.name && a.name.trim() !== "");
  // Validation for Tab 2 (required field: Content)
  const isTab2Complete = formData.content.trim() !== "" && formData.content.replace(/<[^>]*>/g, "").trim() !== "";

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
      } finally {
        setCategoriesLoading(false);
      }
    };

    const fetchArticle = async () => {
      try {
        const response = await fetch(`/api/articles/${articleId}`);
        if (response.ok) {
          const article = await response.json();

          setFormData({
            title: article.title || "",
            content: article.content || "",
            articleImage: article.featuredImage || article.articleImage || "",
            publisherName: article.publisherName || "",
            publisherImage: article.publisherImage || "",
            readDuration: article.readTime || article.readDuration || 5,
            categoryId: article.category?.id || article.categoryId || "",
            direction: article.direction || (locale === "en" ? "ltr" : "rtl"),
          });

          // Load authors if available, otherwise create default from publisherName
          if (article.authors && article.authors.length > 0) {
            setAuthors(
              article.authors.map((a: { id?: string; name: string; imageUrl?: string | null; order: number }) => ({
                id: a.id,
                name: a.name,
                imageUrl: a.imageUrl || null,
                order: a.order,
              }))
            );
          } else if (article.publisherName) {
            // Migrate from old single author system
            setAuthors([
              {
                name: article.publisherName,
                imageUrl: article.publisherImage || null,
                order: 0,
              },
            ]);
          }
        } else {
          setMessage({
            type: "error",
            text: t("editArticleForm.loadError"),
          });
        }
      } catch (error) {
        setMessage({
          type: "error",
          text: t("editArticleForm.loadError"),
        });
      } finally {
        setIsFetching(false);
      }
    };

    if (articleId) {
      fetchCategories();
      fetchArticle();
    }
  }, [articleId, session?.user?.email]);

  if (status === "loading" || isFetching || categoriesLoading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600">
            {t("editArticleForm.loadingGeneric")}
          </p>
        </div>
      </div>
    );
  }

  if (!session || !isAuthorized) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200">
        <p className="text-red-600">
          {t("editArticleForm.notAuthorized")}
        </p>
      </div>
    );
  }

  const fileToDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthorsError("");

    // Validate Tab 1 fields (Title and Authors)
    if (!formData.title.trim()) {
      setActiveTab(1);
      setMessage({
        type: "error",
        text: t("editArticleForm.titleRequired"),
      });
      return;
    }

    // Validate authors
    if (authors.length === 0) {
      setActiveTab(1);
      setAuthorsError("יש להוסיף לפחות מחבר אחד");
      setMessage({
        type: "error",
        text: "יש להוסיף לפחות מחבר אחד",
      });
      return;
    }

    const hasEmptyAuthorName = authors.some((a) => !a.name || a.name.trim() === "");
    if (hasEmptyAuthorName) {
      setActiveTab(1);
      setAuthorsError("כל מחבר חייב לכלול שם");
      setMessage({
        type: "error",
        text: "כל מחבר חייב לכלול שם",
      });
      return;
    }

    // Validate Tab 2 fields (Content)
    if (
      !formData.content ||
      formData.content.trim() === "" ||
      formData.content.replace(/<[^>]*>/g, "").trim() === ""
    ) {
      setActiveTab(2);
      setMessage({
        type: "error",
        text: t("editArticleForm.contentRequired"),
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      let articleImageData = formData.articleImage;

      if (articleImageFile) {
        articleImageData = await fileToDataURL(articleImageFile);
      }

      const submissionData = {
        title: formData.title,
        content: formData.content,
        featuredImage: articleImageData,
        publisherName: authors[0]?.name || formData.publisherName, // Keep for backward compat
        publisherImage: authors[0]?.imageUrl || null,
        direction: formData.direction,
        categoryId: formData.categoryId || undefined,
        authors: authors.map((a, index) => ({
          name: a.name.trim(),
          imageUrl: a.imageUrl || null,
          order: index,
        })),
      };

      const response = await fetch(`/api/articles/${articleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setMessage({
        type: "success",
        text: t("editArticleForm.updateSuccess"),
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/articles/${articleId}`);
      }
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || (t("editArticleForm.updateError") as string),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "readDuration" ? parseInt(value) || 5 : value,
    }));
  };

  const handleContentChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      content,
    }));
  };

  const renderCategoryOptions = () => {
    const options: React.ReactElement[] = [];

    const topLevelCategories = categories.filter(
      (category) => !category.parentId
    );

    topLevelCategories.forEach((category) => {
      options.push(
        <option key={category.id} value={category.id}>
          ▶ {category.name}
        </option>
      );

      const subcategories = categories.filter(
        (sub) => sub.parentId === category.id
      );

      subcategories.forEach((sub) => {
        options.push(
          <option key={sub.id} value={sub.id}>
            &nbsp;&nbsp;&nbsp;&nbsp;└─ {sub.name}
          </option>
        );
      });
    });

    return options;
  };

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 rtl">
          {t("editArticleForm.title")}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {t("editArticleForm.loggedInAs")} {session?.user?.email}
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1" aria-label="Tabs">
          {([1, 2, 3] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-3 font-medium text-sm border-b-2 transition-colors cursor-pointer ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab === 1 && (t("editArticleForm.tabs.basicInfo") as string || "Basic Info")}
              {tab === 2 && (t("editArticleForm.tabs.content") as string || "Content")}
              {tab === 3 && (t("editArticleForm.tabs.settings") as string || "Settings")}
              {tab === 1 && !isTab1Complete && (
                <span className="absolute top-2 -right-0 w-2 h-2 bg-red-500 rounded-full" />
              )}
              {tab === 2 && !isTab2Complete && (
                <span className="absolute top-2 -right-0 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Tab 1: Basic Info */}
        {activeTab === 1 && (
          <>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2 rtl">
                {t("editArticleForm.titleLabel")}
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rtl ${
                  formData.title.trim() === "" ? "border-gray-300" : "border-green-300"
                }`}
                placeholder={t("editArticleForm.titlePlaceholder")}
              />
            </div>

            {/* Category Selection */}
            <div>
              <label
                htmlFor="categoryId"
                className="block text-sm font-medium text-gray-700 mb-2 rtl"
              >
                {t("editArticleForm.categoryLabel")}
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                disabled={categoriesLoading}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 rtl"
              >
                <option value="">
                  {categoriesLoading
                    ? t("editArticleForm.loadingCategories")
                    : t("editArticleForm.selectCategory")}
                </option>
                {renderCategoryOptions()}
              </select>
            </div>

            {/* Authors Section */}
            <AuthorInput
              authors={authors}
              onChange={setAuthors}
              error={authorsError}
            />
          </>
        )}

        {/* Tab 2: Content */}
        {activeTab === 2 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 rtl">
                {t("editArticleForm.contentLabel")}
              </label>
              <TiptapEditor
                value={formData.content}
                onChange={handleContentChange}
                placeholder={t("editArticleForm.contentPlaceholder")}
                direction={formData.direction}
                onDirectionChange={(direction) =>
                  setFormData((prev) => ({ ...prev, direction }))
                }
              />
            </div>

            {/* Article Image */}
            <div>
              <UploadImage
                onImageSelect={setArticleImageFile}
                currentImage={formData.articleImage}
                label={t("editArticleForm.articleImageLabel")}
                placeholder={t("editArticleForm.imagePlaceholder")}
              />
              {formData.articleImage && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, articleImage: "" }));
                    setArticleImageFile(null);
                  }}
                  className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer"
                >
                  {t("editArticleForm.removeImageButton")}
                </button>
              )}
            </div>
          </>
        )}

        {/* Tab 3: Settings */}
        {activeTab === 3 && (
          <>
            <div className="max-w-xs">
              <label
                htmlFor="readDuration"
                className="block text-sm font-medium text-gray-700 mb-2 rtl"
              >
                {t("editArticleForm.readDurationLabel")}
              </label>
              <input
                type="number"
                id="readDuration"
                name="readDuration"
                value={formData.readDuration}
                onChange={handleChange}
                min="1"
                max="60"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <details className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 rtl">
                {t("editArticleForm.imageLinksSummary")}
              </summary>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2 rtl">
                  {t("editArticleForm.articleImageUrlLabel")}
                </label>
                <input
                  type="url"
                  name="articleImage"
                  value={formData.articleImage}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://"
                />
              </div>
            </details>
          </>
        )}

        {/* Submit Button - visible on all tabs */}
        <div className="pt-4 border-t border-gray-200 mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {(!isTab1Complete || !isTab2Complete) && (
                <span className="text-red-600">
                  {t("editArticleForm.requiredFieldsHint") as string || "* Required fields are missing"}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium"
            >
              {isLoading
                ? t("editArticleForm.submitUpdating")
                : t("editArticleForm.submit")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
