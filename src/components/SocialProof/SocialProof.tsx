"use client";

import React from "react";
import { Users, Star, TrendingUp } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface SocialProofProps {
  subscriberCount?: number;
  variant?: "inline" | "badge" | "banner";
  className?: string;
}

export default function SocialProof({
  subscriberCount = 50,
  variant = "inline",
  className = "",
}: SocialProofProps) {
  const { t } = useTranslation();

  // Display a rounded number for social proof
  const displayCount = subscriberCount < 10
    ? subscriberCount
    : subscriberCount < 100
      ? Math.floor(subscriberCount / 10) * 10 + "+"
      : Math.floor(subscriberCount / 50) * 50 + "+";

  if (variant === "badge") {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-full text-sm ${className}`}
      >
        <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
        <span className="text-green-700 dark:text-green-300 font-medium">
          {t("socialProof.subscribersCount").replace("{count}", String(displayCount))}
        </span>
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div
        className={`flex items-center justify-center gap-4 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg ${className}`}
      >
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-white dark:border-gray-900 flex items-center justify-center"
              >
                <Star className="w-4 h-4 text-white fill-white" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-green-800 dark:text-green-200 font-semibold">
            {t("socialProof.subscribersCount").replace("{count}", String(displayCount))}
          </span>
          <span className="text-xs text-green-600 dark:text-green-400">
            {t("socialProof.trustedBy")}
          </span>
        </div>
        <TrendingUp className="w-5 h-5 text-green-500 animate-pulse" />
      </div>
    );
  }

  // Default inline variant
  return (
    <div className={`flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 ${className}`}>
      <Users className="w-4 h-4" />
      <span>{t("socialProof.subscribersCount").replace("{count}", String(displayCount))}</span>
    </div>
  );
}
