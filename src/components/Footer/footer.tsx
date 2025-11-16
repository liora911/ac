"use client";

import { useTranslation } from "@/contexts/Translation/translation.context";

export default function Footer() {
  const { t, locale } = useTranslation();
  const isHebrew = locale === "he";

  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-700 bg-slate-50 px-4 py-5 sm:py-6">
      <div className="max-w-5xl mx-auto text-center text-sm text-gray-600 dark:text-gray-400">
        <p dir={isHebrew ? "rtl" : "ltr"}>{t("footer.contact")}</p>
      </div>
    </footer>
  );
}
