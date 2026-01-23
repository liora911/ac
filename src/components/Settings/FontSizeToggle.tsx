"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { FontSize } from "@/types/SettingsContext/settings";

export default function FontSizeToggle() {
  const { fontSize, setFontSize } = useSettings();
  const { t } = useTranslation();

  const sizes: { key: FontSize; label: string }[] = [
    { key: "small", label: t("settings.fontSmall") || "S" },
    { key: "medium", label: t("settings.fontMedium") || "M" },
    { key: "large", label: t("settings.fontLarge") || "L" },
  ];

  const activeIndex = sizes.findIndex((s) => s.key === fontSize);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        {t("settings.fontSize")}
      </label>
      <div className="relative flex p-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
        {/* Sliding indicator */}
        <div
          className="absolute top-1 bottom-1 w-[calc(33.333%-2.67px)] bg-white dark:bg-gray-600 rounded-md shadow-sm transition-transform duration-200 ease-out"
          style={{
            transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 4}px))`,
          }}
        />

        {sizes.map((size) => (
          <button
            key={size.key}
            onClick={() => setFontSize(size.key)}
            className={`relative flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 text-sm font-medium rounded-md transition-colors duration-200 cursor-pointer ${
              fontSize === size.key
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            aria-pressed={fontSize === size.key}
          >
            <span
              className={`font-serif ${
                size.key === "small" ? "text-xs" : size.key === "medium" ? "text-sm" : "text-base"
              }`}
            >
              A
            </span>
            <span className="text-xs">{size.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
