"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { Sparkles, Circle } from "lucide-react";

export default function ReduceMotionToggle() {
  const { reduceMotion, setReduceMotion } = useSettings();
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        {t("settings.motion")}
      </label>
      <div className="relative flex p-1 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
        {/* Sliding indicator */}
        <div
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-gray-600 rounded-md shadow-sm transition-transform duration-200 ease-out ${
            reduceMotion ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
          }`}
        />

        {/* Animations On */}
        <button
          onClick={() => setReduceMotion(false)}
          className={`relative flex-1 py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-medium rounded-md transition-colors duration-200 cursor-pointer ${
            !reduceMotion
              ? "text-gray-900 dark:text-white"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          aria-pressed={!reduceMotion}
        >
          <Sparkles className="w-4 h-4" />
          {t("settings.motionOn") || "On"}
        </button>

        {/* Animations Off */}
        <button
          onClick={() => setReduceMotion(true)}
          className={`relative flex-1 py-2.5 px-4 flex items-center justify-center gap-2 text-sm font-medium rounded-md transition-colors duration-200 cursor-pointer ${
            reduceMotion
              ? "text-gray-900 dark:text-white"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
          aria-pressed={reduceMotion}
        >
          <Circle className="w-4 h-4" />
          {t("settings.motionOff") || "Reduced"}
        </button>
      </div>
      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
        {t("settings.motionDescription") || "Reduce animations for accessibility"}
      </p>
    </div>
  );
}
