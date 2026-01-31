"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import { useAIChat } from "@/hooks/useAIChat";
import CategoryManager from "@/components/Category/CategoryManager";
import QuickStats from "@/components/QuickStats/QuickStats";
import QuickActions from "@/components/QuickActions/QuickActions";
import ActivityFeed from "@/components/ActivityFeed/ActivityFeed";
import Modal from "@/components/Modal/Modal";
import ArticlesAdmin from "./ArticlesAdmin";
import EventsAdmin from "./EventsAdmin";
import LecturesAdmin from "./LecturesAdmin";
import PresentationsAdmin from "./PresentationsAdmin";
import MessagesAdmin from "./MessagesAdmin";
import NotificationsAdmin from "./NotificationsAdmin";
import SubscriptionsAdmin from "./SubscriptionsAdmin";
import SettingsAdmin from "./SettingsAdmin";
import HomeAdmin from "./HomeAdmin";
import AboutAdmin from "./AboutAdmin";
import DevMetrics from "@/components/DevMetrics/DevMetrics";
import {
  User,
  Home,
  UserCircle,
  FolderTree,
  FileText,
  CalendarDays,
  Video,
  Presentation,
  MessageSquare,
  Bell,
  CreditCard,
  Settings,
  BarChart3,
  LucideIcon,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  Send,
  Bot,
  Loader2,
  X,
} from "lucide-react";
import Link from "next/link";
import { TabKey, TABS } from "@/constants/ElitzurTabs";

const iconMap: Record<string, LucideIcon> = {
  User,
  Home,
  UserCircle,
  FolderTree,
  FileText,
  CalendarDays,
  Video,
  Presentation,
  MessageSquare,
  Bell,
  CreditCard,
  Settings,
  BarChart3,
};

