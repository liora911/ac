"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MdSearch, MdClose } from "react-icons/md";
import { useTranslation } from "@/hooks/useTranslation";
import { SearchResult, SearchResults } from "@/types/GlobalSearch/globalsearch";

type CategoryType = "all" | "lectures" | "events" | "articles" | "presentations";

export default function GlobalSearch() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState<CategoryType>("all");
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query.trim());
      } else {
        setResults(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !results) return;

      const currentFilteredResults = activeTab === "all"
        ? [
            ...results.articles.map((r) => ({ ...r, type: "articles" })),
            ...results.presentations.map((r) => ({ ...r, type: "presentations" })),
            ...results.events.map((r) => ({ ...r, type: "events" })),
            ...results.lectures.map((r) => ({ ...r, type: "lectures" })),
          ]
        : activeTab === "articles"
        ? results.articles.map((r) => ({ ...r, type: "articles" }))
        : activeTab === "presentations"
        ? results.presentations.map((r) => ({ ...r, type: "presentations" }))
        : activeTab === "events"
        ? results.events.map((r) => ({ ...r, type: "events" }))
        : results.lectures.map((r) => ({ ...r, type: "lectures" }));

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < currentFilteredResults.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < currentFilteredResults.length) {
            const result = currentFilteredResults[selectedIndex];
            handleResultClick(result, result.type);
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setIsOpen(true);
      } else if (response.status === 429) {
        setError(t("globalSearch.rateLimited") || "Too many requests. Please wait.");
        setIsOpen(true);
      } else {
        setError(t("globalSearch.error") || "Search failed.");
        setIsOpen(true);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(t("globalSearch.error") || "Search failed.");
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getResultType = (result: SearchResult, results: SearchResults) => {
    if (results.articles.some((a) => a.id === result.id)) return "articles";
    if (results.presentations.some((p) => p.id === result.id))
      return "presentations";
    if (results.events.some((e) => e.id === result.id)) return "events";
    if (results.lectures.some((l) => l.id === result.id)) return "lectures";
    return "";
  };

  const getResultUrl = (result: SearchResult, type: string) => {
    switch (type) {
      case "articles":
        return `/articles/${result.slug || result.id}`;
      case "presentations":
        return `/presentations/${result.id}`;
      case "events":
        return `/events/${result.id}`;
      case "lectures":
        return `/lectures/${result.id}`;
      default:
        return "/";
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "articles":
        return "📝";
      case "presentations":
        return "📊";
      case "events":
        return "📅";
      case "lectures":
        return "🎓";
      default:
        return "📄";
    }
  };

  const handleResultClick = (result: SearchResult, type: string) => {
    const url = getResultUrl(result, type);
    router.push(url);
    setIsOpen(false);
    setQuery("");
    setResults(null);
    setSelectedIndex(-1);
  };

  const handleInputFocus = () => {
    if (results) {
      setIsOpen(true);
    }
    // Don't auto-search on focus - wait for user to type at least 2 characters
  };

  const clearSearch = () => {
    setQuery("");
    setResults(null);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const allResults = results
    ? [
        ...results.articles.map((r) => ({ ...r, type: "articles" })),
        ...results.presentations.map((r) => ({ ...r, type: "presentations" })),
        ...results.events.map((r) => ({ ...r, type: "events" })),
        ...results.lectures.map((r) => ({ ...r, type: "lectures" })),
      ]
    : [];

  // Filter results based on active tab
  const filteredResults = activeTab === "all"
    ? allResults
    : allResults.filter(r => r.type === activeTab);

  // Category tabs configuration
  const allCategories: { key: CategoryType; label: string; count: number }[] = results
    ? [
        { key: "all" as const, label: t("globalSearch.all") || "All", count: results.total },
        { key: "lectures" as const, label: t("globalSearch.lectures") || "Lectures", count: results.lectures.length },
        { key: "events" as const, label: t("globalSearch.events") || "Events", count: results.events.length },
        { key: "articles" as const, label: t("globalSearch.articles") || "Articles", count: results.articles.length },
        { key: "presentations" as const, label: t("globalSearch.presentations") || "Presentations", count: results.presentations.length },
      ]
    : [];

  const categories = allCategories.filter(cat => cat.key === "all" || cat.count > 0);

  return (
    <div ref={searchRef} className="relative w-full max-w-xs sm:max-w-sm p-0 m-0">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
          <MdSearch className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={t("globalSearch.placeholder")}
          className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          aria-label="Global search"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-2 sm:pr-3 flex items-center"
            aria-label="Clear search"
          >
            <MdClose className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {isOpen && (results || error) && (
        <div
          className="absolute z-[60] w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden"
          role="listbox"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400" role="status" aria-live="polite">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2" aria-hidden="true"></div>
              {t("globalSearch.searching") || "Searching..."}
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-500 dark:text-red-400">
              {error}
            </div>
          ) : results && results.total === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {t("globalSearch.noResults") || "No results found for"} "{results.query}"
            </div>
          ) : results ? (
            <div className="flex flex-col">
              {/* Scrollable Tabs */}
              <div
                ref={tabsRef}
                className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 scrollbar-hide"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {categories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => {
                      setActiveTab(cat.key);
                      setSelectedIndex(-1);
                    }}
                    className={`flex-shrink-0 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
                      activeTab === cat.key
                        ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                        : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {cat.label} ({cat.count})
                  </button>
                ))}
              </div>

              {/* Results List */}
              <div className="max-h-[50vh] sm:max-h-80 overflow-y-auto">
                {filteredResults.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                    {t("globalSearch.noResultsInCategory") || "No results in this category"}
                  </div>
                ) : (
                  filteredResults.map((result, index) => {
                    const isSelected = selectedIndex === index;
                    return (
                      <div
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result, result.type)}
                        className={`px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                          isSelected ? "bg-blue-50 dark:bg-blue-900/30" : ""
                        }`}
                        role="option"
                        aria-selected={isSelected}
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <span className="text-base sm:text-lg flex-shrink-0">
                            {getResultIcon(result.type)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
                              {result.title}
                            </div>
                            {activeTab === "all" && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                {result.type}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* View All Button */}
              <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => {
                    router.push(
                      `/search?q=${encodeURIComponent(results.query)}`
                    );
                    setIsOpen(false);
                    setQuery("");
                    setResults(null);
                  }}
                  className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium cursor-pointer"
                >
                  {t("globalSearch.viewAll") || "View all"} {results.total} {t("globalSearch.results") || "results"}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
