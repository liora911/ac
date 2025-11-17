"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ALLOWED_EMAILS } from "@/constants/auth";
import TiptapEditor from "@/lib/editor/editor";
import { useTranslation } from "@/contexts/Translation/translation.context";

type CategoryNode = {
  id: string;
  name: string;
  parentId?: string | null;
};

interface EditPresentationFormProps {
  presentationId: string;
  onSuccess?: () => void;
}

export default function EditPresentationForm({
  presentationId,
  onSuccess,
}: EditPresentationFormProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
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
  const { t } = useTranslation();

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

    const fetchPresentation = async () => {
      try {
        const response = await fetch(`/api/presentations/${presentationId}`);
        if (response.ok) {
          const presentation = await response.json();

          setFormData({
            title: presentation.title || "",
            description: presentation.description || "",
            content: presentation.content || "",
            googleSlidesUrl: presentation.googleSlidesUrl || "",
            imageUrls: presentation.imageUrls || [],
            categoryId: presentation.category?.id || "",
          });
        } else {
          setMessage({
            type: "error",
            text: t("editPresentationForm.loadError") as string,
          });
        }
      } catch (error) {
        setMessage({
          type: "error",
          text: t("editPresentationForm.loadError") as string,
        });
      } finally {
        setIsFetching(false);
      }
    };

    if (presentationId) {
      fetchCategories();
      fetchPresentation();
    }
  }, [presentationId, session?.user?.email]);

  if (status === "loading" || isFetching || categoriesLoading) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-2 text-gray-300">
            {status === "loading"
              ? t("editPresentationForm.loadingGeneric")
              : t("editPresentationForm.loadingPresentationData")}
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-400 mb-4 rtl">
            {t("editPresentationForm.loginRequiredTitle")}
          </h2>
          <p className="text-gray-300 rtl">
            {t("editPresentationForm.loginRequiredMessage")}
          </p>
          <button
            onClick={() => (window.location.href = "/elitzur")}
            className="mt-4 bg-indigo-500 text-white px-6 py-2 rounded-md hover:bg-indigo-600 cursor-pointer"
          >
            {t("editPresentationForm.loginButton")}
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-400 mb-4 rtl">
            {t("editPresentationForm.notAuthorizedTitle")}
          </h2>
          <p className="text-gray-300 rtl">
            {t("editPresentationForm.notAuthorizedMessage")}
          </p>
          <p className="text-sm text-gray-400 mt-2">{session?.user?.email}</p>
        </div>
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

      const response = await fetch(`/api/presentations/${presentationId}`, {
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
        text: t("editPresentationForm.updateSuccess") as string,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/presentations/${presentationId}`);
      }
    } catch (error) {
      const messageText =
        error instanceof Error
          ? error.message
          : (t("editPresentationForm.updateError") as string);
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
    <div className="max-w-xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-4 text-center rtl">
        {t("editPresentationForm.title")}
      </h2>

      <p className="text-sm text-green-400 text-center mb-8">
        {t("editPresentationForm.loggedInAs")} {session?.user?.email}
      </p>

      {message && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-900 text-green-200 border border-green-700"
              : "bg-red-900 text-red-200 border border-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="title"
            className="block text-lg font-semibold mb-3 text-white rtl"
          >
            {t("editPresentationForm.titleLabel")}
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-4 bg-gray-800 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400 rtl"
            placeholder={t("editPresentationForm.titlePlaceholder")}
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-lg font-semibold mb-3 text-white rtl"
          >
            {t("editPresentationForm.descriptionLabel")}
          </label>
          <TiptapEditor
            value={formData.description}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, description: value }))
            }
            placeholder={t("editPresentationForm.descriptionPlaceholder")}
            theme="dark"
          />
          <input
            type="hidden"
            name="description"
            value={formData.description}
            required
          />
        </div>

        <div>
          <label
            htmlFor="content"
            className="block text-lg font-semibold mb-3 text-white rtl"
          >
            {t("editPresentationForm.contentLabel")}
          </label>
          <TiptapEditor
            value={formData.content}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, content: value }))
            }
            placeholder={t("editPresentationForm.contentPlaceholder")}
            theme="dark"
          />
          <input
            type="hidden"
            name="content"
            value={formData.content}
            required
          />
        </div>

        <div>
          <label
            htmlFor="googleSlidesUrl"
            className="block text-lg font-semibold mb-3 text-white rtl"
          >
            {t("editPresentationForm.googleSlidesUrlLabel")}
          </label>
          <input
            type="url"
            id="googleSlidesUrl"
            name="googleSlidesUrl"
            value={formData.googleSlidesUrl}
            onChange={handleChange}
            className="w-full p-4 bg-gray-800 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400 rtl"
            placeholder="https://docs.google.com/presentation/..."
          />
          <p className="mt-2 text-sm text-gray-400 rtl">
            {t("editPresentationForm.googleSlidesHelpText")}
          </p>
        </div>

        <div>
          <label
            htmlFor="categoryId"
            className="block text-lg font-semibold mb-3 text-white rtl"
          >
            {t("editPresentationForm.categoryLabel")}
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            required
            disabled={categoriesLoading}
            className="w-full p-4 bg-gray-800 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:opacity-50 rtl"
          >
            <option value="">
              {categoriesLoading
                ? t("editPresentationForm.loadingCategories")
                : t("editPresentationForm.selectCategory")}
            </option>
            {renderCategoryOptions()}
          </select>
        </div>

        <div>
          <label className="block text-lg font-semibold mb-3 text-white rtl">
            {t("editPresentationForm.imageLinksLabel")}
          </label>
          {formData.imageUrls.map((url, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="url"
                value={url}
                onChange={(e) => handleImageUrlChange(index, e.target.value)}
                className="flex-1 p-3 bg-gray-800 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400"
                placeholder="https://"
              />
              <button
                type="button"
                onClick={() => removeImageUrl(index)}
                className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer"
              >
                {t("editPresentationForm.removeImageButton")}
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addImageUrl}
            className="w-full p-3 bg-gray-700 text-white border border-gray-600 rounded-md hover:bg-gray-600 cursor-pointer"
          >
            {t("editPresentationForm.addImageButton")}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-4 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {isLoading
            ? t("editPresentationForm.submitUpdating")
            : t("editPresentationForm.submit")}
        </button>
      </form>
    </div>
  );
}
