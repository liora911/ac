"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { Sun, Moon, Palette } from "lucide-react";

export default function ThemeToggleSection() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Palette className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("settings.theme")}
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => theme === "dark" && toggleTheme()}
          className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
            theme === "light"
              ? "border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
              : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
          }`}
        >
          <Sun className="w-4 h-4" />
          {t("settings.lightMode")}
        </button>
        <button
          onClick={() => theme === "light" && toggleTheme()}
          className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
            theme === "dark"
              ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
              : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
          }`}
        >
          <Moon className="w-4 h-4" />
          {t("settings.darkMode")}
        </button>
      </div>
    </div>
  );
}
