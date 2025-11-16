"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import UploadImage from "@/components/Upload/upload";
import { ALLOWED_EMAILS } from "@/constants/auth";
import TiptapEditor from "@/lib/editor/editor";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useTheme } from "@/contexts/ThemeContext";

interface EditLectureFormProps {
  lectureId: string;
  onSuccess?: () => void;
}

type CategoryNode = {
  id: string;
  name: string;
  parentId?: string | null;
};

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
  const { theme } = useTheme();

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
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">
            {status === "loading" ? t("loading") : t("loadingLectureData")}
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4 rtl">
            נדרשת התחברות
          </h2>
          <p className="text-gray-600 rtl">עליך להתחבר כדי לערוך הרצאות</p>
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
      <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4 rtl">אין הרשאה</h2>
          <p className="text-gray-600 rtl">אין לך הרשאה לערוך הרצאות באתר זה</p>
          <p className="text-sm text-gray-500 mt-2">{session?.user?.email}</p>
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
    } catch (error) {
      const messageText =
        error instanceof Error
          ? error.message
          : "שגיאה בעדכון ההרצאה. נסה שוב.";
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
    <div className="max-w-4xl mx-auto rounded-2xl border border-cyan-500/40 bg-slate-950/70 p-8 shadow-[0_0_45px_rgba(8,47,73,0.9)] backdrop-blur">
      <div className="mb-8 border-b border-slate-700 pb-4">
        <p className="text-[11px] font-mono uppercase tracking-[0.35em] text-cyan-400 text-center rtl">
          Quantum Lecture Control Panel
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-cyan-200 text-center rtl">
          עריכת הרצאה
        </h2>
        <p className="mt-3 flex items-center justify-center text-[11px] font-mono text-emerald-300/80">
          <span className="rounded-full border border-emerald-500/60 bg-emerald-950/40 px-3 py-1">
            SESSION · {session?.user?.email}
          </span>
        </p>
      </div>

      {message && (
        <div
          className={`mb-8 rounded-xl border px-4 py-3 text-sm font-mono ${
            message.type === "success"
              ? "border-emerald-500/60 bg-emerald-950/60 text-emerald-200"
              : "border-rose-500/70 bg-rose-950/70 text-rose-100"
          }`}
        >
          {message.text}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 text-sm text-slate-100"
      >
        <div className="rounded-xl border border-slate-700/80 bg-slate-950/50 p-4 shadow-[0_0_0_1px_rgba(15,23,42,1)]">
          <label
            htmlFor="title"
            className="mb-2 block text-[11px] font-mono uppercase tracking-[0.35em] text-slate-300 rtl"
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
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-50 shadow-inner focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 placeholder-slate-500 rtl"
            placeholder="הכנס כותרת להרצאה"
          />
          <p className="mt-1 text-[11px] text-slate-500 rtl">
            שם מדויק ומדעי מקל על חיפוש והפניות עתידיות.
          </p>
        </div>

        <div className="rounded-xl border border-slate-700/80 bg-slate-950/50 p-4 shadow-[0_0_0_1px_rgba(15,23,42,1)]">
          <label
            htmlFor="description"
            className="mb-2 block text-[11px] font-mono uppercase tracking-[0.35em] text-slate-300 rtl"
          >
            תיאור ההרצאה *
          </label>
          <div className="mt-2 rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-2">
            <TiptapEditor
              value={formData.description}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, description: value }))
              }
              placeholder="הכנס תיאור להרצאה"
              theme={theme}
            />
          </div>
          <input
            type="hidden"
            name="description"
            value={formData.description}
            required
          />
          <p className="mt-1 text-[11px] text-slate-500 rtl">
            נסח את התיאור כתקציר מדעי: רקע, שיטה ותוצאה מרכזית.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-700/80 bg-slate-950/50 p-4 shadow-[0_0_0_1px_rgba(15,23,42,1)]">
            <label
              htmlFor="videoUrl"
              className="mb-2 block text-[11px] font-mono uppercase tracking-[0.35em] text-slate-300 rtl"
            >
              קישור לוידאו
            </label>
            <input
              type="url"
              id="videoUrl"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-50 shadow-inner focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 placeholder-slate-500"
              placeholder="https://"
            />
            <p className="mt-1 text-[11px] text-slate-500 rtl">
              קישור להרצאה מוקלטת או שידור חי.
            </p>
          </div>

          <div className="rounded-xl border border-slate-700/80 bg-slate-950/50 p-4 shadow-[0_0_0_1px_rgba(15,23,42,1)]">
            <label
              htmlFor="duration"
              className="mb-2 block text-[11px] font-mono uppercase tracking-[0.35em] text-slate-300 rtl"
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
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-50 shadow-inner focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 placeholder-slate-500"
              placeholder="למשל: 60"
            />
            <p className="mt-1 text-[11px] text-slate-500 rtl">
              זמן משוער בדקות – חשוב לתכנון לוח זמנים.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-700/80 bg-slate-950/50 p-4 shadow-[0_0_0_1px_rgba(15,23,42,1)]">
            <label
              htmlFor="date"
              className="mb-2 block text-[11px] font-mono uppercase tracking-[0.35em] text-slate-300 rtl"
            >
              תאריך (אופציונלי)
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-50 shadow-inner focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
            />
            <p className="mt-1 text-[11px] text-slate-500 rtl">
              ציין תאריך אם ההרצאה מתוזמנת לאירוע מסוים.
            </p>
          </div>

          <div className="rounded-xl border border-slate-700/80 bg-slate-950/50 p-4 shadow-[0_0_0_1px_rgba(15,23,42,1)]">
            <label
              htmlFor="categoryId"
              className="mb-2 block text-[11px] font-mono uppercase tracking-[0.35em] text-slate-300 rtl"
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
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-50 shadow-inner focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 disabled:cursor-not-allowed disabled:opacity-50 rtl"
            >
              <option value="">
                {categoriesLoading ? "טוען קטגוריות..." : "בחר קטגוריה"}
              </option>
              {renderCategoryOptions()}
            </select>
            <p className="mt-1 text-[11px] text-slate-500 rtl">
              השתמש בקטגוריות לפי תחומי מחקר ותתי-תחומים.
            </p>
          </div>
        </div>

        <details className="group rounded-xl border border-dashed border-slate-700/80 bg-slate-950/40 p-4 transition-colors">
          <summary className="flex cursor-pointer items-center justify-between text-[11px] font-mono uppercase tracking-[0.35em] text-slate-300 rtl">
            <span>תמונת ההרצאה (אופציונלי)</span>
            <span className="text-[10px] text-cyan-400 group-open:hidden">
              + expand
            </span>
            <span className="hidden text-[10px] text-cyan-400 group-open:inline">
              − collapse
            </span>
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
                  className="mt-2 rounded-md border border-rose-500/70 bg-rose-950/70 px-3 py-1 text-xs font-mono text-rose-100 transition hover:border-rose-400 hover:bg-rose-900 cursor-pointer"
                >
                  הסר תמונה
                </button>
              )}
            </div>
            <div>
              <label className="mb-2 block text-[11px] font-mono uppercase tracking-[0.35em] text-slate-300 rtl">
                או הכנס קישור לתמונה
              </label>
              <input
                type="url"
                name="bannerImageUrl"
                value={formData.bannerImageUrl}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-slate-50 shadow-inner focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 placeholder-slate-500"
                placeholder="https://"
              />
              <p className="mt-1 text-[11px] text-slate-500 rtl">
                ניתן להשתמש בגרף, תרשים או תמונה מניסוי רלוונטי.
              </p>
            </div>
          </div>
        </details>

        <button
          type="submit"
          disabled={isLoading}
          className="relative mt-4 flex w-full items-center justify-center overflow-hidden rounded-xl border border-cyan-400/80 bg-gradient-to-r from-cyan-500 via-sky-500 to-emerald-500 px-6 py-3 text-xs font-mono uppercase tracking-[0.4em] text-slate-950 shadow-[0_0_40px_rgba(34,211,238,0.7)] transition hover:shadow-[0_0_55px_rgba(34,211,238,0.95)] focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "מעדכן הרצאה..." : "עדכן הרצאה"}
        </button>
      </form>
    </div>
  );
}
