"use client";

import Link from "next/link";
import { BookOpen, ExternalLink } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";

/**
 * Opens the article's reading mode (the article alone) in a new tab.
 * Client-side so the label follows the site language, not the article's.
 * Styled as an obvious call to action, like the page's language cross-link.
 */
export default function ReadingModeButton({ href }: { href: string }) {
  const { t } = useTranslation();

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener"
      title={t("articleDetail.readingModeHint")}
      className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 text-sm sm:text-base font-medium text-start text-blue-700 dark:text-blue-300 shadow-sm transition-colors hover:bg-blue-100 hover:border-blue-300 dark:hover:bg-blue-900/50 dark:hover:border-blue-700"
    >
      <BookOpen className="w-5 h-5 shrink-0" />
      <span>{t("articleDetail.readingMode")}</span>
      {/* Signals that it opens in a new tab; mirrored for right-to-left */}
      <ExternalLink className="w-4 h-4 shrink-0 opacity-70 rtl:-scale-x-100 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}
