"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { isHex, readableTextColor } from "../colorUtils";
import type { WidgetComponentProps } from "@/types/Widgets/widgets";

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

function ClockBase({
  theme,
  config,
}: {
  theme: ClockTheme;
  config?: WidgetComponentProps["config"];
}) {
  const { locale } = useTranslation();
  const raw = config?.color;
  const custom = isHex(raw) ? raw : null;
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
      style={
        custom
          ? { background: custom, color: readableTextColor(custom), borderColor: "transparent" }
          : undefined
      }
      className={`rounded-2xl border p-6 text-center shadow-sm ${
        custom ? "" : THEMES[theme]
      }`}
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

export function ClockPurple({ config }: WidgetComponentProps) {
  return <ClockBase theme="purple" config={config} />;
}
export function ClockOrange({ config }: WidgetComponentProps) {
  return <ClockBase theme="orange" config={config} />;
}
export function ClockWhite({ config }: WidgetComponentProps) {
  return <ClockBase theme="white" config={config} />;
}
export function ClockBlack({ config }: WidgetComponentProps) {
  return <ClockBase theme="black" config={config} />;
}

// Admin card preview
export function ClockPreview() {
  return <ClockBase theme="purple" />;
}
