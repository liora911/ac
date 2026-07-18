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
import CommentsAdmin from "./CommentsAdmin";
import NotificationsAdmin from "./NotificationsAdmin";
import NewsletterAdmin from "./NewsletterAdmin";
import SubscriptionsAdmin from "./SubscriptionsAdmin";
import SettingsAdmin from "./SettingsAdmin";
import HomeAdmin from "./HomeAdmin";
import AboutAdmin from "./AboutAdmin";
import PdfEditorAdmin from "./PdfEditorAdmin";
import SketchBoardAdmin from "./SketchBoardAdmin";
import GuestsAdmin from "./GuestsAdmin";
import IdeasAdmin from "./IdeasAdmin";
import CalendarAdmin from "./CalendarAdmin";
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
  MessageCircle,
  Bell,
  CreditCard,
  Settings,
  BarChart3,
  LayoutDashboard,
  BookOpen,
  Users,
  Wrench,
  Hammer,
  PenTool,
  Brush,
  Lightbulb,
  LucideIcon,
  LogOut,
  Sparkles,
  Send,
  Bot,
  Loader2,
  X,
  Mail,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { TabKey, TABS, TAB_GROUPS } from "@/constants/ElitzurTabs";

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
  MessageCircle,
  Bell,
  CreditCard,
  Settings,
  BarChart3,
  LayoutDashboard,
  BookOpen,
  Users,
  Wrench,
  Hammer,
  PenTool,
  Brush,
  Lightbulb,
  Mail,
};

