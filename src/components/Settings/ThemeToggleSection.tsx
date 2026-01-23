"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { Sun, Moon } from "lucide-react";

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
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        {t("settings.theme")}
      </label>
      <div className="relative flex p-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
        {/* Sliding indicator */}
        <div
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-gray-600 rounded-md shadow-sm transition-transform duration-200 ease-out ${
            theme === "dark" ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
          }`}
        />

        {/* Light Mode */}
        <button
          onClick={handleLightClick}
          className={`relative flex-1 py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-medium rounded-md transition-colors duration-200 cursor-pointer ${
            theme === "light"
              ? "text-gray-900 dark:text-white"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          aria-pressed={theme === "light"}
        >
          <Sun className="w-4 h-4" />
          {t("settings.lightMode")}
        </button>

        {/* Dark Mode */}
        <button
          onClick={handleDarkClick}
          className={`relative flex-1 py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-medium rounded-md transition-colors duration-200 cursor-pointer ${
            theme === "dark"
              ? "text-gray-900 dark:text-white"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          aria-pressed={theme === "dark"}
        >
          <Moon className="w-4 h-4" />
          {t("settings.darkMode")}
        </button>
      </div>
    </div>
  );
}
