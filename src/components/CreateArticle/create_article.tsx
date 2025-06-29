"use client";

import { useState, FormEvent } from "react";

interface CreateArticleFormProps {
  onSuccess?: () => void;
}

export default function CreateArticleForm({
  onSuccess,
}: CreateArticleFormProps) {
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Success!
      setMessage({ type: "success", text: "המאמר נוצר בהצלחה!" });

      // Reset form
      setFormData({
        title: "",
        content: "",
        articleImage: "",
        publisherName: "",
        publisherImage: "",
        readDuration: 5,
      });

      // Call success callback if provided
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

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center rtl">
        יצירת מאמר חדש
      </h2>

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

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label
            htmlFor="content"
            className="block text-sm font-medium mb-2 rtl"
          >
            תוכן המאמר *
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            rows={8}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent rtl"
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

        <div>
          <label
            htmlFor="articleImage"
            className="block text-sm font-medium mb-2 rtl"
          >
            תמונת המאמר (URL)
          </label>
          <input
            type="url"
            id="articleImage"
            name="articleImage"
            value={formData.articleImage}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div>
          <label
            htmlFor="publisherImage"
            className="block text-sm font-medium mb-2 rtl"
          >
            תמונת המחבר (URL)
          </label>
          <input
            type="url"
            id="publisherImage"
            name="publisherImage"
            value={formData.publisherImage}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com/author.jpg"
          />
        </div>

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
