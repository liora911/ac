"use client";

import { useTranslation } from "@/contexts/Translation/translation.context";

function BlackHoleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <circle cx="12" cy="12" r="4" fill="currentColor" />
    </svg>
  );
}

export default function Footer() {
  const { t, locale } = useTranslation();
  const isHebrew = locale === "he";

  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-700 bg-slate-50 px-4 py-5 sm:py-6">
      <div className="max-w-5xl mx-auto text-center text-sm text-gray-600 dark:text-gray-400">
        <p dir={isHebrew ? "rtl" : "ltr"}>{t("footer.contact")}</p>
        <div
          className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-gray-400"
          dir={isHebrew ? "rtl" : "ltr"}
        >
          <BlackHoleIcon className="w-3 h-3" />
          <span>
            {isHebrew ? "פותח באהבה על ידי: Y.M" : "Developed By: Y.M"}
          </span>
        </div>
      </div>
    </footer>
  );
}
