"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import UploadImage from "@/components/Upload/upload";
import { ALLOWED_EMAILS } from "@/constants/auth";
import TiptapEditor from "@/lib/editor/editor";
import { useTranslation } from "@/contexts/Translation/translation.context";

interface EditLectureFormProps {
  lectureId: string;
  onSuccess?: () => void;
}

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
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const { t } = useTranslation();

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
        console.error("Error fetching categories:", error);
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
        console.error("Error fetching lecture:", error);
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
      <div className="max-w-xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-2 text-gray-300">
            {status === "loading" ? t("loading") : t("loadingLectureData")}
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
            נדרשת התחברות
          </h2>
          <p className="text-gray-300 rtl">עליך להתחבר כדי לערוך הרצאות</p>
          <button
            onClick={() => (window.location.href = "/elitzur")}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 cursor-pointer"
          >
            התחבר
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-400 mb-4 rtl">אין הרשאה</h2>
          <p className="text-gray-300 rtl">אין לך הרשאה לערוך הרצאות באתר זה</p>
          <p className="text-sm text-gray-400 mt-2">{session?.user?.email}</p>
        </div>
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

      setMessage({ type: "success", text: "ההרצאה עודכנה בהצלחה!" });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/lectures/${lectureId}`);
      }
    } catch (error: any) {
      console.error("Error updating lecture:", error);
      setMessage({
        type: "error",
        text: error.message || "שגיאה בעדכון ההרצאה. נסה שוב.",
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
    const options: any[] = [];

    categories.forEach((category) => {
      options.push(
        <option key={category.id} value={category.id}>
          ▶ {category.name}
        </option>
      );

      if (category.subcategories && category.subcategories.length > 0) {
        category.subcategories.forEach((sub: any) => {
          options.push(
            <option key={sub.id} value={sub.id}>
              &nbsp;&nbsp;&nbsp;&nbsp;└─ {sub.name}
            </option>
          );
        });
      }
    });

    return options;
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-4 text-center rtl">עריכת הרצאה</h2>

      <p className="text-sm text-green-400 text-center mb-8">
        מחובר כ: {session?.user?.email}
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
            כותרת ההרצאה *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-4 bg-gray-800 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400 rtl"
            placeholder="הכנס כותרת להרצאה"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-lg font-semibold mb-3 text-white rtl"
          >
            תיאור ההרצאה *
          </label>
          <TiptapEditor
            value={formData.description}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, description: value }))
            }
            placeholder="הכנס תיאור להרצאה"
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
            htmlFor="videoUrl"
            className="block text-lg font-semibold mb-3 text-white rtl"
          >
            קישור לוידאו (YouTube וכו')
          </label>
          <input
            type="url"
            id="videoUrl"
            name="videoUrl"
            value={formData.videoUrl}
            onChange={handleChange}
            className="w-full p-4 bg-gray-800 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400"
            placeholder="https://" //"
          />
        </div>

        <div>
          <label
            htmlFor="duration"
            className="block text-lg font-semibold mb-3 text-white rtl"
          >
            משך זמן (דקות) *
          </label>
          <input
            type="text"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            required
            className="w-full p-4 bg-gray-800 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400"
            placeholder="למשל: 60 דקות"
          />
        </div>

        <div>
          <label
            htmlFor="date"
            className="block text-lg font-semibold mb-3 text-white rtl"
          >
            תאריך (אופציונלי)
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full p-4 bg-gray-800 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
          />
        </div>

        <div>
          <label
            htmlFor="categoryId"
            className="block text-lg font-semibold mb-3 text-white rtl"
          >
            קטגוריה *
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
              {categoriesLoading ? "טוען קטגוריות..." : "בחר קטגוריה"}
            </option>
            {renderCategoryOptions()}
          </select>
        </div>

        <details className="border border-gray-600 rounded-lg p-4 bg-gray-800">
          <summary className="cursor-pointer text-lg font-semibold text-white rtl mb-3">
            תמונת ההרצאה (אופציונלי)
          </summary>
          <div className="mt-4 space-y-4">
            <div>
              <UploadImage
                onImageSelect={setBannerImageFile}
                currentImage={formData.bannerImageUrl}
                label=""
                placeholder="PNG, JPG, GIF עד 5MB"
              />
              {formData.bannerImageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, bannerImageUrl: "" }));
                    setBannerImageFile(null);
                  }}
                  className="mt-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm cursor-pointer"
                >
                  הסר תמונה
                </button>
              )}
            </div>
            <div>
              <label className="block text-base font-medium mb-2 text-gray-200 rtl">
                או הכנס קישור לתמונה
              </label>
              <input
                type="url"
                name="bannerImageUrl"
                value={formData.bannerImageUrl}
                onChange={handleChange}
                className="w-full p-3 bg-gray-700 text-white border border-gray-500 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400"
                placeholder="https://" //"
              />
            </div>
          </div>
        </details>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-4 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {isLoading ? "מעדכן הרצאה..." : "עדכן הרצאה"}
        </button>
      </form>
    </div>
  );
}
