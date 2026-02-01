"use client";

import React from "react";
import { useTabNavigation } from "@/hooks/useTabNavigation";
import { useTranslation } from "@/contexts/Translation/translation.context";
import TiptapEditor from "@/lib/editor/editor";
import UploadImage from "@/components/Upload/upload";
import type { CategoryNode } from "@/types/Category/category";

export interface LectureFormData {
  title: string;
  description: string;
  videoUrl: string;
  duration: string;
  date: string;
  bannerImageUrl: string;
  categoryId: string;
  isPremium: boolean;
}

export const initialLectureFormData: LectureFormData = {
  title: "",
  description: "",
  videoUrl: "",
  duration: "",
  date: "",
  bannerImageUrl: "",
  categoryId: "",
  isPremium: false,
};

interface LectureFormProps {
  formData: LectureFormData;
  onChange: (data: LectureFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  categories: CategoryNode[];
  categoriesLoading: boolean;
  isSubmitting: boolean;
  translationPrefix: "createLecture" | "editLectureForm";
  submitLabel: string;
  submitLoadingLabel: string;
  message?: { type: "success" | "error"; text: string } | null;
  onError?: (msg: string) => void;
}

export default function LectureForm({
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
  onError,
}: LectureFormProps) {
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
    formData.categoryId !== "" &&
    formData.duration.trim() !== "";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    onChange({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (name: keyof LectureFormData, checked: boolean) => {
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
    2: t(`${translationPrefix}.tabs.content`) || "Content",
    3: t(`${translationPrefix}.tabs.media`) || "Media",
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
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t(`${translationPrefix}.titleLabel`)}
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  formData.title.trim() === "" ? "border-gray-300 dark:border-gray-600" : "border-green-300 dark:border-green-600"
                }`}
                placeholder={t(`${translationPrefix}.titlePlaceholder`)}
              />
            </div>

            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t(`${translationPrefix}.categoryLabel`)}
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                disabled={categoriesLoading}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  formData.categoryId === "" ? "border-gray-300 dark:border-gray-600" : "border-green-300 dark:border-green-600"
                }`}
              >
                <option value="" className="bg-white dark:bg-gray-700">
                  {categoriesLoading ? t(`${translationPrefix}.loadingCategories`) : t(`${translationPrefix}.selectCategory`)}
                </option>
                {renderCategoryOptions()}
              </select>
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t(`${translationPrefix}.durationLabel`)}
              </label>
              <input
                type="text"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  formData.duration.trim() === "" ? "border-gray-300 dark:border-gray-600" : "border-green-300 dark:border-green-600"
                }`}
                placeholder={t(`${translationPrefix}.durationPlaceholder`)}
              />
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

        {/* Tab 2: Content */}
        {activeTab === 2 && (
          <>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t(`${translationPrefix}.descriptionLabel`)}
              </label>
              <TiptapEditor
                value={formData.description}
                onChange={handleDescriptionChange}
                placeholder={t(`${translationPrefix}.descriptionPlaceholder`)}
              />
            </div>

            <div>
              <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t(`${translationPrefix}.videoUrlLabel`)}
              </label>
              <input
                type="url"
                id="videoUrl"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="https://"
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t(`${translationPrefix}.dateLabel`)}
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
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

        {/* Tab 3: Media */}
        {activeTab === 3 && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t(`${translationPrefix}.imageSummary`)}
              </label>
              <UploadImage
                onImageSelect={(url) => onChange({ ...formData, bannerImageUrl: url || "" })}
                currentImage={formData.bannerImageUrl || null}
                placeholder={t(`${translationPrefix}.imagePlaceholder`)}
                onError={onError}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t(`${translationPrefix}.imageUrlLabel`)}
              </label>
              <input
                type="url"
                name="bannerImageUrl"
                value={formData.bannerImageUrl}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="https://"
              />
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPremium}
                  onChange={(e) => handleCheckboxChange("isPremium", e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t(`${translationPrefix}.isPremiumLabel`) || "Premium Content"}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t(`${translationPrefix}.isPremiumHint`) || "Only accessible to subscribers with Researcher plan"}
                  </p>
                </div>
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
