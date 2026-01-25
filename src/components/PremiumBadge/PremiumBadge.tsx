"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Star, Crown, Sparkles } from "lucide-react";
import Tooltip from "@/components/Tooltip";
import { useTranslation } from "@/hooks/useTranslation";
import type { PremiumBadgeProps, PremiumTagProps } from "@/types/Components/components";

export default function PremiumBadge({
  size = "md",
  variant = "star",
  showTooltip = true,
  onClick,
  className = "",
}: PremiumBadgeProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useTranslation();

  const hasAccess =
    session?.user?.role === "ADMIN" || session?.user?.hasActiveSubscription;

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onClick) {
      onClick();
    } else if (!hasAccess) {
      router.push("/pricing");
    }
  };

  const Icon = variant === "crown" ? Crown : variant === "badge" ? Sparkles : Star;

  const tooltipContent = hasAccess ? (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
        <span className="font-semibold">{t("premiumBadge.subscriberTitle")}</span>
      </div>
      <p className="text-xs text-gray-300 dark:text-gray-600">
        {t("premiumBadge.subscriberMessage")}
      </p>
    </div>
  ) : (
    <div className="text-center min-w-[180px]">
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <Crown className="w-4 h-4 text-amber-400" />
        <span className="font-semibold">{t("premiumBadge.title")}</span>
      </div>
      <p className="text-xs text-gray-300 dark:text-gray-600 mb-3">
        {t("premiumBadge.description")}
      </p>
      <div className="flex items-center justify-center gap-2 text-xs">
        <span className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded-full">
          {t("premiumBadge.clickToSubscribe")}
        </span>
      </div>
    </div>
  );

  const badge = hasAccess ? (
    // Subscriber/Admin view: solid filled star
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-md ${className}`}
    >
      <Icon className={`${iconSizes[size]} text-white fill-white`} />
    </div>
  ) : (
    // Non-subscriber: interactive button
    <button
      onClick={handleClick}
      className={`
        ${sizeClasses[size]} rounded-full
        border-2 border-amber-400
        bg-gradient-to-br from-amber-50 to-amber-100
        hover:from-amber-100 hover:to-amber-200
        dark:from-amber-900/30 dark:to-amber-800/30
        dark:hover:from-amber-800/40 dark:hover:to-amber-700/40
        flex items-center justify-center
        transition-all duration-200
        hover:scale-110 hover:shadow-lg hover:shadow-amber-200/50
        cursor-pointer
        group
        ${className}
      `}
      aria-label={t("premiumBadge.ariaLabel")}
    >
      <Icon
        className={`
          ${iconSizes[size]}
          text-amber-500
          group-hover:text-amber-600
          group-hover:fill-amber-500
          transition-all duration-200
        `}
      />
    </button>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <Tooltip content={tooltipContent} position="top">
      {badge}
    </Tooltip>
  );
}

// Compact inline badge for cards/lists
export function PremiumTag({ className = "" }: PremiumTagProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { t } = useTranslation();

  const hasAccess =
    session?.user?.role === "ADMIN" || session?.user?.hasActiveSubscription;

  const tooltipContent = hasAccess ? (
    <span>{t("premiumBadge.subscriberAccess")}</span>
  ) : (
    <div className="text-center">
      <p className="mb-1">{t("premiumBadge.exclusiveContent")}</p>
      <span className="text-amber-300 text-xs">{t("premiumBadge.clickToSubscribe")}</span>
    </div>
  );

  return (
    <Tooltip content={tooltipContent} position="top">
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!hasAccess) router.push("/pricing");
        }}
        className={`
          inline-flex items-center gap-1 px-2 py-0.5
          rounded-full text-xs font-medium
          ${hasAccess
            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
            : "bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 cursor-pointer"
          }
          transition-colors
          ${className}
        `}
      >
        <Star className="w-3 h-3 fill-current" />
        {t("common.premium")}
      </button>
    </Tooltip>
  );
}
