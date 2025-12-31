"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import UploadImage from "@/components/Upload/upload";
import { ALLOWED_EMAILS } from "@/constants/auth";
import { useTranslation } from "@/contexts/Translation/translation.context";
import dynamic from "next/dynamic";

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

  const [articleImageFile, setArticleImageFile] = useState<File | null>(null);
  const [publisherImageFile, setPublisherImageFile] = useState<File | null>(
    null
  );
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);

  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

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
            articleImage: article.articleImage || "",
            publisherName: article.publisherName || "",
            publisherImage: article.publisherImage || "",
            readDuration: article.readDuration || 5,
            categoryId: article.category?.id || "",
            direction: article.direction || (locale === "en" ? "ltr" : "rtl"),
          });
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

    if (!formData.title.trim()) {
      setMessage({
        type: "error",
        text: t("editArticleForm.titleRequired"),
      });
      return;
    }
    if (
      !formData.content ||
      formData.content.trim() === "" ||
      formData.content.replace(/<[^>]*>/g, "").trim() === ""
    ) {
      setMessage({
        type: "error",
        text: t("editArticleForm.contentRequired"),
      });
      return;
    }
    if (!formData.publisherName.trim()) {
      setMessage({
        type: "error",
        text: t("editArticleForm.authorRequired"),
      });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      let articleImageData = formData.articleImage;
      let publisherImageData = formData.publisherImage;

      if (articleImageFile) {
        articleImageData = await fileToDataURL(articleImageFile);
      }

      if (publisherImageFile) {
        publisherImageData = await fileToDataURL(publisherImageFile);
      }

      const submissionData = {
        ...formData,
        articleImage: articleImageData,
        publisherImage: publisherImageData,
        direction: formData.direction,
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
        router.push("/articles");
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

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rtl"
            placeholder={t("editArticleForm.titlePlaceholder")}
          />
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="publisherName"
              className="block text-sm font-medium text-gray-700 mb-2 rtl"
            >
              {t("editArticleForm.authorLabel")}
            </label>
            <input
              type="text"
              id="publisherName"
              name="publisherName"
              value={formData.publisherName}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rtl"
              placeholder={t("editArticleForm.authorPlaceholder")}
            />
          </div>

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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div>
            <UploadImage
              onImageSelect={setPublisherImageFile}
              currentImage={formData.publisherImage}
              label={t("editArticleForm.authorImageLabel")}
              placeholder={t("editArticleForm.imagePlaceholder")}
            />
            {formData.publisherImage && (
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, publisherImage: "" }));
                  setPublisherImageFile(null);
                }}
                className="mt-2 text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer"
              >
                {t("editArticleForm.removeImageButton")}
              </button>
            )}
          </div>
        </div>

        <details className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 rtl">
            {t("editArticleForm.imageLinksSummary")}
          </summary>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 rtl">
                {t("editArticleForm.authorImageUrlLabel")}
              </label>
              <input
                type="url"
                name="publisherImage"
                value={formData.publisherImage}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://"
              />
            </div>
          </div>
        </details>

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

        <div className="pt-4">
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
      </form>
    </div>
  );
}
