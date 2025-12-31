"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import UploadImage from "@/components/Upload/upload";
import { ALLOWED_EMAILS } from "@/constants/auth";
import TiptapEditor from "@/lib/editor/editor";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { CategoryNode, EditLectureFormProps } from "@/types/EditLecture/edit";

export default function EditLectureForm({
  lectureId,
  onSuccess,
}: EditLectureFormProps) {
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
    videoUrl: "",
    duration: "",
    date: "",
    bannerImageUrl: "",
    categoryId: "",
  });

  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
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

    const fetchLecture = async () => {
      try {
        const response = await fetch(`/api/lectures/${lectureId}`);
        if (response.ok) {
          const lecture = await response.json();

          setFormData({
            title: lecture.title || "",
            description: lecture.description || "",
            videoUrl: lecture.videoUrl || "",
            duration: lecture.duration || "",
            date: lecture.date || "",
            bannerImageUrl: lecture.bannerImageUrl || "",
            categoryId: lecture.category?.id || "",
          });
        } else {
          setMessage({
            type: "error",
            text: t("loadingLectureData") as string,
          });
        }
      } catch (error) {
        setMessage({ type: "error", text: t("loadingLectureData") as string });
      } finally {
        setIsFetching(false);
      }
    };

    if (lectureId) {
      fetchCategories();
      fetchLecture();
    }
  }, [lectureId, session?.user?.email]);

  if (status === "loading" || isFetching || categoriesLoading) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600">
            {status === "loading" ? t("loading") : t("loadingLectureData")}
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold text-red-600 mb-4 rtl">
          {t("editLectureForm.loginRequiredTitle")}
        </h2>
        <p className="text-gray-600 rtl">
          {t("editLectureForm.loginRequiredMessage")}
        </p>
        <button
          onClick={() => (window.location.href = "/elitzur")}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          {t("editLectureForm.loginButton")}
        </button>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="p-6 bg-white rounded-xl border border-gray-200">
        <h2 className="text-xl font-bold text-red-600 mb-4 rtl">
          {t("editLectureForm.notAuthorizedTitle")}
        </h2>
        <p className="text-gray-600 rtl">
          {t("editLectureForm.notAuthorizedMessage")}
        </p>
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

    try {
      let bannerImageData = formData.bannerImageUrl;

      if (bannerImageFile) {
        bannerImageData = await fileToDataURL(bannerImageFile);
      }

      const submissionData = {
        ...formData,
        bannerImageUrl: bannerImageData,
      };

      const response = await fetch(`/api/lectures/${lectureId}`, {
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
        text: t("editLectureForm.updateSuccess") as string,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/lectures/${lectureId}`);
      }
    } catch (error) {
      const messageText =
        error instanceof Error
          ? error.message
          : (t("editLectureForm.updateError") as string);
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

  return (
    <div className="p-6 bg-white rounded-xl border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 rtl">
          {t("editLectureForm.title")}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {t("editLectureForm.loggedInAs")} {session?.user?.email}
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
            {t("editLectureForm.titleLabel")}
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rtl"
            placeholder={t("editLectureForm.titlePlaceholder")}
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2 rtl"
          >
            {t("editLectureForm.descriptionLabel")}
          </label>
          <TiptapEditor
            value={formData.description}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, description: value }))
            }
            placeholder={t("editLectureForm.descriptionPlaceholder")}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="videoUrl"
              className="block text-sm font-medium text-gray-700 mb-2 rtl"
            >
              {t("editLectureForm.videoUrlLabel")}
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
              htmlFor="duration"
              className="block text-sm font-medium text-gray-700 mb-2 rtl"
            >
              {t("editLectureForm.durationLabel")}
            </label>
            <input
              type="text"
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={t("editLectureForm.durationPlaceholder")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 mb-2 rtl"
            >
              {t("editLectureForm.dateLabel")}
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

          <div>
            <label
              htmlFor="categoryId"
              className="block text-sm font-medium text-gray-700 mb-2 rtl"
            >
              {t("editLectureForm.categoryLabel")}
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
                  ? t("editLectureForm.loadingCategories")
                  : t("editLectureForm.selectCategory")}
              </option>
              {renderCategoryOptions()}
            </select>
          </div>
        </div>

        <details className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 rtl">
            {t("editLectureForm.imageSummary")}
          </summary>
          <div className="mt-4 space-y-4">
            <UploadImage
              onImageSelect={setBannerImageFile}
              currentImage={formData.bannerImageUrl}
              label=""
              placeholder={t("editLectureForm.imagePlaceholder")}
            />
            {formData.bannerImageUrl && (
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, bannerImageUrl: "" }));
                  setBannerImageFile(null);
                }}
                className="text-red-600 hover:text-red-700 text-sm font-medium cursor-pointer"
              >
                {t("editLectureForm.removeImageButton")}
              </button>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 rtl">
                {t("editLectureForm.imageUrlLabel")}
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
          </div>
        </details>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium"
          >
            {isLoading
              ? t("editLectureForm.submitUpdating")
              : t("editLectureForm.submit")}
          </button>
        </div>
      </form>
    </div>
  );
}
