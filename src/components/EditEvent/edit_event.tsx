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
  const [activeTab, setActiveTab] = useState<1 | 2 | 3>(1);
  const [confirmedTabs, setConfirmedTabs] = useState<Set<1 | 2 | 3>>(new Set());
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
    maxSeats: "",
    isFeatured: false,
    isClosed: false,
    requiresRegistration: true, // True = tickets/registration, false = announcement only
    price: "", // Price in ILS (empty = free)
  });

  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(true);

  const isAuthorized = !!(
    session?.user?.email &&
    ALLOWED_EMAILS.includes(session.user.email.toLowerCase())
  );

  // Validation for Tab 1 (required fields)
  const isTab1Complete = formData.title.trim() !== "" && formData.eventType !== "" && formData.categoryId !== "" && formData.eventDate !== "";

  const confirmTab = (tab: 1 | 2 | 3) => {
    setConfirmedTabs((prev) => new Set([...prev, tab]));
    if (tab < 3) {
      setActiveTab((tab + 1) as 1 | 2 | 3);
    }
  };

  const canAccessTab = (tab: 1 | 2 | 3): boolean => {
    if (tab === 1) return true;
    return confirmedTabs.has((tab - 1) as 1 | 2 | 3) || confirmedTabs.has(tab);
  };

  const handleTabClick = (tab: 1 | 2 | 3) => {
    if (canAccessTab(tab)) {
      setActiveTab(tab);
    }
  };

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
            maxSeats: event.maxSeats ? String(event.maxSeats) : "",
            isFeatured: event.isFeatured || false,
            isClosed: event.isClosed || false,
            requiresRegistration: event.requiresRegistration !== false, // Default true
            price: event.price ? String(event.price / 100) : "", // Convert from agorot to ILS
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
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">
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
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 rtl">
          {t("editEventForm.loginRequiredTitle")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 rtl">
          {t("editEventForm.loginRequiredMessage")}
        </p>
        <button
          onClick={() => (window.location.href = "/elitzur")}
          className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 cursor-pointer"
        >
          {t("editEventForm.loginButton")}
        </button>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4 rtl">
          {t("editEventForm.notAuthorizedTitle")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 rtl">
          {t("editEventForm.notAuthorizedMessage")}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{session?.user?.email}</p>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Validate required fields before submission
    if (!isTab1Complete) {
      setMessage({
        type: "error",
        text: t("editEventForm.requiredFieldsError") as string || "Please fill in all required fields (Title, Event Type, Category, and Date)",
      });
      setActiveTab(1);
      setIsLoading(false);
      return;
    }

    try {
      const submissionData = {
        ...formData,
        price: formData.price ? Math.round(parseFloat(formData.price) * 100) : null, // Convert to agorot
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
        router.push("/events");
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
        <option key={category.id} value={category.id} className="bg-white dark:bg-gray-700">
          ▶ {category.name}
        </option>
      );

      const subcategories = categories.filter(
        (sub) => sub.parentId === category.id
      );

      subcategories.forEach((sub) => {
        options.push(
          <option key={sub.id} value={sub.id} className="bg-white dark:bg-gray-700">
            &nbsp;&nbsp;&nbsp;&nbsp;└─ {sub.name}
          </option>
        );
      });
    });

    return options;
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white rtl">
          {t("editEventForm.title")}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t("editEventForm.loggedInAs")} {session?.user?.email}
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-1" aria-label="Tabs">
          {([1, 2, 3] as const).map((tab) => {
            const isAccessible = canAccessTab(tab);
            const isConfirmed = confirmedTabs.has(tab);
            const tabLabels = {
              1: t("editEventForm.tabs.basicInfo") as string || "Basic Info",
              2: t("editEventForm.tabs.details") as string || "Details",
              3: t("editEventForm.tabs.settings") as string || "Settings",
            };
            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabClick(tab)}
                disabled={!isAccessible}
                className={`relative px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  !isAccessible
                    ? "border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    : activeTab === tab
                      ? "border-blue-600 text-blue-600 dark:text-blue-400 cursor-pointer"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer"
                }`}
              >
                <span className="flex items-center gap-2">
                  {isConfirmed && (
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {tabLabels[tab]}
                </span>
                {tab === 1 && !isTab1Complete && !isConfirmed && (
                  <span className="absolute top-2 -right-0 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tab 1: Basic Info */}
        {activeTab === 1 && (
          <>
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl"
              >
                {t("editEventForm.titleLabel")}
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rtl ${
                  formData.title.trim() === "" ? "border-gray-300 dark:border-gray-600" : "border-green-300 dark:border-green-600"
                }`}
                placeholder={t("editEventForm.titlePlaceholder")}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="eventType"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl"
                >
                  {t("editEventForm.eventTypeLabel")}
                </label>
                <select
                  id="eventType"
                  name="eventType"
                  value={formData.eventType}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rtl ${
                    formData.eventType === "" ? "border-gray-300 dark:border-gray-600" : "border-green-300 dark:border-green-600"
                  }`}
                >
                  <option value="" className="bg-white dark:bg-gray-700">{t("editEventForm.eventTypePlaceholder")}</option>
                  <option value="in-person" className="bg-white dark:bg-gray-700">
                    {t("editEventForm.eventTypeInPerson")}
                  </option>
                  <option value="online" className="bg-white dark:bg-gray-700">{t("editEventForm.eventTypeOnline")}</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="categoryId"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl"
                >
                  {t("editEventForm.categoryLabel")}
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  disabled={categoriesLoading}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rtl ${
                    formData.categoryId === "" ? "border-gray-300 dark:border-gray-600" : "border-green-300 dark:border-green-600"
                  }`}
                >
                  <option value="" className="bg-white dark:bg-gray-700">
                    {categoriesLoading
                      ? t("editEventForm.loadingCategories")
                      : t("editEventForm.selectCategory")}
                  </option>
                  {renderCategoryOptions()}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="eventDate"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl"
                >
                  {t("editEventForm.eventDateLabel")}
                </label>
                <input
                  type="date"
                  id="eventDate"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rtl ${
                    formData.eventDate === "" ? "border-gray-300 dark:border-gray-600" : "border-green-300 dark:border-green-600"
                  }`}
                />
              </div>

              <div>
                <label
                  htmlFor="eventTime"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl"
                >
                  {t("editEventForm.eventTimeLabel")}
                </label>
                <input
                  type="time"
                  id="eventTime"
                  name="eventTime"
                  value={formData.eventTime}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rtl"
                />
              </div>
            </div>

            {/* Confirm Tab 1 Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
              <button
                type="button"
                onClick={() => confirmTab(1)}
                disabled={!isTab1Complete}
                className="w-full sm:w-auto bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium flex items-center justify-center gap-2"
              >
                {t("articleForm.confirmAndContinue") || "אישור והמשך"}
                <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {!isTab1Complete && (
                <p className="text-sm text-red-600 mt-2 rtl">
                  {t("editEventForm.requiredFieldsHint") as string || "* יש למלא את כל השדות הנדרשים"}
                </p>
              )}
            </div>
          </>
        )}

        {/* Tab 2: Details */}
        {activeTab === 2 && (
          <>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl"
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
            </div>

            {formData.eventType === "in-person" && (
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl"
                >
                  {t("editEventForm.locationLabel")}
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rtl"
                  placeholder={t("editEventForm.locationPlaceholder")}
                />
              </div>
            )}

            {formData.eventType === "online" && (
              <div>
                <label
                  htmlFor="onlineUrl"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl"
                >
                  {t("editEventForm.onlineUrlLabel")}
                </label>
                <input
                  type="url"
                  id="onlineUrl"
                  name="onlineUrl"
                  value={formData.onlineUrl}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rtl"
                  placeholder="https://"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="maxSeats"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl"
              >
                {t("editEventForm.maxSeatsLabel")}
              </label>
              <input
                type="number"
                id="maxSeats"
                name="maxSeats"
                value={formData.maxSeats}
                onChange={handleChange}
                min={1}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rtl"
                placeholder={t("editEventForm.maxSeatsPlaceholder")}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 rtl">
                {t("editEventForm.maxSeatsHelp")}
              </p>
            </div>

            {/* Confirm Tab 2 Button */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
              <button
                type="button"
                onClick={() => confirmTab(2)}
                className="w-full sm:w-auto bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors cursor-pointer font-medium flex items-center justify-center gap-2"
              >
                {t("articleForm.confirmAndContinue") || "אישור והמשך"}
                <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </>
        )}

        {/* Tab 3: Settings */}
        {activeTab === 3 && (
          <>
            <div>
              <label
                htmlFor="bannerImageUrl"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl"
              >
                {t("editEventForm.bannerImageUrlLabel")}
              </label>
              <input
                type="url"
                id="bannerImageUrl"
                name="bannerImageUrl"
                value={formData.bannerImageUrl}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rtl"
                placeholder="https://"
              />
            </div>

            {/* Ticket Price */}
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl"
              >
                {t("editEventForm.priceLabel") || "Ticket Price (ILS)"}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">₪</span>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min={0}
                  step="0.01"
                  className="w-full p-3 pl-8 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 rtl">
                {t("editEventForm.priceHelp") || "Leave empty or 0 for free events"}
              </p>
            </div>

            {/* Requires Registration Toggle */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <input
                type="checkbox"
                id="requiresRegistration"
                name="requiresRegistration"
                checked={formData.requiresRegistration}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, requiresRegistration: e.target.checked }))
                }
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="requiresRegistration" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300 rtl">
                {t("editEventForm.requiresRegistrationLabel") || "דורש הרשמה/כרטיסים"}
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-1 block">
                  {t("editEventForm.requiresRegistrationHelp") || "(בטל סימון עבור הודעה/אירוע ללא הרשמה)"}
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFeatured"
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))
                }
                className="w-4 h-4 text-yellow-600 border-gray-300 dark:border-gray-600 rounded focus:ring-yellow-500 cursor-pointer"
              />
              <label htmlFor="isFeatured" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300 rtl">
                {t("editEventForm.isFeaturedLabel")}
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">
                  ({t("editEventForm.isFeaturedHelp")})
                </span>
              </label>
            </div>

            {/* Close Registration Toggle */}
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <input
                type="checkbox"
                id="isClosed"
                name="isClosed"
                checked={formData.isClosed}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isClosed: e.target.checked }))
                }
                className="w-4 h-4 text-red-600 border-gray-300 dark:border-gray-600 rounded focus:ring-red-500 cursor-pointer"
              />
              <label htmlFor="isClosed" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300 rtl">
                {t("editEventForm.isClosedLabel") || "סגור הרשמה לאירוע"}
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-1 block">
                  {t("editEventForm.isClosedHelp") || "(לא יהיה ניתן לרכוש כרטיסים)"}
                </span>
              </label>
            </div>
          </>
        )}

        {/* Submit Button - only visible on last tab */}
        {activeTab === 3 && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {!isTab1Complete && (
                  <span className="text-red-600 dark:text-red-400">
                    {t("editEventForm.requiredFieldsHint") as string || "* Required fields are missing in Basic Info tab"}
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium"
              >
                {isLoading
                  ? t("editEventForm.submitUpdating")
                  : t("editEventForm.submit")}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
