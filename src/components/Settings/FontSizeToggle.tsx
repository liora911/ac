"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { FontSize } from "@/types/SettingsContext/settings";

export default function FontSizeToggle() {
  const { fontSize, setFontSize } = useSettings();
  const { t } = useTranslation();

  const sizes: { key: FontSize; label: string; icon: string }[] = [
    { key: "small", label: t("settings.fontSmall") || "Small", icon: "A" },
    { key: "medium", label: t("settings.fontMedium") || "Medium", icon: "A" },
    { key: "large", label: t("settings.fontLarge") || "Large", icon: "A" },
  ];

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        {t("settings.fontSize")}
      </label>
      <div className="flex rounded-2xl border-2 border-gray-300 dark:border-gray-600 overflow-hidden shadow-sm">
        {sizes.map((size, index) => (
          <div key={size.key} className="flex flex-1">
            <button
              onClick={() => setFontSize(size.key)}
              className={`flex-1 py-4 px-3 flex items-center justify-center gap-1.5
                font-bold transition-all duration-300 cursor-pointer
                ${fontSize === size.key
                  ? "bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 text-white shadow-inner ring-2 ring-inset ring-blue-300/50"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              aria-pressed={fontSize === size.key}
            >
              <span
                className={`font-serif ${
                  size.key === "small" ? "text-sm" : size.key === "medium" ? "text-base" : "text-xl"
                }`}
              >
                {size.icon}
              </span>
              <span className="text-sm">{size.label}</span>
            </button>
            {index < sizes.length - 1 && (
              <div className="w-0.5 bg-gray-300 dark:bg-gray-600" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
