"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ALLOWED_EMAILS } from "@/constants/auth";
import TiptapEditor from "@/lib/editor/editor";

type CategoryNode = {
  id: string;
  name: string;
  subcategories?: CategoryNode[];
};

interface CreateEventFormProps {
  onSuccess?: () => void;
}

export default function CreateEventForm({ onSuccess }: CreateEventFormProps) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "",
    location: "",
    onlineUrl: "",
    eventDate: "",
    eventTime: "",
    bannerImageUrl: "",
    categoryId: "",
  });

  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);

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
      <div className="max-w-xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
          <p className="mt-2 text-gray-300">
            {status === "loading" ? "טוען..." : "טוען קטגוריות..."}
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
          <p className="text-gray-300 rtl">עליך להתחבר כדי ליצור אירועים</p>
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
          <p className="text-gray-300 rtl">
            אין לך הרשאה ליצור אירועים באתר זה
          </p>
          <p className="text-sm text-gray-400 mt-2">{session?.user?.email}</p>
        </div>
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
      };

      const response = await fetch("/api/events", {
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

      setMessage({ type: "success", text: "האירוע נוצר בהצלחה!" });

      setFormData({
        title: "",
        description: "",
        eventType: "",
        location: "",
        onlineUrl: "",
        eventDate: "",
        eventTime: "",
        bannerImageUrl: "",
        categoryId: "",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const messageText =
        error instanceof Error
          ? error.message
          : "שגיאה ביצירת האירוע. נסה שוב.";
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

    categories.forEach((category: CategoryNode) => {
      options.push(
        <option key={category.id} value={category.id}>
          ▶ {category.name}
        </option>
      );

      if (category.subcategories && category.subcategories.length > 0) {
        category.subcategories.forEach((sub: CategoryNode) => {
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
      <h2 className="text-3xl font-bold mb-4 text-center rtl">
        יצירת אירוע חדש
      </h2>

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
            כותרת האירוע *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-4 bg-gray-800 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400 rtl"
            placeholder="הכנס כותרת לאירוע"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-lg font-semibold mb-3 text-white rtl"
          >
            תיאור האירוע *
          </label>
          <TiptapEditor
            value={formData.description}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, description: value }))
            }
            placeholder="הכנס תיאור לאירוע"
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
            htmlFor="eventType"
            className="block text-lg font-semibold mb-3 text-white rtl"
          >
            סוג האירוע *
          </label>
          <select
            id="eventType"
            name="eventType"
            value={formData.eventType}
            onChange={handleChange}
            required
            className="w-full p-4 bg-gray-800 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 rtl"
          >
            <option value="">בחר סוג אירוע</option>
            <option value="in-person">פרונטלי</option>
            <option value="online">אונליין</option>
          </select>
        </div>

        {formData.eventType === "in-person" && (
          <div>
            <label
              htmlFor="location"
              className="block text-lg font-semibold mb-3 text-white rtl"
            >
              מיקום *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full p-4 bg-gray-800 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400 rtl"
              placeholder="הכנס מיקום האירוע"
            />
          </div>
        )}

        {formData.eventType === "online" && (
          <div>
            <label
              htmlFor="onlineUrl"
              className="block text-lg font-semibold mb-3 text-white rtl"
            >
              קישור לאירוע *
            </label>
            <input
              type="url"
              id="onlineUrl"
              name="onlineUrl"
              value={formData.onlineUrl}
              onChange={handleChange}
              required
              className="w-full p-4 bg-gray-800 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400 rtl"
              placeholder="https://" //"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="eventDate"
            className="block text-lg font-semibold mb-3 text-white rtl"
          >
            תאריך האירוע *
          </label>
          <input
            type="date"
            id="eventDate"
            name="eventDate"
            value={formData.eventDate}
            onChange={handleChange}
            required
            className="w-full p-4 bg-gray-800 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 rtl"
          />
        </div>

        <div>
          <label
            htmlFor="eventTime"
            className="block text-lg font-semibold mb-3 text-white rtl"
          >
            שעת האירוע (אופציונלי)
          </label>
          <input
            type="time"
            id="eventTime"
            name="eventTime"
            value={formData.eventTime}
            onChange={handleChange}
            className="w-full p-4 bg-gray-800 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 rtl"
          />
        </div>

        <div>
          <label
            htmlFor="bannerImageUrl"
            className="block text-lg font-semibold mb-3 text-white rtl"
          >
            קישור לתמונת באנר (אופציונלי)
          </label>
          <input
            type="url"
            id="bannerImageUrl"
            name="bannerImageUrl"
            value={formData.bannerImageUrl}
            onChange={handleChange}
            className="w-full p-4 bg-gray-800 text-white border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 placeholder-gray-400 rtl"
            placeholder="https://" //"
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-4 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {isLoading ? "יוצר אירוע..." : "צור אירוע"}
        </button>
      </form>
    </div>
  );
}
