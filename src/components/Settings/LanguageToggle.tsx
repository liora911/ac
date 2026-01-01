"use client";

import { useTranslation } from "@/contexts/Translation/translation.context";

export default function LanguageToggle() {
  const { locale, setLocale, t } = useTranslation();

  // USA flag colors: Red #B22234, White #FFFFFF, Blue #3C3B6E
  const usaGradient = `linear-gradient(
    135deg,
    rgba(178, 34, 52, 0.35) 0%,
    rgba(255, 255, 255, 0.5) 25%,
    rgba(60, 59, 110, 0.4) 50%,
    rgba(255, 255, 255, 0.5) 75%,
    rgba(178, 34, 52, 0.35) 100%
  )`;

  // Israel flag colors: Blue #0038B8, White #FFFFFF
  const israelGradient = `linear-gradient(
    135deg,
    rgba(0, 56, 184, 0.35) 0%,
    rgba(255, 255, 255, 0.6) 50%,
    rgba(0, 56, 184, 0.35) 100%
  )`;

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        {t("settings.language")}
      </label>
      <div className="flex rounded-2xl border-2 border-gray-300 dark:border-gray-600 overflow-hidden shadow-sm">
        {/* English Button */}
        <button
          onClick={() => setLocale("en")}
          className={`flex-1 py-4 px-6 text-lg font-bold transition-all duration-300 cursor-pointer
            ${locale === "en"
              ? "text-gray-900 dark:text-white shadow-inner ring-2 ring-inset ring-blue-400/50"
              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          style={locale === "en" ? { background: usaGradient } : {}}
          aria-pressed={locale === "en"}
        >
          English
        </button>

        {/* Divider */}
        <div className="w-0.5 bg-gray-300 dark:bg-gray-600" />

        {/* Hebrew Button */}
        <button
          onClick={() => setLocale("he")}
          className={`flex-1 py-4 px-6 text-lg font-bold transition-all duration-300 cursor-pointer
            ${locale === "he"
              ? "text-gray-900 dark:text-white shadow-inner ring-2 ring-inset ring-blue-400/50"
              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          style={locale === "he" ? { background: israelGradient } : {}}
          aria-pressed={locale === "he"}
        >
          עברית
        </button>
      </div>
    </div>
  );
}
