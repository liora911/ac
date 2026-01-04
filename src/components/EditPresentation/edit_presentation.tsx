"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
    pdfUrl: null as string | null,
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
            pdfUrl: presentation.pdfUrl || null,
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
      <div className="p-6 bg-white rounded-xl border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600">
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
      <div className="p-6 bg-white rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold text-red-600 mb-4 rtl">
          {t("editPresentationForm.loginRequiredTitle")}
        </h2>
        <p className="text-gray-600 rtl">
          {t("editPresentationForm.loginRequiredMessage")}
        </p>
        <button
          onClick={() => (window.location.href = "/elitzur")}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          {t("editPresentationForm.loginButton")}
        </button>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold text-red-600 mb-4 rtl">
          {t("editPresentationForm.notAuthorizedTitle")}
        </h2>
        <p className="text-gray-600 rtl">
          {t("editPresentationForm.notAuthorizedMessage")}
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
          {t("editPresentationForm.title")}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {t("editPresentationForm.loggedInAs")} {session?.user?.email}
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
            className="block text-sm font-medium text-gray-700 mb-2 rtl"
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
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rtl"
            placeholder={t("editPresentationForm.titlePlaceholder")}
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2 rtl"
          >
            {t("editPresentationForm.descriptionLabel")}
          </label>
          <TiptapEditor
            value={formData.description}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, description: value }))
            }
            placeholder={t("editPresentationForm.descriptionPlaceholder")}
          />
        </div>

        <div>
          <label
            htmlFor="content"
            className="block text-sm font-medium text-gray-700 mb-2 rtl"
          >
            {t("editPresentationForm.contentLabel")}
          </label>
          <TiptapEditor
            value={formData.content}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, content: value }))
            }
            placeholder={t("editPresentationForm.contentPlaceholder")}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="googleSlidesUrl"
              className="block text-sm font-medium text-gray-700 mb-2 rtl"
            >
              {t("editPresentationForm.googleSlidesUrlLabel")}
            </label>
            <input
              type="url"
              id="googleSlidesUrl"
              name="googleSlidesUrl"
              value={formData.googleSlidesUrl}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rtl"
              placeholder="https://docs.google.com/presentation/..."
            />
            <p className="mt-1 text-xs text-gray-500 rtl">
              {t("editPresentationForm.googleSlidesHelpText")}
            </p>
          </div>

          <div>
            <PdfUpload
              pdfUrl={formData.pdfUrl}
              onChange={handlePdfChange}
              onError={handleUploadError}
              labels={{
                title: t("editPresentationForm.pdfLabel") as string || "PDF Presentation",
                dragDropText: t("editPresentationForm.pdfDragDropText") as string || "Drag & drop PDF here",
                orClickToUpload: t("editPresentationForm.pdfOrClickToUpload") as string || "or click to select file",
                maxFileSize: t("editPresentationForm.pdfMaxFileSize") as string || "Max 50MB (PDF only)",
                uploadError: t("editPresentationForm.pdfUploadError") as string || "Failed to upload PDF",
                invalidFileType: t("editPresentationForm.pdfInvalidFileType") as string || "Please select a valid PDF file",
                removeButton: t("editPresentationForm.pdfRemoveButton") as string || "Remove",
                viewPdf: t("editPresentationForm.pdfViewButton") as string || "View PDF",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="categoryId"
              className="block text-sm font-medium text-gray-700 mb-2 rtl"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 rtl"
            >
              <option value="">
                {categoriesLoading
                  ? t("editPresentationForm.loadingCategories")
                  : t("editPresentationForm.selectCategory")}
              </option>
              {renderCategoryOptions()}
            </select>
          </div>
        </div>

        <MultiImageUpload
          imageUrls={formData.imageUrls}
          onChange={handleImageUrlsChange}
          onError={handleUploadError}
          labels={{
            title: t("editPresentationForm.imageLinksLabel") as string,
            uploadMode: t("editPresentationForm.uploadMode") as string || "Upload",
            urlMode: t("editPresentationForm.urlMode") as string || "URL",
            dragDropText: t("editPresentationForm.dragDropText") as string || "Drag & drop images here",
            orClickToUpload: t("editPresentationForm.orClickToUpload") as string || "or click to select files",
            maxFileSize: t("editPresentationForm.maxFileSize") as string || "Max 5MB per image (JPEG, PNG, GIF, WebP)",
            noImagesYet: t("editPresentationForm.noImagesYet") as string || "No images added yet. Click the button below to add URLs.",
            addImageButton: t("editPresentationForm.addImageButton") as string,
            removeImageButton: t("editPresentationForm.removeImageButton") as string || "Remove",
            uploadError: t("editPresentationForm.uploadError") as string || "Failed to upload image",
            invalidFileType: t("editPresentationForm.invalidFileType") as string || "Please select valid image files (max 5MB each)",
          }}
        />

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium"
          >
            {isLoading
              ? t("editPresentationForm.submitUpdating")
              : t("editPresentationForm.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
