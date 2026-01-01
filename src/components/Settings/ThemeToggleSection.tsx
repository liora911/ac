"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { MdLightMode, MdDarkMode } from "react-icons/md";

export default function ThemeToggleSection() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const handleLightClick = () => {
    if (theme === "dark") toggleTheme();
  };

  const handleDarkClick = () => {
    if (theme === "light") toggleTheme();
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        {t("settings.theme")}
      </label>
      <div className="flex rounded-2xl border-2 border-gray-300 dark:border-gray-600 overflow-hidden shadow-sm">
        {/* Light Mode Button */}
        <button
          onClick={handleLightClick}
          className={`flex-1 py-4 px-6 flex items-center justify-center gap-2
            text-lg font-bold transition-all duration-300 cursor-pointer
            ${theme === "light"
              ? "bg-gradient-to-r from-amber-200 via-yellow-100 to-orange-200 text-amber-800 shadow-inner ring-2 ring-inset ring-amber-400/50"
              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          aria-pressed={theme === "light"}
        >
          <MdLightMode size={24} />
          {t("settings.lightMode")}
        </button>

        {/* Divider */}
        <div className="w-0.5 bg-gray-300 dark:bg-gray-600" />

        {/* Dark Mode Button */}
        <button
          onClick={handleDarkClick}
          className={`flex-1 py-4 px-6 flex items-center justify-center gap-2
            text-lg font-bold transition-all duration-300 cursor-pointer
            ${theme === "dark"
              ? "bg-gradient-to-r from-indigo-700 via-purple-800 to-indigo-700 text-purple-200 shadow-inner ring-2 ring-inset ring-purple-400/50"
              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          aria-pressed={theme === "dark"}
        >
          <MdDarkMode size={24} />
          {t("settings.darkMode")}
        </button>
      </div>
    </div>
  );
}
