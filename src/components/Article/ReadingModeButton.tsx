"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";

/**
 * Opens the article's reading mode (the article alone) in a new tab.
 * Client-side so the label follows the site language, not the article's.
 */
export default function ReadingModeButton({ href }: { href: string }) {
  const { t } = useTranslation();

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener"
      title={t("articleDetail.readingModeHint")}
      className="inline-flex items-center gap-1.5 mb-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-700 dark:hover:border-blue-700 dark:hover:text-blue-300"
    >
      <BookOpen className="w-4 h-4 shrink-0" />
      {t("articleDetail.readingMode")}
    </Link>
  );
}