export default function ElitzurDashboard() {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();
  const [active, setActive] = useState<TabKey>("user");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Remember the collapsed preference across visits
  useEffect(() => {
    setCollapsed(localStorage.getItem("elitzur-sidebar-collapsed") === "1");
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("elitzur-sidebar-collapsed", next ? "1" : "0");
      } catch {
        // storage unavailable — preference just won't persist
      }
      return next;
    });
  };
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const validKeys = useMemo(() => new Set(TABS.map((tab) => tab.key)), []);

  // Restore the active tab from the URL so refresh/bookmarks keep your place
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("tab");
    if (param && validKeys.has(param as TabKey)) {
      setActive(param as TabKey);
    }
  }, [validKeys]);

  const handleTabClick = (tabKey: TabKey) => {
    setActive(tabKey);
    setSidebarOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tabKey);
    window.history.replaceState(null, "", url.toString());
  };

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
        <div className="w-full px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 h-14">
            {/* Mobile sidebar toggle */}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              aria-label={t("admin.nav.title")}
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* AI Assistant Input — the header's main element */}
            <div className="relative flex-1 max-w-2xl" ref={aiChatRef}>
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
                  className="w-full py-2.5 ps-10 pe-10 text-sm rounded-xl border-2 border-purple-200 dark:border-purple-800/70 bg-white dark:bg-gray-900 shadow-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href="/"
                  className="p-2.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title={t("admin.nav.backToSite")}
                  aria-label={t("admin.nav.backToSite")}
                >
                  <Home className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-2 ps-2 border-s border-gray-200 dark:border-gray-600">
                  <div
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm"
                    title={session.user?.email ?? undefined}
                  >
                    {session.user?.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[180px] truncate">
                    {session.user?.email}
                  </span>
                </div>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                  title={t("admin.nav.logout")}
                  aria-label={t("admin.nav.logout")}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden sm:inline">
                    {t("admin.nav.logout")}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

      </header>

      {/* Sidebar + Main Content */}
      <div className="w-full px-4 sm:px-6 py-6">
        <div className="flex items-start gap-6">
          {/* Desktop sidebar — every section visible at once, stable positions.
              Collapses to an icon rail; content reflows into the freed width */}
          <aside
            className={`hidden lg:flex lg:flex-col flex-shrink-0 sticky top-20 max-h-[calc(100vh-6rem)] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-all duration-300 ease-in-out ${
              collapsed ? "w-[4.25rem] p-2" : "w-60 p-3"
            }`}
          >
            <button
              type="button"
              onClick={toggleCollapsed}
              title={
                collapsed ? t("admin.nav.expandMenu") : t("admin.nav.collapseMenu")
              }
              aria-label={
                collapsed ? t("admin.nav.expandMenu") : t("admin.nav.collapseMenu")
              }
              aria-expanded={!collapsed}
              className={`mb-2 p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer ${
                collapsed ? "self-center" : "self-end"
              }`}
            >
              {collapsed ? (
                <PanelLeftOpen className="w-4 h-4 rtl:rotate-180" />
              ) : (
                <PanelLeftClose className="w-4 h-4 rtl:rotate-180" />
              )}
            </button>
            {/* Only the nav list scrolls — the collapse button above stays pinned */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
              <SidebarNav
                active={active}
                onSelect={handleTabClick}
                t={t}
                collapsed={collapsed}
              />
            </div>
          </aside>

          {/* Mobile drawer */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setSidebarOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute inset-y-0 start-0 w-72 max-w-[85vw] bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t("admin.nav.title")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    aria-label={t("dictation.close")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <SidebarNav active={active} onSelect={handleTabClick} t={t} />
              </div>
            </div>
          )}

          <main className="flex-1 min-w-0">
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

          {active === "comments" && <CommentsAdmin />}

          {active === "messages" && <MessagesAdmin />}

          {active === "notifications" && <NotificationsAdmin />}

          {active === "newsletter" && <NewsletterAdmin />}

          {active === "subscriptions" && <SubscriptionsAdmin />}

          {active === "settings" && <SettingsAdmin />}

          {active === "devMetrics" && <DevMetrics />}

          {active === "pdfEditor" && <PdfEditorAdmin />}

          {active === "sketchBoard" && <SketchBoardAdmin />}

          {active === "guests" && <GuestsAdmin />}

          {active === "ideas" && <IdeasAdmin />}

          {active === "calendar" && <CalendarAdmin />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function SidebarNav({
  active,
  onSelect,
  t,
  collapsed = false,
}: {
  active: TabKey;
  onSelect: (key: TabKey) => void;
  t: (key: string) => string;
  collapsed?: boolean;
}) {
  // Per-group fold state, remembered across visits. Default: all open.
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem("elitzur-sidebar-groups");
      if (raw) setClosedGroups(JSON.parse(raw));
    } catch {
      // corrupt entry — all groups just start open
    }
  }, []);
  const toggleGroup = (labelKey: string) => {
    setClosedGroups((prev) => {
      const next = { ...prev, [labelKey]: !prev[labelKey] };
      try {
        localStorage.setItem("elitzur-sidebar-groups", JSON.stringify(next));
      } catch {
        // storage unavailable — state just won't persist
      }
      return next;
    });
  };

  return (
    <nav role="tablist" aria-orientation="vertical">
      {TAB_GROUPS.map((group, gi) => {
        const GroupIcon = iconMap[group.icon];
        // A closed group still shows the active tab so it never "disappears"
        const isClosed =
          !collapsed &&
          !!closedGroups[group.labelKey] &&
          !group.tabs.some((tab) => tab.key === active);
        return (
        <div key={group.labelKey} className={collapsed ? "mb-1" : "mb-3 last:mb-0"}>
          {collapsed ? (
            gi > 0 && (
              <div className="mx-2 my-2 h-px bg-gray-200 dark:bg-gray-700" />
            )
          ) : (
            <button
              type="button"
              onClick={() => toggleGroup(group.labelKey)}
              aria-expanded={!isClosed}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 mb-0.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${
                  isClosed ? "-rotate-90 rtl:rotate-90" : ""
                }`}
              />
              <span className="flex-1 text-start">{t(group.labelKey)}</span>
              {GroupIcon && <GroupIcon className="w-3.5 h-3.5 flex-shrink-0" />}
            </button>
          )}
          {!isClosed && (
          <ul className="space-y-0.5">
            {group.tabs
              .filter((tab) => !tab.disabled)
              .map((tab) => {
                const isActive = active === tab.key;
                const IconComponent = iconMap[tab.icon];
                const label = t(`admin.nav.${tab.key}`);
                return (
                  <li key={tab.key}>
                    <button
                      type="button"
                      onClick={() => onSelect(tab.key)}
                      title={label}
                      className={`w-full flex items-center py-2.5 rounded-lg text-sm font-medium text-start transition-colors cursor-pointer ${
                        collapsed ? "justify-center px-0" : "gap-2.5 px-3"
                      } ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                      }`}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`panel-${tab.key}`}
                      id={`tab-${tab.key}`}
                      aria-label={label}
                    >
                      {IconComponent && (
                        <IconComponent className="w-4 h-4 flex-shrink-0" />
                      )}
                      {!collapsed && <span className="truncate">{label}</span>}
                    </button>
                  </li>
                );
              })}
          </ul>
          )}
        </div>
        );
      })}
    </nav>
  );
}
