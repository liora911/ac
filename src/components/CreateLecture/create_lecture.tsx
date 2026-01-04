"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import UploadImage from "@/components/Upload/upload";
import { ALLOWED_EMAILS } from "@/constants/auth";
import TiptapEditor from "@/lib/editor/editor";
import { useTranslation } from "@/contexts/Translation/translation.context";

type CategoryNode = {
  id: string;
  name: string;
  parentId?: string | null;
};

interface CreateLectureFormProps {
  onSuccess?: () => void;
}

export default function CreateLectureForm({
  onSuccess,
}: CreateLectureFormProps) {
  const { t } = useTranslation();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoUrl: "",
    duration: "",
    date: "",
    bannerImageUrl: "",
    categoryId: "",
  });

  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);

  // Validation for Tab 1 (required fields)
  const isTab1Complete = formData.title.trim() !== "" && formData.categoryId !== "" && formData.duration.trim() !== "";

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
              ? t("createLecture.loading")
              : t("createLecture.loadingCategories")}
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold text-red-600 mb-4">
          {t("createLecture.loginRequiredTitle")}
        </h2>
        <p className="text-gray-600">{t("createLecture.loginRequiredMessage")}</p>
        <button
          onClick={() => (window.location.href = "/elitzur")}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          {t("createLecture.loginButton")}
        </button>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold text-red-600 mb-4">
          {t("createLecture.notAuthorizedTitle")}
        </h2>
        <p className="text-gray-600">{t("createLecture.notAuthorizedMessage")}</p>
        <p className="text-sm text-gray-500 mt-2">{session?.user?.email}</p>
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
    setIsLoading(true);
    setMessage(null);

    // Validate required fields before submission
    if (!isTab1Complete) {
      setMessage({
        type: "error",
        text: t("createLecture.requiredFieldsError") || "Please fill in all required fields (Title, Category, and Duration)",
      });
      setActiveTab(1);
      setIsLoading(false);
      return;
    }

    try {
      let bannerImageData = formData.bannerImageUrl;

      if (bannerImageFile) {
        bannerImageData = await fileToDataURL(bannerImageFile);
      }

      const submissionData = {
        ...formData,
        bannerImageUrl: bannerImageData,
      };

      const response = await fetch("/api/lectures", {
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

      setMessage({ type: "success", text: t("createLecture.successMessage") });

      setFormData({
        title: "",
        description: "",
        videoUrl: "",
        duration: "",
        date: "",
        bannerImageUrl: "",
        categoryId: "",
      });
      setBannerImageFile(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : t("createLecture.errorMessage");
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

  const tabLabels = {
    1: t("createLecture.tabs.basicInfo") || "Basic Info",
    2: t("createLecture.tabs.content") || "Content",
    3: t("createLecture.tabs.media") || "Media",
  };

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {t("createLecture.title")}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {t("createLecture.loggedInAs")} {session?.user?.email}
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
              {tabLabels[tab]}
              {tab === 1 && !isTab1Complete && (
                <span className="absolute top-2 -right-0 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tab 1: Basic Info */}
        {activeTab === 1 && (
          <>
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("createLecture.titleLabel")}
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formData.title.trim() === "" ? "border-gray-300" : "border-green-300"
                }`}
                placeholder={t("createLecture.titlePlaceholder")}
              />
            </div>

            <div>
              <label
                htmlFor="categoryId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("createLecture.categoryLabel")}
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                disabled={categoriesLoading}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 ${
                  formData.categoryId === "" ? "border-gray-300" : "border-green-300"
                }`}
              >
                <option value="">
                  {categoriesLoading
                    ? t("createLecture.loadingCategories")
                    : t("createLecture.selectCategory")}
                </option>
                {renderCategoryOptions()}
              </select>
            </div>

            <div>
              <label
                htmlFor="duration"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("createLecture.durationLabel")}
              </label>
              <input
                type="text"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formData.duration.trim() === "" ? "border-gray-300" : "border-green-300"
                }`}
                placeholder={t("createLecture.durationPlaceholder")}
              />
            </div>
          </>
        )}

        {/* Tab 2: Content */}
        {activeTab === 2 && (
          <>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("createLecture.descriptionLabel")}
              </label>
              <TiptapEditor
                value={formData.description}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, description: value }))
                }
                placeholder={t("createLecture.descriptionPlaceholder")}
              />
            </div>

            <div>
              <label
                htmlFor="videoUrl"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("createLecture.videoUrlLabel")}
              </label>
              <input
                type="url"
                id="videoUrl"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://"
              />
            </div>

            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t("createLecture.dateLabel")}
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </>
        )}

        {/* Tab 3: Media */}
        {activeTab === 3 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("createLecture.imageSummary")}
              </label>
              <UploadImage
                onImageSelect={setBannerImageFile}
                currentImage={formData.bannerImageUrl}
                label=""
                placeholder={t("createLecture.imagePlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("createLecture.imageUrlLabel")}
              </label>
              <input
                type="url"
                name="bannerImageUrl"
                value={formData.bannerImageUrl}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://"
              />
            </div>
          </>
        )}

        {/* Submit Button - visible on all tabs */}
        <div className="pt-4 border-t border-gray-200 mt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {!isTab1Complete && (
                <span className="text-red-600">
                  {t("createLecture.requiredFieldsHint") || "* Required fields are missing in Basic Info tab"}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium"
            >
              {isLoading
                ? t("createLecture.submitCreating")
                : t("createLecture.submit")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
