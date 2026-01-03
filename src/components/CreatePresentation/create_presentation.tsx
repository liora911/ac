"use client";

import React, { useState, FormEvent, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import TiptapEditor from "@/lib/editor/editor";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { Upload, X, Link as LinkIcon, Loader2 } from "lucide-react";
import Image from "next/image";

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
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImages, setUploadingImages] = useState<Set<number>>(new Set());
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : t("createPresentation.uploadError") || "Failed to upload image",
      });
      return null;
    }
  }, [t]);

  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file =>
      file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length === 0) {
      setMessage({
        type: "error",
        text: t("createPresentation.invalidFileType") || "Please select valid image files (max 5MB each)",
      });
      return;
    }

    // Add placeholder entries for uploading images
    const startIndex = formData.imageUrls.length;
    const placeholders = validFiles.map(() => "");
    setFormData(prev => ({
      ...prev,
      imageUrls: [...prev.imageUrls, ...placeholders],
    }));

    // Track which images are uploading
    const newUploading = new Set(uploadingImages);
    validFiles.forEach((_, i) => newUploading.add(startIndex + i));
    setUploadingImages(newUploading);

    // Upload each file
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const url = await uploadFile(file);

      if (url) {
        setFormData(prev => {
          const newUrls = [...prev.imageUrls];
          newUrls[startIndex + i] = url;
          return { ...prev, imageUrls: newUrls };
        });
      } else {
        // Remove failed upload placeholder
        setFormData(prev => {
          const newUrls = prev.imageUrls.filter((_, idx) => idx !== startIndex + i);
          return { ...prev, imageUrls: newUrls };
        });
      }

      // Remove from uploading set
      setUploadingImages(prev => {
        const next = new Set(prev);
        next.delete(startIndex + i);
        return next;
      });
    }
  }, [formData.imageUrls.length, uploadFile, uploadingImages, t]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [handleFileUpload]);

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

          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setImageInputMode("upload")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
                imageInputMode === "upload"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Upload className="w-4 h-4" />
              {t("createPresentation.uploadMode") || "Upload"}
            </button>
            <button
              type="button"
              onClick={() => setImageInputMode("url")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors cursor-pointer ${
                imageInputMode === "url"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              {t("createPresentation.urlMode") || "URL"}
            </button>
          </div>

          {/* Upload Mode - Drag & Drop Area */}
          {imageInputMode === "upload" && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-4 ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
              />
              <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? "text-blue-500" : "text-gray-400"}`} />
              <p className="text-gray-600 font-medium">
                {t("createPresentation.dragDropText") || "Drag & drop images here"}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {t("createPresentation.orClickToUpload") || "or click to select files"}
              </p>
              <p className="text-gray-400 text-xs mt-2">
                {t("createPresentation.maxFileSize") || "Max 5MB per image (JPEG, PNG, GIF, WebP)"}
              </p>
            </div>
          )}

          {/* URL Mode - Manual URL Input */}
          {imageInputMode === "url" && (
            <div className="mb-4">
              {formData.imageUrls.length === 0 && (
                <p className="text-gray-500 text-sm mb-2">
                  {t("createPresentation.noImagesYet") || "No images added yet. Click the button below to add URLs."}
                </p>
              )}
              <button
                type="button"
                onClick={addImageUrl}
                className="w-full p-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <LinkIcon className="w-4 h-4" />
                {t("createPresentation.addImageButton")}
              </button>
            </div>
          )}

          {/* Image Preview Grid */}
          {formData.imageUrls.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
              {formData.imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  {uploadingImages.has(index) || !url ? (
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={url}
                          alt={`Image ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImageUrl(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-red-700"
                        title={t("createPresentation.removeImageButton") || "Remove"}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {/* URL input for editing (only in URL mode) */}
                  {imageInputMode === "url" && url && (
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleImageUrlChange(index, e.target.value)}
                      className="mt-1 w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
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
