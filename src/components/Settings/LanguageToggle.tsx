"use client";

import { useTranslation } from "@/contexts/Translation/translation.context";
import { Globe } from "lucide-react";

export default function LanguageToggle() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("settings.language")}
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setLocale("en")}
          className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-150 cursor-pointer ${
            locale === "en"
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
          }`}
        >
          English
        </button>
        <button
          onClick={() => setLocale("he")}
          className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-150 cursor-pointer ${
            locale === "he"
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
          }`}
        >
          עברית
        </button>
      </div>
    </div>
  );
}
