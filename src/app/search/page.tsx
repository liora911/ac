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
import ArticleModal from "@/components/Articles/ArticleModal";
import PresentationModal from "@/components/Presentations/PresentationModal";
import EventModal from "@/components/Events/EventModal";
import LectureModal from "@/components/Lectures/LectureModal";
import { Article } from "@/types/Articles/articles";
import { Presentation } from "@/types/Presentations/presentations";
import { Event } from "@/types/Events/events";
import { Lecture } from "@/types/Lectures/lectures";
import { useTranslation } from "@/contexts/Translation/translation.context";

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
  const { t, locale } = useTranslation();
  const isHebrew = locale === "he";
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [selectedPresentation, setSelectedPresentation] =
    useState<Presentation | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, "");
  };

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

  const handleResultClick = async (result: SearchResult, type: string) => {
    setModalLoading(true);
    try {
      const response = await fetch(`/api/${type}/${result.id}`);
      if (response.ok) {
        const data = await response.json();
        switch (type) {
          case "articles":
            setSelectedArticle(data);
            break;
          case "presentations":
            setSelectedPresentation(data);
            break;
          case "events":
            setSelectedEvent(data);
            break;
          case "lectures":
            setSelectedLecture(data);
            break;
        }
      }
    } catch (error) {
      console.error("Error fetching item details:", error);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModals = () => {
    setSelectedArticle(null);
    setSelectedPresentation(null);
    setSelectedEvent(null);
    setSelectedLecture(null);
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
    {
      id: "all",
      label: t("searchPage.tabs.all"),
      count: results?.total || 0,
    },
    {
      id: "articles",
      label: t("searchPage.tabs.articles"),
      count: results?.articles.length || 0,
    },
    {
      id: "presentations",
      label: t("searchPage.tabs.presentations"),
      count: results?.presentations.length || 0,
    },
    {
      id: "events",
      label: t("searchPage.tabs.events"),
      count: results?.events.length || 0,
    },
    {
      id: "lectures",
      label: t("searchPage.tabs.lectures"),
      count: results?.lectures.length || 0,
    },
  ];

  const filteredResults = getFilteredResults();

  const getResultsMessage = () => {
    if (!results) return "";
    if (results.total === 0) {
      return `${t("searchPage.noResultsFor")} "${results.query}"`;
    }
    if (results.total === 1) {
      return `${t("searchPage.foundResult")} "${results.query}"`;
    }
    return `${t("searchPage.foundResults").replace("{count}", String(results.total))} "${results.query}"`;
  };

  return (
    <div
      className="min-h-screen bg-gray-50 py-6 sm:py-8"
      dir={isHebrew ? "rtl" : "ltr"}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            {t("searchPage.title")}
          </h1>

          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <div
                className={`absolute inset-y-0 ${isHebrew ? "right-0 pr-3" : "left-0 pl-3"} flex items-center pointer-events-none`}
              >
                <MdSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPage.searchPlaceholder")}
                className={`w-full ${isHebrew ? "pr-10 pl-16" : "pl-10 pr-16"} py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base`}
                autoFocus
              />
              <button
                type="submit"
                className={`absolute inset-y-0 ${isHebrew ? "left-0 pl-3" : "right-0 pr-3"} flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium`}
                disabled={query.trim().length < 2}
              >
                {t("searchPage.searchButton")}
              </button>
            </div>
          </form>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{t("searchPage.searching")}</p>
          </div>
        )}

        {!isLoading && results && (
          <>
            <div className="mb-4 sm:mb-6">
              <p className="text-gray-600 text-sm sm:text-base">
                {getResultsMessage()}
              </p>
            </div>

            {results.total > 0 && (
              <div className="mb-4 sm:mb-6">
                {/* Mobile: Horizontal scrollable tabs */}
                <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
                  <div className="border-b border-gray-200 min-w-max sm:min-w-0">
                    <nav className="flex gap-1 sm:gap-2" aria-label="Tabs">
                      {tabs.map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`whitespace-nowrap py-2 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                            activeTab === tab.id
                              ? "border-blue-500 text-blue-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {tab.label}
                          {tab.count > 0 && (
                            <span
                              className={`ms-1.5 sm:ms-2 py-0.5 px-1.5 sm:px-2 rounded-full text-[10px] sm:text-xs ${
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
              </div>
            )}

            {results.total > 0 && (
              <div className="space-y-3 sm:space-y-4">
                {filteredResults.map((result) => (
                  <div
                    key={`${result.type}-${result.id}`}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleResultClick(result, result.type)}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex-shrink-0 text-blue-600">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 sm:truncate">
                              {result.title}
                            </h3>
                            <p className="mt-1.5 sm:mt-2 text-gray-600 line-clamp-2 text-xs sm:text-sm">
                              {result.description
                                ? stripHtml(result.description)
                                : result.content
                                  ? stripHtml(result.content).substring(
                                      0,
                                      200
                                    ) + "..."
                                  : t("searchPage.noDescription")}
                            </p>
                            <div className="mt-2 sm:mt-3 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-500">
                              {result.category && (
                                <span className="bg-gray-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                                  {result.category.name}
                                </span>
                              )}
                              {(result.eventDate || result.date) && (
                                <span className="bg-gray-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                                  {new Date(
                                    result.eventDate || result.date!
                                  ).toLocaleDateString(
                                    isHebrew ? "he-IL" : "en-US"
                                  )}
                                </span>
                              )}
                              {result.location && (
                                <span className="bg-gray-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded truncate max-w-[120px] sm:max-w-[150px]">
                                  {result.location}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 self-start">
                            <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-blue-50 text-blue-700 capitalize whitespace-nowrap">
                              {t(`searchPage.tabs.${result.type}`)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.total === 0 && !isLoading && (
              <div className="text-center py-12">
                <MdSearch className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("searchPage.noResultsTitle")}
                </h3>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">
                  {t("searchPage.noResultsMessage")}
                </p>
                <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                  <Link
                    href="/articles"
                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {t("searchPage.browseArticles")}
                  </Link>
                  <Link
                    href="/presentations"
                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {t("searchPage.browsePresentations")}
                  </Link>
                  <Link
                    href="/events"
                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {t("searchPage.browseEvents")}
                  </Link>
                  <Link
                    href="/lectures"
                    className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    {t("searchPage.browseLectures")}
                  </Link>
                </div>
              </div>
            )}
          </>
        )}

        {!isLoading && !results && (
          <div className="text-center py-12">
            <MdSearch className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t("searchPage.searchOurContent")}
            </h3>
            <p className="text-gray-600 text-sm sm:text-base">
              {t("searchPage.enterSearchTerm")}
            </p>
          </div>
        )}

        <ArticleModal article={selectedArticle} onClose={closeModals} />
        <PresentationModal
          presentation={selectedPresentation}
          onClose={closeModals}
        />
        <EventModal event={selectedEvent} onClose={closeModals} />
        <LectureModal lecture={selectedLecture} onClose={closeModals} />
      </div>
    </div>
  );
}

function SearchPageFallback() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageFallback />}>
      <SearchPageContent />
    </Suspense>
  );
}
