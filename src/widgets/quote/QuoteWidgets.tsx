"use client";

import { Quote as QuoteIcon } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { getQuoteOfTheDay } from "@/data/quotes";
import type { WidgetComponentProps } from "@/types/Widgets/widgets";

function useDailyQuote() {
  const { locale } = useTranslation();
  const quote = getQuoteOfTheDay();
  return {
    text: locale === "he" ? quote.he : quote.en,
    author: quote.author,
    isRTL: locale === "he",
  };
}

export function QuoteCard(_props: WidgetComponentProps) {
  const { text, author, isRTL } = useDailyQuote();
  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="max-w-3xl mx-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 md:p-8 shadow-sm"
    >
      <QuoteIcon className="w-8 h-8 text-blue-500/40 dark:text-blue-400/40 mb-3" />
      <p className="text-lg md:text-xl font-medium italic leading-relaxed text-gray-800 dark:text-gray-100">
        {text}
      </p>
      <p className="mt-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
        — {author}
      </p>
    </div>
  );
}

export function QuoteBanner(_props: WidgetComponentProps) {
  const { text, author, isRTL } = useDailyQuote();
  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 md:p-10 text-center shadow-lg"
    >
      <p className="text-xl md:text-2xl font-bold italic leading-relaxed text-white">
        &ldquo;{text}&rdquo;
      </p>
      <p className="mt-4 text-sm font-medium text-white/80">— {author}</p>
    </div>
  );
}

export function QuoteMinimal(_props: WidgetComponentProps) {
  const { text, author, isRTL } = useDailyQuote();
  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="max-w-2xl mx-auto text-center">
      <p className="text-base md:text-lg italic text-gray-600 dark:text-gray-300 leading-relaxed">
        {text}
      </p>
      <p className="mt-2 text-xs font-medium text-gray-400 dark:text-gray-500">
        — {author}
      </p>
    </div>
  );
}

// Compact representative render for the admin library card
export function QuotePreview() {
  const { text, author, isRTL } = useDailyQuote();
  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3"
    >
      <p className="text-xs italic text-gray-700 dark:text-gray-200 line-clamp-3">
        &ldquo;{text}&rdquo;
      </p>
      <p className="mt-1.5 text-[10px] font-semibold text-gray-400 dark:text-gray-500">
        — {author}
      </p>
    </div>
  );
}
