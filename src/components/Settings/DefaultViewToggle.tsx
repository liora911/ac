"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { MdGridView, MdViewList } from "react-icons/md";

export default function DefaultViewToggle() {
  const { defaultView, setDefaultView } = useSettings();
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        {t("settings.defaultView")}
      </label>
      <div className="flex rounded-2xl border-2 border-gray-300 dark:border-gray-600 overflow-hidden shadow-sm">
        {/* Grid View */}
        <button
          onClick={() => setDefaultView("grid")}
          className={`flex-1 py-4 px-6 flex items-center justify-center gap-2
            text-lg font-bold transition-all duration-300 cursor-pointer
            ${defaultView === "grid"
              ? "bg-gradient-to-r from-violet-500 via-purple-400 to-violet-500 text-white shadow-inner ring-2 ring-inset ring-violet-300/50"
              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          aria-pressed={defaultView === "grid"}
        >
          <MdGridView size={24} />
          <span className="text-sm">{t("settings.viewGrid") || "Grid"}</span>
        </button>

        {/* Divider */}
        <div className="w-0.5 bg-gray-300 dark:bg-gray-600" />

        {/* List View */}
        <button
          onClick={() => setDefaultView("list")}
          className={`flex-1 py-4 px-6 flex items-center justify-center gap-2
            text-lg font-bold transition-all duration-300 cursor-pointer
            ${defaultView === "list"
              ? "bg-gradient-to-r from-teal-500 via-cyan-400 to-teal-500 text-white shadow-inner ring-2 ring-inset ring-teal-300/50"
              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          aria-pressed={defaultView === "list"}
        >
          <MdViewList size={24} />
          <span className="text-sm">{t("settings.viewList") || "List"}</span>
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {t("settings.defaultViewDescription") || "Default layout for content listings"}
      </p>
    </div>
  );
}
