"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

/**
 * The site-wide carousel arrow: a solid disc button face so the chevron is
 * visible on any background, in both themes. Wrap it in whatever positioned
 * button/gradient each carousel needs.
 */
export default function ChevronDisc({
  dir,
  loading = false,
  iconClassName = "text-gray-800 dark:text-gray-100",
}: {
  dir: "left" | "right";
  loading?: boolean;
  iconClassName?: string;
}) {
  const Icon = dir === "left" ? ChevronLeft : ChevronRight;
  return (
    <span className="flex items-center justify-center w-10 h-10 md:w-11 md:h-11 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-lg">
      {loading ? (
        <Loader2 className={`w-5 h-5 md:w-6 md:h-6 animate-spin ${iconClassName}`} />
      ) : (
        <Icon className={`w-6 h-6 md:w-7 md:h-7 ${iconClassName}`} />
      )}
    </span>
  );
}
