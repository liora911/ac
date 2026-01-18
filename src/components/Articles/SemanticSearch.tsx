"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Sparkles, X, Loader2 } from "lucide-react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { Article } from "@/types/Articles/articles";

interface SemanticSearchResult {
  id: string;
  title: string;
  subtitle?: string | null;
  slug?: string | null;
  articleImage?: string | null;
  publisherName: string;
  readDuration: number;
  isPremium: boolean;
  createdAt: string;
  authors: { name: string; imageUrl?: string | null; order: number }[];
  categories: { id: string; name: string }[];
  similarity: number; // Percentage 0-100
}

interface SemanticSearchResponse {
  results: SemanticSearchResult[];
  query: string;
  totalMatches: number;
  message?: string;
}

interface SemanticSearchProps {
  onResults: (articles: Article[] | null, isSemanticMode: boolean) => void;
  onLoading: (loading: boolean) => void;
}

// Debounce hook
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function SemanticSearch({ onResults, onLoading }: SemanticSearchProps) {
  const { t, locale } = useTranslation();
  const isHebrew = locale === "he";

  const [query, setQuery] = useState("");
  const [isAIMode, setIsAIMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<SemanticSearchResult[] | null>(null);

  const debouncedQuery = useDebouncedValue(query, 500);

  // Perform semantic search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !isAIMode) {
      onResults(null, false);
      setLastResults(null);
      return;
    }

    setIsSearching(true);
    onLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/articles/semantic-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery.trim(),
          limit: 20,
          minSimilarity: 0.25,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Search failed");
      }

      const data: SemanticSearchResponse = await response.json();

      if (data.message && data.results.length === 0) {
        setError(data.message);
        onResults([], true);
        setLastResults([]);
        return;
      }

      // Convert to Article format for the list
      const articles: Article[] = data.results.map((r) => ({
        id: r.id,
        title: r.title,
        subtitle: r.subtitle || undefined,
        slug: r.slug || undefined,
        content: "",
        featuredImage: r.articleImage || undefined,
        articleImage: r.articleImage || undefined,
        status: "PUBLISHED" as const,
        isFeatured: false,
        isPremium: r.isPremium,
        publisherName: r.publisherName,
        readDuration: r.readDuration,
        createdAt: r.createdAt,
        updatedAt: r.createdAt,
        authors: r.authors.map((a) => ({
          id: "",
          name: a.name,
          imageUrl: a.imageUrl || undefined,
          order: a.order,
        })),
        categories: r.categories,
        tags: [],
        // Add similarity score for display
        _similarity: r.similarity,
      }));

      setLastResults(data.results);
      onResults(articles, true);
    } catch (err) {
      console.error("Semantic search error:", err);
      setError(err instanceof Error ? err.message : "Search failed");
      onResults([], true);
      setLastResults([]);
    } finally {
      setIsSearching(false);
      onLoading(false);
    }
  }, [isAIMode, onResults, onLoading]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (isAIMode && debouncedQuery) {
      performSearch(debouncedQuery);
    } else if (!debouncedQuery) {
      onResults(null, isAIMode);
      setLastResults(null);
      setError(null);
    }
  }, [debouncedQuery, isAIMode, performSearch, onResults]);

  // When AI mode is turned off, clear results
  useEffect(() => {
    if (!isAIMode) {
      onResults(null, false);
      setLastResults(null);
      setError(null);
    }
  }, [isAIMode, onResults]);

  const clearSearch = () => {
    setQuery("");
    setError(null);
    onResults(null, isAIMode);
    setLastResults(null);
  };

  const placeholderText = isAIMode
    ? (t("semanticSearch.placeholder") || "Describe what you're looking for...")
    : (t("articleForm.searchPlaceholder") || "Search articles...");

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
          ) : isAIMode ? (
            <Sparkles className="h-5 w-5 text-purple-500" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholderText as string}
          dir={isHebrew ? "rtl" : "ltr"}
          className={`
            w-full pl-10 pr-24 py-3
            border rounded-xl
            focus:outline-none focus:ring-2
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            transition-all duration-200
            ${isAIMode
              ? "border-purple-300 dark:border-purple-600 focus:ring-purple-500 focus:border-purple-500"
              : "border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
            }
          `}
        />

        {/* Clear button */}
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-20 flex items-center pr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* AI Mode Toggle */}
        <button
          onClick={() => setIsAIMode(!isAIMode)}
          className={`
            absolute inset-y-0 right-2 flex items-center px-3 my-1.5 rounded-lg
            text-sm font-medium transition-all duration-200
            ${isAIMode
              ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
            }
          `}
          title={isAIMode ? (t("semanticSearch.disableAI") || "Switch to regular search") : (t("semanticSearch.enableAI") || "Enable AI search")}
        >
          <Sparkles className={`h-4 w-4 ${isAIMode ? "mr-1" : ""}`} />
          {isAIMode && <span className="hidden sm:inline">{t("semanticSearch.aiLabel") || "AI"}</span>}
        </button>
      </div>

      {/* AI Mode Description */}
      {isAIMode && (
        <div className="mt-2 flex items-start gap-2 text-sm text-purple-600 dark:text-purple-400">
          <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>
            {t("semanticSearch.description") || "AI search understands meaning, not just keywords. Try describing what you want to learn about."}
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Results info when in AI mode */}
      {isAIMode && lastResults && lastResults.length > 0 && !isSearching && (
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {t("semanticSearch.resultsFound")?.replace("{count}", lastResults.length.toString()) ||
            `Found ${lastResults.length} related articles`}
          {lastResults.length > 0 && (
            <span className="text-purple-600 dark:text-purple-400 ml-2">
              ({t("semanticSearch.topMatch") || "Top match"}: {lastResults[0].similarity}% {t("semanticSearch.relevance") || "relevance"})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
