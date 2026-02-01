"use client";

import React from "react";
import { useTabNavigation } from "@/hooks/useTabNavigation";
import { useTranslation } from "@/contexts/Translation/translation.context";
import TiptapEditor from "@/lib/editor/editor";
import type { CategoryNode } from "@/types/Category/category";

export interface EventFormData {
  title: string;
  description: string;
  eventType: string;
  location: string;
  onlineUrl: string;
  eventDate: string;
  eventTime: string;
  bannerImageUrl: string;
  categoryId: string;
  maxSeats: string;
  isFeatured: boolean;
  isClosed: boolean;
  requiresRegistration: boolean;
  price: string;
}

export const initialEventFormData: EventFormData = {
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
  requiresRegistration: true,
  price: "",
};

interface EventFormProps {
  formData: EventFormData;
  onChange: (data: EventFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  categories: CategoryNode[];
  categoriesLoading: boolean;
  isSubmitting: boolean;
  /** Translation key prefix: "createEvent" or "editEventForm" */
  translationPrefix: "createEvent" | "editEventForm";
  submitLabel: string;
  submitLoadingLabel: string;
  message?: { type: "success" | "error"; text: string } | null;
}

export default function EventForm({
  formData,
  onChange,
  onSubmit,
  categories,
  categoriesLoading,
  isSubmitting,
  translationPrefix,
  submitLabel,
  submitLoadingLabel,
  message,
}: EventFormProps) {
  const { t } = useTranslation();
  const {
    activeTab,
    confirmedTabs,
    confirmTab,
    canAccessTab,
    handleTabClick,
  } = useTabNavigation();

  // Validation for Tab 1 (required fields)
  const isTab1Complete =
    formData.title.trim() !== "" &&
    formData.eventType !== "" &&
    formData.categoryId !== "" &&
    formData.eventDate !== "";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (name: keyof EventFormData, checked: boolean) => {
    onChange({ ...formData, [name]: checked });
  };

  const handleDescriptionChange = (value: string) => {
    onChange({ ...formData, description: value });
  };

  const renderCategoryOptions = () => {
    const options: React.ReactElement[] = [];
    const topLevelCategories = categories.filter((cat) => !cat.parentId);

    topLevelCategories.forEach((category) => {
      options.push(
        <option key={category.id} value={category.id} className="bg-white dark:bg-gray-700">
          ▶ {category.name}
        </option>
      );

      const subcategories = categories.filter((sub) => sub.parentId === category.id);
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

  const tabLabels = {
    1: t(`${translationPrefix}.tabs.basicInfo`) || "Basic Info",
    2: t(`${translationPrefix}.tabs.details`) || "Details",
    3: t(`${translationPrefix}.tabs.settings`) || "Settings",
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
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

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Tab 1: Basic Info */}
        {activeTab === 1 && (
          <>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl">
                {t(`${translationPrefix}.titleLabel`)}
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
                placeholder={t(`${translationPrefix}.titlePlaceholder`)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl">
                  {t(`${translationPrefix}.eventTypeLabel`)}
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
                  <option value="" className="bg-white dark:bg-gray-700">{t(`${translationPrefix}.eventTypePlaceholder`)}</option>
                  <option value="in-person" className="bg-white dark:bg-gray-700">{t(`${translationPrefix}.eventTypeInPerson`)}</option>
                  <option value="online" className="bg-white dark:bg-gray-700">{t(`${translationPrefix}.eventTypeOnline`)}</option>
                </select>
              </div>

              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl">
                  {t(`${translationPrefix}.categoryLabel`)}
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
                    {categoriesLoading ? t(`${translationPrefix}.loadingCategories`) : t(`${translationPrefix}.selectCategory`)}
                  </option>
                  {renderCategoryOptions()}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl">
                  {t(`${translationPrefix}.eventDateLabel`)}
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
                <label htmlFor="eventTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl">
                  {t(`${translationPrefix}.eventTimeLabel`)}
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
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                  {t(`${translationPrefix}.requiredFieldsHint`) || "* יש למלא את כל השדות הנדרשים"}
                </p>
              )}
            </div>
          </>
        )}

        {/* Tab 2: Details */}
        {activeTab === 2 && (
          <>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl">
                {t(`${translationPrefix}.descriptionLabel`)}
              </label>
              <TiptapEditor
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder={t(`${translationPrefix}.descriptionPlaceholder`)}
              />
            </div>

            {formData.eventType === "in-person" && (
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl">
                  {t(`${translationPrefix}.locationLabel`)}
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rtl"
                  placeholder={t(`${translationPrefix}.locationPlaceholder`)}
                />
              </div>
            )}

            {formData.eventType === "online" && (
              <div>
                <label htmlFor="onlineUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl">
                  {t(`${translationPrefix}.onlineUrlLabel`)}
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
              <label htmlFor="maxSeats" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl">
                {t(`${translationPrefix}.maxSeatsLabel`)}
              </label>
              <input
                type="number"
                id="maxSeats"
                name="maxSeats"
                value={formData.maxSeats}
                onChange={handleChange}
                min={1}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rtl"
                placeholder={t(`${translationPrefix}.maxSeatsPlaceholder`)}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 rtl">
                {t(`${translationPrefix}.maxSeatsHelp`)}
              </p>
            </div>

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
              <label htmlFor="bannerImageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl">
                {t(`${translationPrefix}.bannerImageUrlLabel`)}
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

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rtl">
                {t(`${translationPrefix}.priceLabel`) || "Ticket Price (ILS)"}
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
                {t(`${translationPrefix}.priceHelp`) || "Leave empty or 0 for free events"}
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <input
                type="checkbox"
                id="requiresRegistration"
                checked={formData.requiresRegistration}
                onChange={(e) => handleCheckboxChange("requiresRegistration", e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="requiresRegistration" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300 rtl">
                {t(`${translationPrefix}.requiresRegistrationLabel`) || "דורש הרשמה/כרטיסים"}
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-1 block">
                  {t(`${translationPrefix}.requiresRegistrationHelp`) || "(בטל סימון עבור הודעה/אירוע ללא הרשמה)"}
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={formData.isFeatured}
                onChange={(e) => handleCheckboxChange("isFeatured", e.target.checked)}
                className="w-4 h-4 text-yellow-600 border-gray-300 dark:border-gray-600 rounded focus:ring-yellow-500 cursor-pointer"
              />
              <label htmlFor="isFeatured" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300 rtl">
                {t(`${translationPrefix}.isFeaturedLabel`)}
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">
                  ({t(`${translationPrefix}.isFeaturedHelp`)})
                </span>
              </label>
            </div>

            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <input
                type="checkbox"
                id="isClosed"
                checked={formData.isClosed}
                onChange={(e) => handleCheckboxChange("isClosed", e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 dark:border-gray-600 rounded focus:ring-red-500 cursor-pointer"
              />
              <label htmlFor="isClosed" className="cursor-pointer text-sm text-gray-700 dark:text-gray-300 rtl">
                {t(`${translationPrefix}.isClosedLabel`) || "סגור הרשמה לאירוע"}
                <span className="text-xs text-gray-500 dark:text-gray-400 mr-1 block">
                  {t(`${translationPrefix}.isClosedHelp`) || "(לא יהיה ניתן לרכוש כרטיסים)"}
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {!isTab1Complete && (
                    <span className="text-red-600 dark:text-red-400">
                      {t(`${translationPrefix}.requiredFieldsHint`) || "* Required fields are missing in Basic Info tab"}
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white py-3 px-8 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer font-medium"
                >
                  {isSubmitting ? submitLoadingLabel : submitLabel}
                </button>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
