"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/contexts/Translation/translation.context";

type ClockTheme = "purple" | "orange" | "white" | "black";

const THEMES: Record<ClockTheme, string> = {
  purple:
    "bg-gradient-to-br from-purple-600 to-indigo-700 text-white border-transparent",
  orange:
    "bg-gradient-to-br from-orange-500 to-red-600 text-white border-transparent",
  white:
    "bg-white text-gray-900 border-gray-200 dark:bg-white dark:text-gray-900",
  black:
    "bg-gray-950 text-white border-gray-800 dark:bg-black dark:border-gray-800",
};

function ClockBase({ theme }: { theme: ClockTheme }) {
  const { locale } = useTranslation();
  const isRTL = locale === "he";
  // Initialise on mount only, so server and client agree (no hydration mismatch)
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const localeTag = locale === "he" ? "he-IL" : "en-US";
  const time = now
    ? now.toLocaleTimeString(localeTag, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "--:--:--";
  const date = now
    ? now.toLocaleDateString(localeTag, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={`rounded-2xl border p-6 text-center shadow-sm ${THEMES[theme]}`}
    >
      <div
        className="text-4xl md:text-5xl font-bold tracking-tight tabular-nums"
        suppressHydrationWarning
      >
        {time}
      </div>
      <div
        className="mt-2 text-sm font-medium opacity-80"
        suppressHydrationWarning
      >
        {date || " "}
      </div>
    </div>
  );
}

export function ClockPurple() {
  return <ClockBase theme="purple" />;
}
export function ClockOrange() {
  return <ClockBase theme="orange" />;
}
export function ClockWhite() {
  return <ClockBase theme="white" />;
}
export function ClockBlack() {
  return <ClockBase theme="black" />;
}

// Admin card preview
export function ClockPreview() {
  return <ClockBase theme="purple" />;
}
