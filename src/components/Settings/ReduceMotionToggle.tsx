"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { MdAnimation, MdMotionPhotosOff } from "react-icons/md";

export default function ReduceMotionToggle() {
  const { reduceMotion, setReduceMotion } = useSettings();
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        {t("settings.motion")}
      </label>
      <div className="flex rounded-2xl border-2 border-gray-300 dark:border-gray-600 overflow-hidden shadow-sm">
        {/* Animations On */}
        <button
          onClick={() => setReduceMotion(false)}
          className={`flex-1 py-4 px-6 flex items-center justify-center gap-2
            text-lg font-bold transition-all duration-300 cursor-pointer
            ${!reduceMotion
              ? "bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 text-white shadow-inner ring-2 ring-inset ring-green-300/50"
              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          aria-pressed={!reduceMotion}
        >
          <MdAnimation size={24} />
          <span className="text-sm">{t("settings.motionOn") || "On"}</span>
        </button>

        {/* Divider */}
        <div className="w-0.5 bg-gray-300 dark:bg-gray-600" />

        {/* Animations Off (Reduced) */}
        <button
          onClick={() => setReduceMotion(true)}
          className={`flex-1 py-4 px-6 flex items-center justify-center gap-2
            text-lg font-bold transition-all duration-300 cursor-pointer
            ${reduceMotion
              ? "bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600 text-white shadow-inner ring-2 ring-inset ring-gray-400/50"
              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }`}
          aria-pressed={reduceMotion}
        >
          <MdMotionPhotosOff size={24} />
          <span className="text-sm">{t("settings.motionOff") || "Reduced"}</span>
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {t("settings.motionDescription") || "Reduce animations for accessibility"}
      </p>
    </div>
  );
}