export default function ElitzurDashboard() {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  const [active, setActive] = useState<TabKey>("user");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const tabs = useMemo(() => TABS.filter((tab) => !tab.disabled), []);

  // AI Chat hook
  const {
    messages: aiMessages,
    isLoading: aiLoading,
    inputValue: aiInput,
    setInputValue: setAiInput,
    handleSubmit: handleAiSubmit,
    messagesEndRef,
  } = useAIChat({ isAdmin: true, locale });

  const aiChatRef = useRef<HTMLDivElement>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScrollArrows = () => {
    const container = tabsContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setShowRightArrow(scrollLeft > 0);
    setShowLeftArrow(scrollLeft < scrollWidth - clientWidth - 1);
  };

  useEffect(() => {
    checkScrollArrows();
    window.addEventListener("resize", checkScrollArrows);
    return () => window.removeEventListener("resize", checkScrollArrows);
  }, []);

  // Close AI chat on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showAiChat &&
        aiChatRef.current &&
        !aiChatRef.current.contains(event.target as Node)
      ) {
        setShowAiChat(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAiChat]);

  // Show chat panel when messages arrive
  useEffect(() => {
    if (aiMessages.length > 0) {
      setShowAiChat(true);
    }
  }, [aiMessages.length]);

  const scroll = (direction: "left" | "right") => {
    const container = tabsContainerRef.current;
    if (!container) return;
    const scrollAmount = 150;
    container.scrollBy({
      left: direction === "left" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  const renderMessageContent = (content: string) => {
    const pathRegex = /(\/[a-z-]+(?:\/[a-z-]+)*)/gi;
    const parts = content.split(pathRegex);
    return parts.map((part, index) => {
      if (part.match(/^\/[a-z-]+/i)) {
        return (
          <Link
            key={index}
            href={part}
            onClick={() => setShowAiChat(false)}
            className="text-blue-500 hover:text-blue-600 underline font-medium"
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  const placeholderText =
    locale === "he"
      ? "שלום פרופסור, כיצד אוכל לסייע לך היום?"
      : "Hello Professor, how can I assist you today?";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title={t("admin.logout.confirmTitle")}
        message={t("admin.logout.confirmMessage")}
        showCancel
        cancelText={t("admin.logout.cancel")}
        confirmText={t("admin.logout.confirm")}
        onConfirm={handleLogout}
      />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 h-14">
            {/* AI Assistant Input */}
            <div className="relative flex-1 max-w-xl" ref={aiChatRef}>
              <form onSubmit={handleAiSubmit} className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                </div>
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onFocus={() => aiMessages.length > 0 && setShowAiChat(true)}
                  placeholder={placeholderText}
                  className="w-full py-2 ps-10 pe-10 text-sm rounded-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiInput.trim()}
                  className="absolute inset-y-0 end-0 flex items-center pe-3 text-purple-500 hover:text-purple-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {aiLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>

              {/* AI Chat Panel */}
              {showAiChat && aiMessages.length > 0 && (
                <div className="absolute top-full mt-2 start-0 w-full sm:w-96 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {t("settings.aiAssistant.title")}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAiChat(false)}
                      className="p-1 rounded hover:bg-white/20 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-3 space-y-3 bg-gray-50 dark:bg-gray-900">
                    {aiMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.role === "assistant" && (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                            message.role === "user"
                              ? "bg-blue-500 text-white"
                              : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium border border-gray-200 dark:border-gray-700"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">
                            {message.role === "assistant"
                              ? renderMessageContent(message.content)
                              : message.content}
                          </p>
                        </div>
                      </div>
                    ))}
                    {aiLoading && (
                      <div className="flex gap-2 justify-start">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-3 h-3 text-white" />
                        </div>
                        <div className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              )}
            </div>

            {/* User Section */}
            {session && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-medium shadow-sm">
                  {session.user?.email?.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block max-w-[200px] truncate">
                  {session.user?.email}
                </span>
                <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 hidden sm:block" />
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                  title={t("admin.nav.logout")}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {t("admin.nav.logout")}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="relative border-t border-gray-100 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="relative flex items-center">
              {/* Right scroll arrow */}
              {showRightArrow && (
                <button
                  onClick={() => scroll("right")}
                  className="absolute right-0 z-10 flex items-center justify-center w-8 h-8 my-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                </button>
              )}

              {/* Tabs container */}
              <div
                ref={tabsContainerRef}
                onScroll={checkScrollArrows}
                className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2 scroll-smooth px-10"
                role="tablist"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {tabs.map((tab) => {
                  const isActive = active === tab.key;
                  const IconComponent = iconMap[tab.icon];
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActive(tab.key)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                      }`}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`panel-${tab.key}`}
                      id={`tab-${tab.key}`}
                    >
                      {IconComponent && (
                        <IconComponent className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span>{t(`admin.nav.${tab.key}`)}</span>
                    </button>
                  );
                })}
              </div>

              {/* Left scroll arrow */}
              {showLeftArrow && (
                <button
                  onClick={() => scroll("left")}
                  className="absolute left-0 z-10 flex items-center justify-center w-8 h-8 my-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div
          role="tabpanel"
          aria-labelledby={`tab-${active}`}
          id={`panel-${active}`}
        >
          {active === "user" && (
            <div className="space-y-6">
              <QuickStats />
              <QuickActions />
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {t("admin.nav.recentActivity")}
                </h3>
                <ActivityFeed />
              </div>
            </div>
          )}

          {active === "home" && <HomeAdmin />}

          {active === "about" && <AboutAdmin />}

          {active === "categories" && <CategoryManager />}

          {active === "articles" && <ArticlesAdmin />}

          {active === "events" && <EventsAdmin />}

          {active === "lectures" && <LecturesAdmin />}

          {active === "presentations" && <PresentationsAdmin />}

          {active === "messages" && <MessagesAdmin />}

          {active === "notifications" && <NotificationsAdmin />}

          {active === "subscriptions" && <SubscriptionsAdmin />}

          {active === "settings" && <SettingsAdmin />}

          {active === "devMetrics" && <DevMetrics />}
        </div>
      </main>
    </div>
  );
}
