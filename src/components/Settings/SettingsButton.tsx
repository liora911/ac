"use client";

import { useState } from "react";
import { MdSettings } from "react-icons/md";
import { useTranslation } from "@/contexts/Translation/translation.context";
import SettingsPanel from "./SettingsPanel";

export default function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group cursor-pointer"
        aria-label={t("settings.openSettings")}
        title={t("settings.openSettings")}
      >
        <MdSettings
          size={22}
          className="text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:rotate-90 transition-all duration-300"
        />
      </button>

      <SettingsPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
