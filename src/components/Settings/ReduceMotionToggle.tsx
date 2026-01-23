"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { Zap, ZapOff } from "lucide-react";

export default function ReduceMotionToggle() {
  const { reduceMotion, setReduceMotion } = useSettings();
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t("settings.motion")}
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setReduceMotion(false)}
          className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
            !reduceMotion
              ? "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
          }`}
        >
          <Zap className="w-4 h-4" />
          {t("settings.motionOn") || "On"}
        </button>
        <button
          onClick={() => setReduceMotion(true)}
          className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 ${
            reduceMotion
              ? "border-gray-500 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
              : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500"
          }`}
        >
          <ZapOff className="w-4 h-4" />
          {t("settings.motionOff") || "Reduced"}
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {t("settings.motionDescription") || "Reduce animations for accessibility"}
      </p>
    </div>
  );
}
