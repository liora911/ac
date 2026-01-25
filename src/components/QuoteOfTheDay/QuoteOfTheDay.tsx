"use client";

import { useTranslation } from "@/contexts/Translation/translation.context";
import { getQuoteOfTheDay } from "@/data/quotes";
import type { QuoteOfTheDayProps } from "@/types/Components/components";

export default function QuoteOfTheDay({ className = "" }: QuoteOfTheDayProps) {
  const { locale } = useTranslation();
  const quote = getQuoteOfTheDay();

  const text = locale === "he" ? quote.he : quote.en;
  const isRTL = locale === "he";

  return (
    <div
      className={`max-w-2xl ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        animation: isRTL ? "slideInFromLeft 1.2s ease-out forwards" : "slideInFromRight 1.2s ease-out forwards",
        opacity: 0,
      }}
    >
      <style jsx>{`
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
      <blockquote className="relative">
        <span className="absolute -top-4 -right-2 text-6xl text-gray-300 font-serif leading-none select-none">
          &ldquo;
        </span>
        <p className="text-gray-700 text-[22px] font-bold italic leading-relaxed px-4">
          {text}
        </p>
        <footer className="mt-4 px-4">
          <cite className="text-gray-500 text-base not-italic font-medium">
            — {quote.author}
          </cite>
        </footer>
      </blockquote>
    </div>
  );
}
