"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import TiptapEditor from "@/lib/editor/editor";
import { useTranslation } from "@/contexts/Translation/translation.context";

type CategoryNode = {
  id: string;
  name: string;
  parentId?: string | null;
};

interface CreatePresentationFormProps {
  onSuccess?: () => void;
}

export default function CreatePresentationForm({
  onSuccess,
}: CreatePresentationFormProps) {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    googleSlidesUrl: "",
    imageUrls: [] as string[],
    categoryId: "",
  });

  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);

  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data: CategoryNode[] = await response.json();
          setCategories(data);
        }
      } catch (error) {
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (status === "loading" || categoriesLoading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600">
            {status === "loading"
              ? t("createPresentation.loading")
              : t("createPresentation.loadingCategories")}
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold text-red-600 mb-4">
          {t("createPresentation.loginRequiredTitle")}
        </h2>
        <p className="text-gray-600">
          {t("createPresentation.loginRequiredMessage")}
        </p>
        <button
          onClick={() => (window.location.href = "/elitzur")}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          {t("createPresentation.loginButton")}
        </button>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold text-red-600 mb-4">
          {t("createPresentation.notAuthorizedTitle")}
        </h2>
        <p className="text-gray-600">
          {t("createPresentation.notAuthorizedMessage")}
        </p>
        <p className="text-sm text-gray-500 mt-2">{session?.user?.email}</p>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const submissionData = {
        ...formData,
        imageUrls: formData.imageUrls.filter((url) => url.trim() !== ""),
      };

      const response = await fetch("/api/presentations", {
        method: "POST",
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
        text: t("createPresentation.successMessage"),
      });

      setFormData({
        title: "",
        description: "",
        content: "",
        googleSlidesUrl: "",
        imageUrls: [],
        categoryId: "",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const messageText =
        error instanceof Error
          ? error.message
          : t("createPresentation.errorMessage");
      setMessage({
        type: "error",
        text: messageText,
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
      [name]: value,
    }));
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newImageUrls = [...formData.imageUrls];
    newImageUrls[index] = value;
    setFormData((prev) => ({
      ...prev,
      imageUrls: newImageUrls,
    }));
  };

  const addImageUrl = () => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: [...prev.imageUrls, ""],
    }));
  };

  const removeImageUrl = (index: number) => {
    const newImageUrls = formData.imageUrls.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      imageUrls: newImageUrls,
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
        <h2 className="text-2xl font-bold text-gray-900">
          {t("createPresentation.title")}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {t("createPresentation.loggedInAs")} {session?.user?.email}
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {t("createPresentation.titleLabel")}
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={t("createPresentation.titlePlaceholder")}
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {t("createPresentation.descriptionLabel")}
          </label>
          <TiptapEditor
            value={formData.description}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, description: value }))
            }
            placeholder={t("createPresentation.descriptionPlaceholder")}
          />
        </div>

        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {t("createPresentation.contentLabel")}
          </label>
          <TiptapEditor
            value={formData.content}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, content: value }))
            }
            placeholder={t("createPresentation.contentPlaceholder")}
          />
        </div>

        <div>
          <label
            htmlFor="googleSlidesUrl"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {t("createPresentation.googleSlidesUrlLabel")}
          </label>
          <input
            type="url"
            id="googleSlidesUrl"
            name="googleSlidesUrl"
            value={formData.googleSlidesUrl}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://docs.google.com/presentation/..."
          />
          <p className="mt-2 text-sm text-gray-500">
            {t("createPresentation.googleSlidesHelpText")}
          </p>
        </div>

        <div>
          <label
            htmlFor="categoryId"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {t("createPresentation.categoryLabel")}
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            required
            disabled={categoriesLoading}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          >
            <option value="">
              {categoriesLoading
                ? t("createPresentation.loadingCategories")
                : t("createPresentation.selectCategory")}
            </option>
            {renderCategoryOptions()}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("createPresentation.imageLinksLabel")}
          </label>
          {formData.imageUrls.map((url, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="url"
                value={url}
                onChange={(e) => handleImageUrlChange(index, e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://"
              />
              <button
                type="button"
                onClick={() => removeImageUrl(index)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
              >
                {t("createPresentation.removeImageButton")}
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addImageUrl}
            className="w-full p-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            {t("createPresentation.addImageButton")}
          </button>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium"
          >
            {isLoading
              ? t("createPresentation.submitCreating")
              : t("createPresentation.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
