"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Crown, Lock, Sparkles } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface PremiumContentTeaserProps {
  content: string;
  previewLength?: number;
  className?: string;
  contentType?: "article" | "lecture" | "presentation";
}

export default function PremiumContentTeaser({
  content,
  previewLength = 200,
  className = "",
  contentType = "article",
}: PremiumContentTeaserProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useTranslation();

  const hasAccess =
    session?.user?.role === "ADMIN" || session?.user?.hasActiveSubscription;

  // If user has access, show full content
  if (hasAccess) {
    return (
      <div className={className} dangerouslySetInnerHTML={{ __html: content }} />
    );
  }

  // Extract preview text (strip HTML for clean preview)
  const stripHtml = (html: string) => {
    const tmp = typeof document !== "undefined"
      ? document.createElement("div")
      : null;
    if (tmp) {
      tmp.innerHTML = html;
      return tmp.textContent || tmp.innerText || "";
    }
    // Server-side fallback
    return html.replace(/<[^>]*>/g, "");
  };

  const plainText = stripHtml(content);
  const previewText = plainText.slice(0, previewLength);
  const hasMoreContent = plainText.length > previewLength;

  return (
    <div className={`relative ${className}`}>
      {/* Preview content */}
      <div className="relative">
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {previewText}
          {hasMoreContent && "..."}
        </p>

        {/* Blur overlay */}
        {hasMoreContent && (
          <div
            className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-gray-900 dark:via-gray-900/95"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Premium CTA overlay */}
      <div className="relative mt-4 p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30">
            <Lock className="w-7 h-7 text-white" />
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            {t("premiumTeaser.title")}
          </h3>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
            {t(`premiumTeaser.${contentType}Description`)}
          </p>

          {/* Benefits list */}
          <div className="flex flex-wrap justify-center gap-2 mb-5">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-500" />
              {t("premiumTeaser.benefit1")}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-500" />
              {t("premiumTeaser.benefit2")}
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm">
              <Sparkles className="w-3 h-3 text-amber-500" />
              {t("premiumTeaser.benefit3")}
            </span>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => router.push("/pricing")}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-lg shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30 transition-all duration-200 hover:scale-105 flex items-center gap-2"
          >
            <Crown className="w-5 h-5" />
            {t("premiumTeaser.subscribeButton")}
          </button>

          {/* Price hint */}
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
            {t("premiumTeaser.priceHint")}
          </p>
        </div>
      </div>
    </div>
  );
}
