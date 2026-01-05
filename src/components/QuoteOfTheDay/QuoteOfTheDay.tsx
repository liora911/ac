"use client";

import { useTranslation } from "@/contexts/Translation/translation.context";
import { getQuoteOfTheDay } from "@/data/quotes";

interface QuoteOfTheDayProps {
  className?: string;
}

export default function QuoteOfTheDay({ className = "" }: QuoteOfTheDayProps) {
  const { locale } = useTranslation();
  const quote = getQuoteOfTheDay();

  const text = locale === "he" ? quote.he : quote.en;
  const isRTL = locale === "he";

  return (
    <div
      className={`max-w-2xl ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <blockquote className="relative">
        <span className="absolute -top-4 -right-2 text-6xl text-white/30 font-serif leading-none select-none">
          &ldquo;
        </span>
        <p className="text-white/80 text-lg md:text-xl italic font-light leading-relaxed px-4">
          {text}
        </p>
        <footer className="mt-3 px-4">
          <cite className="text-white/60 text-sm not-italic">
            — {quote.author}
          </cite>
        </footer>
      </blockquote>
    </div>
  );
}
