"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ALLOWED_EMAILS } from "@/constants/auth";
import TiptapEditor from "@/lib/editor/editor";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { CategoryNode, EditEventFormProps } from "@/types/EditEvent/edit";

export default function EditEventForm({
  eventId,
  onSuccess,
}: EditEventFormProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
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

    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}`);
        if (response.ok) {
          const event = await response.json();

          setFormData({
            title: event.title || "",
            description: event.description || "",
            eventType: event.eventType || "",
            location: event.location || "",
            onlineUrl: event.onlineUrl || "",
            eventDate: event.eventDate
              ? new Date(event.eventDate).toISOString().split("T")[0]
              : "",
            eventTime: event.eventTime || "",
            bannerImageUrl: event.bannerImageUrl || "",
            categoryId: event.categoryId || "",
          });
        } else {
          setMessage({
            type: "error",
            text: t("editEventForm.loadError"),
          });
        }
      } catch (error) {
        setMessage({
          type: "error",
          text: t("editEventForm.loadError"),
        });
      } finally {
        setIsFetching(false);
      }
    };

    if (eventId) {
      fetchCategories();
      fetchEvent();
    }
  }, [eventId, session?.user?.email]);

  if (status === "loading" || isFetching || categoriesLoading) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">
            {status === "loading"
              ? t("editEventForm.loadingGeneric")
              : t("editEventForm.loadingEventData")}
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
            {t("editEventForm.loginRequiredTitle")}
          </h2>
          <p className="text-gray-600 rtl">
            {t("editEventForm.loginRequiredMessage")}
          </p>
          <button
            onClick={() => (window.location.href = "/elitzur")}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 cursor-pointer"
          >
            {t("editEventForm.loginButton")}
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4 rtl">
            {t("editEventForm.notAuthorizedTitle")}
          </h2>
          <p className="text-gray-600 rtl">
            {t("editEventForm.notAuthorizedMessage")}
          </p>
          <p className="text-sm text-gray-500 mt-2">{session?.user?.email}</p>
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

      const response = await fetch(`/api/events/${eventId}`, {
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
        text: t("editEventForm.updateSuccess"),
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/elitzur");
      }
    } catch (error) {
      const messageText =
        error instanceof Error
          ? error.message
          : (t("editEventForm.updateError") as string);
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
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-4 text-center rtl">
        {t("editEventForm.title")}
      </h2>

      <p className="text-sm text-green-600 text-center mb-8">
        {t("editEventForm.loggedInAs")} {session?.user?.email}
      </p>

      {message && (
        <div
          className={`mb-6 p-4 rounded-md ${
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
          <label
            htmlFor="title"
            className="block text-lg font-semibold mb-3 text-gray-900 rtl"
          >
            {t("editEventForm.titleLabel")}
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full p-4 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 rtl"
            placeholder={t("editEventForm.titlePlaceholder")}
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-lg font-semibold mb-3 text-gray-900 rtl"
          >
            {t("editEventForm.descriptionLabel")}
          </label>
          <TiptapEditor
            value={formData.description}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, description: value }))
            }
            placeholder={t("editEventForm.descriptionPlaceholder")}
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
            className="block text-lg font-semibold mb-3 text-gray-900 rtl"
          >
            {t("editEventForm.eventTypeLabel")}
          </label>
          <select
            id="eventType"
            name="eventType"
            value={formData.eventType}
            onChange={handleChange}
            required
            className="w-full p-4 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent rtl"
          >
            <option value="">{t("editEventForm.eventTypePlaceholder")}</option>
            <option value="in-person">
              {t("editEventForm.eventTypeInPerson")}
            </option>
            <option value="online">{t("editEventForm.eventTypeOnline")}</option>
          </select>
        </div>

        {formData.eventType === "in-person" && (
          <div>
            <label
              htmlFor="location"
              className="block text-lg font-semibold mb-3 text-gray-900 rtl"
            >
              {t("editEventForm.locationLabel")}
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="w-full p-4 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 rtl"
              placeholder={t("editEventForm.locationPlaceholder")}
            />
          </div>
        )}

        {formData.eventType === "online" && (
          <div>
            <label
              htmlFor="onlineUrl"
              className="block text-lg font-semibold mb-3 text-gray-900 rtl"
            >
              {t("editEventForm.onlineUrlLabel")}
            </label>
            <input
              type="url"
              id="onlineUrl"
              name="onlineUrl"
              value={formData.onlineUrl}
              onChange={handleChange}
              required
              className="w-full p-4 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 rtl"
              placeholder="https://"
            />
          </div>
        )}

        <div>
          <label
            htmlFor="eventDate"
            className="block text-lg font-semibold mb-3 text-gray-900 rtl"
          >
            {t("editEventForm.eventDateLabel")}
          </label>
          <input
            type="date"
            id="eventDate"
            name="eventDate"
            value={formData.eventDate}
            onChange={handleChange}
            required
            className="w-full p-4 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent rtl"
          />
        </div>

        <div>
          <label
            htmlFor="eventTime"
            className="block text-lg font-semibold mb-3 text-gray-900 rtl"
          >
            {t("editEventForm.eventTimeLabel")}
          </label>
          <input
            type="time"
            id="eventTime"
            name="eventTime"
            value={formData.eventTime}
            onChange={handleChange}
            className="w-full p-4 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent rtl"
          />
        </div>

        <div>
          <label
            htmlFor="bannerImageUrl"
            className="block text-lg font-semibold mb-3 text-gray-900 rtl"
          >
            {t("editEventForm.bannerImageUrlLabel")}
          </label>
          <input
            type="url"
            id="bannerImageUrl"
            name="bannerImageUrl"
            value={formData.bannerImageUrl}
            onChange={handleChange}
            className="w-full p-4 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 rtl"
            placeholder="https://"
          />
        </div>

        <div>
          <label
            htmlFor="categoryId"
            className="block text-lg font-semibold mb-3 text-gray-900 rtl"
          >
            {t("editEventForm.categoryLabel")}
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={formData.categoryId}
            onChange={handleChange}
            required
            disabled={categoriesLoading}
            className="w-full p-4 bg-white text-gray-900 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 rtl"
          >
            <option value="">
              {categoriesLoading
                ? t("editEventForm.loadingCategories")
                : t("editEventForm.selectCategory")}
            </option>
            {renderCategoryOptions()}
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {isLoading
            ? t("editEventForm.submitUpdating")
            : t("editEventForm.submit")}
        </button>
      </form>
    </div>
  );
}
