"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  MdSearch,
  MdArticle,
  MdOutlineOndemandVideo,
  MdEvent,
  MdMic,
} from "react-icons/md";

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

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q && q.trim().length >= 2) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
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
        return <MdArticle className="h-5 w-5" />;
      case "presentations":
        return <MdOutlineOndemandVideo className="h-5 w-5" />;
      case "events":
        return <MdEvent className="h-5 w-5" />;
      case "lectures":
        return <MdMic className="h-5 w-5" />;
      default:
        return <MdSearch className="h-5 w-5" />;
    }
  };

  const getFilteredResults = () => {
    if (!results) return [];

    switch (activeTab) {
      case "articles":
        return results.articles.map((r) => ({ ...r, type: "articles" }));
      case "presentations":
        return results.presentations.map((r) => ({
          ...r,
          type: "presentations",
        }));
      case "events":
        return results.events.map((r) => ({ ...r, type: "events" }));
      case "lectures":
        return results.lectures.map((r) => ({ ...r, type: "lectures" }));
      default:
        return [
          ...results.articles.map((r) => ({ ...r, type: "articles" })),
          ...results.presentations.map((r) => ({
            ...r,
            type: "presentations",
          })),
          ...results.events.map((r) => ({ ...r, type: "events" })),
          ...results.lectures.map((r) => ({ ...r, type: "lectures" })),
        ];
    }
  };

  const tabs = [
    { id: "all", label: "All Results", count: results?.total || 0 },
    { id: "articles", label: "Articles", count: results?.articles.length || 0 },
    {
      id: "presentations",
      label: "Presentations",
      count: results?.presentations.length || 0,
    },
    { id: "events", label: "Events", count: results?.events.length || 0 },
    { id: "lectures", label: "Lectures", count: results?.lectures.length || 0 },
  ];

  const filteredResults = getFilteredResults();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Search Results
          </h1>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MdSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles, presentations, events, lectures..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <button
                type="submit"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-600 hover:text-blue-800"
                disabled={query.trim().length < 2}
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching...</p>
          </div>
        )}

        {/* Results */}
        {!isLoading && results && (
          <>
            {/* Results Summary */}
            <div className="mb-6">
              <p className="text-gray-600">
                {results.total === 0
                  ? `No results found for "${results.query}"`
                  : `Found ${results.total} result${
                      results.total === 1 ? "" : "s"
                    } for "${results.query}"`}
              </p>
            </div>

            {/* Tabs */}
            {results.total > 0 && (
              <div className="mb-6">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab.id
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        {tab.label}
                        {tab.count > 0 && (
                          <span
                            className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                              activeTab === tab.id
                                ? "bg-blue-100 text-blue-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            )}

            {/* Results List */}
            {results.total > 0 && (
              <div className="space-y-4">
                {filteredResults.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 text-blue-600">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Link
                              href={getResultUrl(result, result.type)}
                              className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {result.title}
                            </Link>
                            <div className="mt-2 text-gray-600 line-clamp-3">
                              {result.description ||
                                result.content?.substring(0, 200) + "..."}
                            </div>
                            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                              {result.category && (
                                <span>Category: {result.category.name}</span>
                              )}
                              {(result.eventDate || result.date) && (
                                <span>
                                  Date:{" "}
                                  {new Date(
                                    result.eventDate || result.date!
                                  ).toLocaleDateString()}
                                </span>
                              )}
                              {result.location && (
                                <span>Location: {result.location}</span>
                              )}
                              <span>
                                Updated:{" "}
                                {new Date(
                                  result.updatedAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 ml-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                              {result.type.slice(0, -1)}{" "}
                              {/* Remove 's' from plural */}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {results.total === 0 && !isLoading && (
              <div className="text-center py-12">
                <MdSearch className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search terms or browse our content
                  categories.
                </p>
                <div className="flex justify-center gap-4">
                  <Link
                    href="/articles"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Browse Articles
                  </Link>
                  <Link
                    href="/presentations"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Browse Presentations
                  </Link>
                  <Link
                    href="/events"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Browse Events
                  </Link>
                  <Link
                    href="/lectures"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Browse Lectures
                  </Link>
                </div>
              </div>
            )}
          </>
        )}

        {/* Initial State */}
        {!isLoading && !results && (
          <div className="text-center py-12">
            <MdSearch className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Search our content
            </h3>
            <p className="text-gray-600">
              Enter a search term above to find articles, presentations, events,
              and lectures.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading search...</p>
            </div>
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
