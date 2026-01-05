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
      className={`max-w-2xl animate-fade-in ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
      style={{
        animation: "fadeIn 1.5s ease-in-out",
      }}
    >
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <blockquote className="relative">
        <span className="absolute -top-4 -right-2 text-6xl text-white/30 font-serif leading-none select-none">
          &ldquo;
        </span>
        <p className="text-white/90 text-[22px] font-bold italic leading-relaxed px-4">
          {text}
        </p>
        <footer className="mt-4 px-4">
          <cite className="text-white/70 text-base not-italic font-medium">
            — {quote.author}
          </cite>
        </footer>
      </blockquote>
    </div>
  );
}
