"use client";

import { useTranslation } from "@/contexts/Translation/translation.context";

export default function LanguageToggle() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        {t("settings.language")}
      </label>
      <div className="relative flex p-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
        {/* Sliding indicator */}
        <div
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-gray-600 rounded-md shadow-sm transition-transform duration-200 ease-out ${
            locale === "he" ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
          }`}
        />

        {/* English */}
        <button
          onClick={() => setLocale("en")}
          className={`relative flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-colors duration-200 cursor-pointer ${
            locale === "en"
              ? "text-gray-900 dark:text-white"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          aria-pressed={locale === "en"}
        >
          English
        </button>

        {/* Hebrew */}
        <button
          onClick={() => setLocale("he")}
          className={`relative flex-1 py-2.5 px-4 text-sm font-medium rounded-md transition-colors duration-200 cursor-pointer ${
            locale === "he"
              ? "text-gray-900 dark:text-white"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          aria-pressed={locale === "he"}
        >
          עברית
        </button>
      </div>
    </div>
  );
}
