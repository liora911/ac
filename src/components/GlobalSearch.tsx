"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { MdSearch, MdClose } from "react-icons/md";
import { useTranslation } from "@/hooks/useTranslation";

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  content?: string;
  eventDate?: string;
  date?: string;
  location?: string;
  category?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface SearchResults {
  articles: SearchResult[];
  presentations: SearchResult[];
  events: SearchResult[];
  lectures: SearchResult[];
  total: number;
  query: string;
}

export default function GlobalSearch() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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

      const allResults = [
        ...results.articles,
        ...results.presentations,
        ...results.events,
        ...results.lectures,
      ];

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < allResults.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < allResults.length) {
            const result = allResults[selectedIndex];
            handleResultClick(result, getResultType(result, results));
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
  }, [isOpen, results, selectedIndex]);

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
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Search error:", error);
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
        return `/articles/${result.id}`;
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

  return (
    <div ref={searchRef} className="relative w-full max-w-sm p-0 m-0">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MdSearch className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleInputFocus}
          placeholder={t("globalSearch.placeholder")}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          aria-label="Global search"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          role="combobox"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            aria-label="Clear search"
          >
            <MdClose className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {isOpen && results && (
        <div
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
          role="listbox"
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
              Searching...
            </div>
          ) : results.total === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No results found for "{results.query}"
            </div>
          ) : (
            <div>
              {[
                {
                  type: "articles",
                  label: "Articles",
                  items: results.articles,
                },
                {
                  type: "presentations",
                  label: "Presentations",
                  items: results.presentations,
                },
                { type: "events", label: "Events", items: results.events },
                {
                  type: "lectures",
                  label: "Lectures",
                  items: results.lectures,
                },
              ].map(
                ({ type, label, items }) =>
                  items.length > 0 && (
                    <div key={type}>
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                          {label} ({items.length})
                        </span>
                      </div>
                      {items.map((result, index) => {
                        const globalIndex = allResults.findIndex(
                          (r) => r.id === result.id
                        );
                        const isSelected = selectedIndex === globalIndex;
                        return (
                          <div
                            key={result.id}
                            onClick={() => handleResultClick(result, type)}
                            className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                              isSelected ? "bg-blue-50" : ""
                            }`}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-lg">
                                {getResultIcon(type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">
                                  {result.title}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
              )}

              <div className="p-3 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => {
                    router.push(
                      `/search?q=${encodeURIComponent(results.query)}`
                    );
                    setIsOpen(false);
                    setQuery("");
                    setResults(null);
                  }}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all {results.total} results
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
