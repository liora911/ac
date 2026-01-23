"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { FontSize } from "@/types/SettingsContext/settings";
import { Type } from "lucide-react";

export default function FontSizeToggle() {
  const { fontSize, setFontSize } = useSettings();
  const { t } = useTranslation();

  const sizes: { key: FontSize; label: string; sample: string }[] = [
    { key: "small", label: t("settings.fontSmall") || "Small", sample: "Aa" },
    { key: "medium", label: t("settings.fontMedium") || "Medium", sample: "Aa" },
    { key: "large", label: t("settings.fontLarge") || "Large", sample: "Aa" },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Type className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("settings.fontSize")}
        </label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {sizes.map((size) => (
          <button
            key={size.key}
            onClick={() => setFontSize(size.key)}
            className={`py-3 px-2 rounded-xl border-2 transition-all duration-150 cursor-pointer flex flex-col items-center gap-1 ${
              fontSize === size.key
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
            }`}
          >
            <span
              className={`font-serif ${
                size.key === "small" ? "text-sm" : size.key === "medium" ? "text-lg" : "text-2xl"
              }`}
            >
              {size.sample}
            </span>
            <span className="text-xs">{size.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
