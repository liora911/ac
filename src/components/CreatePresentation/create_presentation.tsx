"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import TiptapEditor from "@/lib/editor/editor";
import { useTranslation } from "@/contexts/Translation/translation.context";
import MultiImageUpload from "@/components/Upload/MultiImageUpload";
import PdfUpload from "@/components/Upload/PdfUpload";

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
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    googleSlidesUrl: "",
    pdfUrl: null as string | null,
    imageUrls: [] as string[],
    categoryId: "",
  });

  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);

  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );

  // Validation for Tab 1 (required fields)
  const isTab1Complete = formData.title.trim() !== "" && formData.categoryId !== "";

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

    // Validate required fields before submission
    if (!isTab1Complete) {
      setMessage({
        type: "error",
        text: t("createPresentation.requiredFieldsError") || "Please fill in all required fields (Title and Category)",
      });
      setActiveTab(1);
      setIsLoading(false);
      return;
    }

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
        pdfUrl: null,
        imageUrls: [],
        categoryId: "",
      });

      setActiveTab(1);

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

  const handleImageUrlsChange = (urls: string[]) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: urls,
    }));
  };

  const handleUploadError = (errorMessage: string) => {
    setMessage({
      type: "error",
      text: errorMessage,
    });
  };

  const handlePdfChange = (url: string | null) => {
    setFormData((prev) => ({
      ...prev,
      pdfUrl: url,
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
          {category.name}
        </option>
      );

      const subcategories = categories.filter(
        (sub) => sub.parentId === category.id
      );

      subcategories.forEach((sub) => {
        options.push(
          <option key={sub.id} value={sub.id}>
            &nbsp;&nbsp;&nbsp;&nbsp;{sub.name}
          </option>
        );
      });
    });

    return options;
  };

  const tabLabels = {
    1: t("createPresentation.tabs.basicInfo") || "Basic Info",
    2: t("createPresentation.tabs.content") || "Content",
    3: t("createPresentation.tabs.media") || "Media",
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
                {t("createPresentation.titleLabel")}
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
                placeholder={t("createPresentation.titlePlaceholder")}
              />
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
                disabled={categoriesLoading}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 ${
                  formData.categoryId === "" ? "border-gray-300" : "border-green-300"
                }`}
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
          </>
        )}

        {/* Tab 2: Content */}
        {activeTab === 2 && (
          <>
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
          </>
        )}

        {/* Tab 3: Media */}
        {activeTab === 3 && (
          <>
            <PdfUpload
              pdfUrl={formData.pdfUrl}
              onChange={handlePdfChange}
              onError={handleUploadError}
              labels={{
                title: t("createPresentation.pdfLabel") || "PDF Presentation",
                dragDropText: t("createPresentation.pdfDragDropText") || "Drag & drop PDF here",
                orClickToUpload: t("createPresentation.pdfOrClickToUpload") || "or click to select file",
                maxFileSize: t("createPresentation.pdfMaxFileSize") || "Max 50MB (PDF only)",
                uploadError: t("createPresentation.pdfUploadError") || "Failed to upload PDF",
                invalidFileType: t("createPresentation.pdfInvalidFileType") || "Please select a valid PDF file",
                removeButton: t("createPresentation.pdfRemoveButton") || "Remove",
                viewPdf: t("createPresentation.pdfViewButton") || "View PDF",
              }}
            />

            <MultiImageUpload
              imageUrls={formData.imageUrls}
              onChange={handleImageUrlsChange}
              onError={handleUploadError}
              labels={{
                title: t("createPresentation.imageLinksLabel"),
                uploadMode: t("createPresentation.uploadMode") || "Upload",
                urlMode: t("createPresentation.urlMode") || "URL",
                dragDropText: t("createPresentation.dragDropText") || "Drag & drop images here",
                orClickToUpload: t("createPresentation.orClickToUpload") || "or click to select files",
                maxFileSize: t("createPresentation.maxFileSize") || "Max 5MB per image (JPEG, PNG, GIF, WebP)",
                noImagesYet: t("createPresentation.noImagesYet") || "No images added yet. Click the button below to add URLs.",
                addImageButton: t("createPresentation.addImageButton"),
                removeImageButton: t("createPresentation.removeImageButton") || "Remove",
                uploadError: t("createPresentation.uploadError") || "Failed to upload image",
                invalidFileType: t("createPresentation.invalidFileType") || "Please select valid image files (max 5MB each)",
              }}
            />
          </>
        )}

        {/* Submit Button - only visible on last tab */}
        {activeTab === 3 && (
          <div className="pt-4 border-t border-gray-200 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {!isTab1Complete && (
                  <span className="text-red-600">
                    {t("createPresentation.requiredFieldsHint") || "* Required fields are missing in Basic Info tab"}
                  </span>
                )}
              </div>
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
          </div>
        )}
      </form>
    </div>
  );
}
