"use client";

import { useState, FormEvent } from "react";
import { useSession } from "next-auth/react";
import UploadImage from "@/components/Upload/upload";
import { ALLOWED_EMAILS } from "@/constants/auth";
import TiptapEditor from "@/lib/editor/editor";

interface CreateArticleFormProps {
  onSuccess?: () => void;
}

export default function CreateArticleForm({
  onSuccess,
}: CreateArticleFormProps) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    articleImage: "",
    publisherName: "",
    publisherImage: "",
    readDuration: 5,
  });

  const [articleImageFile, setArticleImageFile] = useState<File | null>(null);
  const [publisherImageFile, setPublisherImageFile] = useState<File | null>(
    null
  );

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
          <p className="text-gray-600 rtl">עליך להתחבר כדי ליצור מאמרים</p>
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
          <p className="text-gray-600 rtl">אין לך הרשאה ליצור מאמרים באתר זה</p>
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
      let articleImageData = formData.articleImage;
      let publisherImageData = formData.publisherImage;

      if (articleImageFile) {
        articleImageData = await fileToDataURL(articleImageFile);
      }

      if (publisherImageFile) {
        publisherImageData = await fileToDataURL(publisherImageFile);
      }

      const submissionData = {
        ...formData,
        articleImage: articleImageData,
        publisherImage: publisherImageData,
      };

      const response = await fetch("/api/articles", {
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

      setMessage({ type: "success", text: "המאמר נוצר בהצלחה!" });

      setFormData({
        title: "",
        content: "",
        articleImage: "",
        publisherName: "",
        publisherImage: "",
        readDuration: 5,
      });
      setArticleImageFile(null);
      setPublisherImageFile(null);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error creating article:", error);
      setMessage({
        type: "error",
        text: error.message || "שגיאה ביצירת המאמר. נסה שוב.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "readDuration" ? parseInt(value) || 5 : value,
    }));
  };

  const handleContentChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      content,
    }));
  };

  // ✅ AUTHORIZED USER - SHOW FORM
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-2 text-center rtl">
        יצירת מאמר חדש
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
            כותרת המאמר *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent rtl"
            placeholder="הכנס כותרת למאמר"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 rtl">
            תוכן המאמר *
          </label>
          <TiptapEditor
            value={formData.content}
            onChange={handleContentChange}
            placeholder="כתוב את תוכן המאמר כאן..."
          />
        </div>

        <div>
          <label
            htmlFor="publisherName"
            className="block text-sm font-medium mb-2 rtl"
          >
            שם המחבר *
          </label>
          <input
            type="text"
            id="publisherName"
            name="publisherName"
            value={formData.publisherName}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent rtl"
            placeholder="הכנס שם המחבר"
          />
        </div>

        <UploadImage
          onImageSelect={setArticleImageFile}
          currentImage={formData.articleImage}
          label="תמונת המאמר"
          placeholder="PNG, JPG, GIF עד 5MB"
        />

        <UploadImage
          onImageSelect={setPublisherImageFile}
          currentImage={formData.publisherImage}
          label="תמונת המחבר"
          placeholder="PNG, JPG, GIF עד 5MB"
        />

        <details className="border border-gray-200 rounded p-3">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 rtl">
            או הכנס קישורי תמונות (אופציונלי)
          </summary>
          <div className="mt-3 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1 rtl">
                קישור תמונת המאמר
              </label>
              <input
                type="url"
                name="articleImage"
                value={formData.articleImage}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 rtl">
                קישור תמונת המחבר
              </label>
              <input
                type="url"
                name="publisherImage"
                value={formData.publisherImage}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                placeholder="https://example.com/author.jpg"
              />
            </div>
          </div>
        </details>

        <div>
          <label
            htmlFor="readDuration"
            className="block text-sm font-medium mb-2 rtl"
          >
            זמן קריאה (דקות)
          </label>
          <input
            type="number"
            id="readDuration"
            name="readDuration"
            value={formData.readDuration}
            onChange={handleChange}
            min="1"
            max="60"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "יוצר מאמר..." : "צור מאמר"}
        </button>
      </form>
    </div>
  );
}
