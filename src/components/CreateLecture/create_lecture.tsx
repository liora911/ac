"use client";

import { useState, FormEvent } from "react";
import { useSession } from "next-auth/react";
import UploadImage from "@/components/Upload/upload";
import { ALLOWED_EMAILS } from "@/constants/auth";

interface CreateLectureFormProps {
  onSuccess?: () => void;
}

export default function CreateLectureForm({
  onSuccess,
}: CreateLectureFormProps) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
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

  const isAuthorized =
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase());

  if (status === "loading") {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  // 🚫 NOT AUTHENTICATED
  if (status === "unauthenticated") {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4 rtl">
            נדרשת התחברות
          </h2>
          <p className="text-gray-600 rtl">עליך להתחבר כדי ליצור הרצאות</p>
          <button
            onClick={() => (window.location.href = "/elitzur")}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            התחבר
          </button>
        </div>
      </div>
    );
  }

  // 🚫 NOT AUTHORIZED
  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4 rtl">אין הרשאה</h2>
          <p className="text-gray-600 rtl">אין לך הרשאה ליצור הרצאות באתר זה</p>
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

      setMessage({ type: "success", text: "ההרצאה נוצרה בהצלחה!" });

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
    } catch (error: any) {
      console.error("Error creating lecture:", error);
      setMessage({
        type: "error",
        text: error.message || "שגיאה ביצירת ההרצאה. נסה שוב.",
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

  // ✅ AUTHORIZED USER - SHOW FORM
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-2 text-center rtl">
        יצירת הרצאה חדשה
      </h2>

      {/* Show who's logged in */}
      <p className="text-sm text-green-600 text-center mb-6">
        מחובר כ: {session?.user?.email}
      </p>

      {message && (
        <div
          className={`mb-4 p-4 rounded-md ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-2 rtl">
            כותרת ההרצאה *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent rtl"
            placeholder="הכנס כותרת להרצאה"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium mb-2 rtl"
          >
            תיאור ההרצאה *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent rtl"
            placeholder="הכנס תיאור להרצאה"
          />
        </div>

        <div>
          <label
            htmlFor="videoUrl"
            className="block text-sm font-medium mb-2 rtl"
          >
            קישור לוידאו (YouTube וכו')
          </label>
          <input
            type="url"
            id="videoUrl"
            name="videoUrl"
            value={formData.videoUrl}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://www.youtube.com/embed/..."
          />
        </div>

        <div>
          <label
            htmlFor="duration"
            className="block text-sm font-medium mb-2 rtl"
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
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="למשל: 60 דקות"
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium mb-2 rtl">
            תאריך (אופציונלי)
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label
            htmlFor="categoryId"
            className="block text-sm font-medium mb-2 rtl"
          >
            קטגוריה *
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">בחר קטגוריה</option>
            <option value="cat1">פיזיקה קוונטית</option>
            <option value="cat2">פילוסופיה של המדע</option>
            <option value="cat3">אסטרונומיה</option>
            <option value="cat4">ירין טסטים למערכת</option>
            <option value="cat5">מדעי הטבע</option>
            <option value="cat6">פסיכולוגיה ומדעי ההתנהגות</option>
            <option value="cat7">נושאים ציבוריים</option>
          </select>
        </div>

        <UploadImage
          onImageSelect={setBannerImageFile}
          currentImage={formData.bannerImageUrl}
          label="תמונת ההרצאה"
          placeholder="PNG, JPG, GIF עד 5MB"
        />

        <details className="border border-gray-200 rounded p-3">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 rtl">
            הכנס קישור לתמונה (אופציונלי)
          </summary>
          <div className="mt-3">
            <label className="block text-sm font-medium mb-1 rtl">
              קישור תמונת ההרצאה
            </label>
            <input
              type="url"
              name="bannerImageUrl"
              value={formData.bannerImageUrl}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </details>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "יוצר הרצאה..." : "צור הרצאה"}
        </button>
      </form>
    </div>
  );
}
