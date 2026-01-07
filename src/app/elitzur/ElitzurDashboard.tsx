"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTranslation } from "@/contexts/Translation/translation.context";
import CategoryManager from "@/components/Category/CategoryManager";
import QuickStats from "@/components/QuickStats/QuickStats";
import QuickActions from "@/components/QuickActions/QuickActions";
import ActivityFeed from "@/components/ActivityFeed/ActivityFeed";
import ArticlesAdmin from "./ArticlesAdmin";
import EventsAdmin from "./EventsAdmin";
import LecturesAdmin from "./LecturesAdmin";
import PresentationsAdmin from "./PresentationsAdmin";
import MessagesAdmin from "./MessagesAdmin";
import SettingsAdmin from "./SettingsAdmin";
import HomeAdmin from "./HomeAdmin";
import {
  User,
  Home,
  FolderTree,
  FileText,
  CalendarDays,
  Video,
  Presentation,
  MessageSquare,
  Settings,
  LucideIcon,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { TabKey, TABS } from "@/constants/ElitzurTabs";

const iconMap: Record<string, LucideIcon> = {
  User,
  Home,
  FolderTree,
  FileText,
  CalendarDays,
  Video,
  Presentation,
  MessageSquare,
  Settings,
};

export default function ElitzurDashboard() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [active, setActive] = useState<TabKey>("user");
  const tabs = useMemo(() => TABS.filter((tab) => !tab.disabled), []);

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

  const scroll = (direction: "left" | "right") => {
    const container = tabsContainerRef.current;
    if (!container) return;
    const scrollAmount = 150;
    container.scrollBy({
      left: direction === "left" ? scrollAmount : -scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <h1 className="text-lg font-semibold text-gray-900">{t("admin.nav.title")}</h1>
            {session && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 hidden sm:block">
                  {session.user?.email}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("admin.nav.logout")}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="relative border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="relative flex items-center">
              {/* Right scroll arrow (RTL - scrolls content left) */}
              {showRightArrow && (
                <button
                  onClick={() => scroll("right")}
                  className="absolute right-0 z-10 h-full px-2 bg-gradient-to-l from-white via-white to-transparent flex items-center"
                  aria-label="גלול ימינה"
                >
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              )}

              {/* Tabs container */}
              <div
                ref={tabsContainerRef}
                onScroll={checkScrollArrows}
                className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2 scroll-smooth"
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
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                        isActive
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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

              {/* Left scroll arrow (RTL - scrolls content right) */}
              {showLeftArrow && (
                <button
                  onClick={() => scroll("left")}
                  className="absolute left-0 z-10 h-full px-2 bg-gradient-to-r from-white via-white to-transparent flex items-center"
                  aria-label="גלול שמאלה"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-400" />
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
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t("admin.nav.recentActivity")}
                </h3>
                <ActivityFeed />
              </div>
            </div>
          )}

          {active === "home" && <HomeAdmin />}

          {active === "categories" && <CategoryManager />}

          {active === "articles" && <ArticlesAdmin />}

          {active === "events" && <EventsAdmin />}

          {active === "lectures" && <LecturesAdmin />}

          {active === "presentations" && <PresentationsAdmin />}

          {active === "messages" && <MessagesAdmin />}

          {active === "settings" && <SettingsAdmin />}
        </div>
      </main>
    </div>
  );
}
