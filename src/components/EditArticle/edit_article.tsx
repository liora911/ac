"use client";

import { useState, FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import UploadImage from "@/components/Upload/upload";
import { ALLOWED_EMAILS } from "@/constants/auth";
import TiptapEditor from "@/lib/editor/editor";

interface EditArticleFormProps {
  articleId: string;
  onSuccess?: () => void;
}

export default function EditArticleForm({
  articleId,
  onSuccess,
}: EditArticleFormProps) {
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
    content: "",
    articleImage: "",
    publisherName: "",
    publisherImage: "",
    readDuration: 5,
    categoryId: "",
    direction: "ltr" as "ltr" | "rtl",
  });

  const [articleImageFile, setArticleImageFile] = useState<File | null>(null);
  const [publisherImageFile, setPublisherImageFile] = useState<File | null>(
    null
  );
  const [categories, setCategories] = useState<any[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

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

    const fetchArticle = async () => {
      try {
        const response = await fetch(`/api/articles/${articleId}`);
        if (response.ok) {
          const article = await response.json();

          setFormData({
            title: article.title || "",
            content: article.content || "",
            articleImage: article.articleImage || "",
            publisherName: article.publisherName || "",
            publisherImage: article.publisherImage || "",
            readDuration: article.readDuration || 5,
            categoryId: article.category?.id || "",
            direction: article.direction || "ltr",
          });
        } else {
          setMessage({ type: "error", text: "שגיאה בטעינת המאמר" });
        }
      } catch (error) {
        console.error("Error fetching article:", error);
        setMessage({ type: "error", text: "שגיאה בטעינת המאמר" });
      } finally {
        setIsFetching(false);
      }
    };

    if (articleId) {
      fetchCategories();
      fetchArticle();
    }
  }, [articleId, session?.user?.email]);

  if (status === "loading" || isFetching || categoriesLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">
            {status === "loading" ? "טוען..." : "טוען נתוני מאמר..."}
          </p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4 rtl">
            נדרשת התחברות
          </h2>
          <p className="text-gray-600 rtl">עליך להתחבר כדי לערוך מאמרים</p>
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

  if (!isAuthorized) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4 rtl">אין הרשאה</h2>
          <p className="text-gray-600 rtl">אין לך הרשאה לערוך מאמרים באתר זה</p>
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

    if (!formData.title.trim()) {
      setMessage({ type: "error", text: "כותרת המאמר נדרשת" });
      return;
    }
    if (
      !formData.content ||
      formData.content.trim() === "" ||
      formData.content.replace(/<[^>]*>/g, "").trim() === ""
    ) {
      setMessage({ type: "error", text: "תוכן המאמר נדרש" });
      return;
    }
    if (!formData.publisherName.trim()) {
      setMessage({ type: "error", text: "שם המחבר נדרש" });
      return;
    }

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
        direction: formData.direction,
      };

      const response = await fetch(`/api/articles/${articleId}`, {
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

      setMessage({ type: "success", text: "המאמר עודכן בהצלחה!" });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/articles-demo");
      }
    } catch (error: any) {
      console.error("Error updating article:", error);
      setMessage({
        type: "error",
        text: error.message || "שגיאה בעדכון המאמר. נסה שוב.",
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
      [name]: name === "readDuration" ? parseInt(value) || 5 : value,
    }));
  };

  const handleContentChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      content,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-2 text-center rtl">עריכת מאמר</h2>

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

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
            direction={formData.direction}
            onDirectionChange={(direction) =>
              setFormData((prev) => ({ ...prev, direction }))
            }
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
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent rtl"
            placeholder="הכנס שם המחבר"
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
            disabled={categoriesLoading}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 rtl"
          >
            <option value="">
              {categoriesLoading ? "טוען קטגוריות..." : "בחר קטגוריה"}
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <UploadImage
            onImageSelect={setArticleImageFile}
            currentImage={formData.articleImage}
            label="תמונת המאמר"
            placeholder="PNG, JPG, GIF עד 5MB"
          />
          {formData.articleImage && (
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, articleImage: "" }));
                setArticleImageFile(null);
              }}
              className="mt-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
            >
              הסר תמונה
            </button>
          )}
        </div>

        <div>
          <UploadImage
            onImageSelect={setPublisherImageFile}
            currentImage={formData.publisherImage}
            label="תמונת המחבר"
            placeholder="PNG, JPG, GIF עד 5MB"
          />
          {formData.publisherImage && (
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({ ...prev, publisherImage: "" }));
                setPublisherImageFile(null);
              }}
              className="mt-2 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm"
            >
              הסר תמונה
            </button>
          )}
        </div>

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
                placeholder="https://" //"
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
                placeholder="https://" //"
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
          {isLoading ? "מעדכן מאמר..." : "עדכן מאמר"}
        </button>
      </form>
    </div>
  );
}
