"use client";

import React, { useState } from "react";
import { Search, X, Mic } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import type { ArticleSearchProps } from "@/types/Articles/articles";

export default function SemanticSearch({ onSearch, onClear }: ArticleSearchProps) {
  const { t, locale } = useTranslation();
  const isHebrew = locale === "he";

  const [query, setQuery] = useState("");

  // Speech-to-text for search
  const { isListening, isSupported, toggleListening } = useSpeechToText({
    lang: isHebrew ? "he-IL" : "en-US",
    onFinalResult: (transcript) => {
      setQuery((prev) => (prev ? prev + " " + transcript : transcript));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery("");
    onClear();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      onSearch(query.trim());
    }
  };

  const placeholderText = t("articleForm.searchPlaceholder") || "Search articles...";

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText as string}
          dir={isHebrew ? "rtl" : "ltr"}
          className="w-full pl-10 pr-20 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all"
        />

        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {isSupported && (
            <button
              type="button"
              onClick={toggleListening}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                isListening
                  ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
              }`}
              title={isListening ? t("common.stopListening") : t("common.startListening")}
            >
              <Mic className={`w-4 h-4 ${isListening ? "animate-pulse" : ""}`} />
            </button>
          )}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
