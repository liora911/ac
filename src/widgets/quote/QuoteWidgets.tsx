"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { physicsQuotes } from "@/data/quotes";
import { isHex, withAlpha } from "../colorUtils";
import type { WidgetComponentProps } from "@/types/Widgets/widgets";

interface DisplayQuote {
  text: string;
  author: string;
}

// Build the quote pool: the professor's own quotes (one per line in config),
// or the built-in physics/philosophy quotes when he hasn't entered any.
function buildPool(
  config: WidgetComponentProps["config"],
  locale: string
): DisplayQuote[] {
  const raw = (config?.quotes as string) ?? "";
  const custom = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (custom.length > 0) {
    // Support an optional " — Author" suffix per line
    return custom.map((line) => {
      const m = line.split(/\s+[—-]\s+/);
      return m.length > 1
        ? { text: m.slice(0, -1).join(" — "), author: m[m.length - 1] }
        : { text: line, author: "" };
    });
  }
  return physicsQuotes.map((q) => ({
    text: locale === "he" ? q.he : q.en,
    author: q.author,
  }));
}

// Rotate deterministically by wall-clock so the quote changes on the chosen
// cadence (e.g. every 24h). Computed on the client to avoid SSR/CSR mismatch.
function useRotatingQuote(config: WidgetComponentProps["config"]) {
  const { locale } = useTranslation();
  const pool = buildPool(config, locale);
  const rotationHours = Math.max(1, Number(config?.rotation) || 24);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const compute = () =>
      pool.length > 0
        ? Math.floor(Date.now() / (rotationHours * 3600_000)) % pool.length
        : 0;
    setIndex(compute());
    const timer = setInterval(() => setIndex(compute()), 60_000);
    return () => clearInterval(timer);
  }, [rotationHours, pool.length]);

  const quote = pool[index] ?? pool[0] ?? { text: "", author: "" };
  return { ...quote, isRTL: locale === "he" };
}

export function QuoteCard({ config }: WidgetComponentProps) {
  const { text, author, isRTL } = useRotatingQuote(config);
  if (!text) return null;
  // Matches the rich-text editor's blockquote: a single-sided accent bar with a
  // color→transparent gradient, rounded on the far side, italic text. Uses the
  // admin's custom color when set, otherwise the default blue.
  const raw = config?.color;
  const custom = isHex(raw) ? raw : null;
  const style = custom
    ? isRTL
      ? {
          borderRightColor: custom,
          backgroundImage: `linear-gradient(to left, ${withAlpha(custom, "1a")}, transparent)`,
        }
      : {
          borderLeftColor: custom,
          backgroundImage: `linear-gradient(to right, ${withAlpha(custom, "1a")}, transparent)`,
        }
    : undefined;
  return (
    <blockquote
      dir={isRTL ? "rtl" : "ltr"}
      style={style}
      className={`max-w-3xl mx-auto border-blue-500 from-blue-50 to-transparent dark:from-blue-500/10 p-5 md:p-6 ${
        isRTL
          ? "border-r-4 rounded-l-lg bg-gradient-to-l"
          : "border-l-4 rounded-r-lg bg-gradient-to-r"
      }`}
    >
      <p
        className="text-lg md:text-xl italic leading-relaxed text-gray-700 dark:text-gray-300"
        suppressHydrationWarning
      >
        {text}
      </p>
      {author && (
        <footer className="mt-3 text-sm font-semibold not-italic text-gray-500 dark:text-gray-400">
          — {author}
        </footer>
      )}
    </blockquote>
  );
}

export function QuoteBanner({ config }: WidgetComponentProps) {
  const { text, author, isRTL } = useRotatingQuote(config);
  if (!text) return null;
  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 md:p-10 text-center shadow-lg"
    >
      <p
        className="text-xl md:text-2xl font-bold italic leading-relaxed text-white"
        suppressHydrationWarning
      >
        &ldquo;{text}&rdquo;
      </p>
      {author && <p className="mt-4 text-sm font-medium text-white/80">— {author}</p>}
    </div>
  );
}

export function QuoteMinimal({ config }: WidgetComponentProps) {
  const { text, author, isRTL } = useRotatingQuote(config);
  if (!text) return null;
  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="max-w-2xl mx-auto text-center">
      <p
        className="text-base md:text-lg italic text-gray-600 dark:text-gray-300 leading-relaxed"
        suppressHydrationWarning
      >
        {text}
      </p>
      {author && (
        <p className="mt-2 text-xs font-medium text-gray-400 dark:text-gray-500">
          — {author}
        </p>
      )}
    </div>
  );
}

// Admin card preview fallback
export function QuotePreview() {
  return <QuoteCard config={null} />;
}
