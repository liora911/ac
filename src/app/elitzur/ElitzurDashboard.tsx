"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import LoginForm from "@/components/Login/login";
import CategoryManager from "@/components/Category/CategoryManager";
import SignOutButton from "@/components/Auth/SignOutButton";
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
  Menu,
  X,
  User,
  Home,
  FolderTree,
  FileText,
  CalendarDays,
  Video,
  Presentation,
  MessageSquare,
  Palette,
  Settings,
  LucideIcon,
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
  Palette,
  Settings,
};

export default function ElitzurDashboard() {
  const { data: session } = useSession();
  const [active, setActive] = useState<TabKey>("user");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const tabs = useMemo(() => TABS, []);

  return (
    <div className="flex gap-6">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-lg border border-gray-200"
        aria-label="Toggle navigation menu"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={`w-60 shrink-0 fixed md:relative top-0 left-0 h-full z-40 bg-white md:bg-transparent border-r md:border-r-0 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        role="complementary"
        aria-label="Dashboard navigation"
      >
        <div className="sticky top-4 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <h2
              className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2"
              id="navigation-heading"
            >
              ניווט
            </h2>
            <nav
              className="space-y-1"
              role="tablist"
              aria-labelledby="navigation-heading"
            >
              {tabs.map((tab) => {
                const isActive = active === tab.key;
                const isDisabled = !!tab.disabled;
                const IconComponent = iconMap[tab.icon];
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      !isDisabled && setActive(tab.key);
                      setSidebarOpen(false);
                    }}
                    className={[
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all focus:outline-2 focus:outline-blue-500 focus:outline-offset-2",
                      isActive
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100",
                      isDisabled ? "opacity-50 cursor-not-allowed" : "",
                    ].join(" ")}
                    aria-disabled={isDisabled}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.key}`}
                    id={`tab-${tab.key}`}
                    tabIndex={isActive ? 0 : -1}
                  >
                    {IconComponent && (
                      <IconComponent
                        className={`w-4 h-4 flex-shrink-0 ${
                          isActive ? "text-white" : "text-gray-500"
                        }`}
                      />
                    )}
                    <span className="truncate">{tab.label}</span>
                    {isDisabled && (
                      <span
                        className="mr-auto text-xs opacity-80"
                        aria-label="Coming soon"
                      >
                        (בקרוב)
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">סשן</h3>
            <div className="mt-2">
              {session ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">
                    מחובר כ:{" "}
                    <span className="font-medium text-gray-900">
                      {session.user?.email || session.user?.name || "user"}
                    </span>
                  </p>
                  <SignOutButton />
                </div>
              ) : (
                <p className="text-xs text-gray-600">לא מחובר</p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <section
        className="flex-1 overflow-hidden md:ml-0"
        role="tabpanel"
        aria-labelledby={`tab-${active}`}
        id={`panel-${active}`}
      >
        {active === "user" && (
          <div className="space-y-8 max-w-5xl mx-auto px-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <h1
                  className="text-2xl md:text-3xl font-bold text-gray-900"
                  id="user-heading"
                >
                  משתמש
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  נהל את פרטי המשתמש שלך והתחבר או התנתק מהמערכת.
                </p>
              </div>
            </div>

            {!session && (
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">
                  התחברות למערכת
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  התחבר כדי לראות סטטיסטיקות ופעילות אחרונה בחשבון שלך.
                </p>
                <div className="mt-6">
                  <LoginForm />
                </div>
              </div>
            )}

            {session && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    סקירה מהירה
                  </h2>
                  <QuickStats />
                </div>

                {/* Quick Actions */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <QuickActions />
                </div>

                {/* Activity Feed */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    פעילות אחרונה
                  </h3>
                  <ActivityFeed />
                </div>
              </div>
            )}
          </div>
        )}

        {active === "home" && (
          <div>
            <HomeAdmin />
          </div>
        )}

        {active === "categories" && (
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold text-gray-900"
              id="categories-heading"
            >
              ניהול קטגוריות
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              צור, ערוך ומחק קטגוריות למאמרים באתר.
            </p>
            <div className="mt-6">
              {session ? (
                <CategoryManager />
              ) : (
                <div
                  className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800"
                  role="alert"
                >
                  <p>אנא התחבר כדי לנהל קטגוריות.</p>
                  <div className="mt-4">
                    <LoginForm />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {active === "articles" && (
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold text-gray-900"
              id="articles-heading"
            >
              מאמרים
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              יצירה, עריכה וניהול מאמרים באתר.
            </p>
            <div className="mt-6">
              <ArticlesAdmin />
            </div>
          </div>
        )}

        {active === "events" && (
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold text-gray-900"
              id="events-heading"
            >
              אירועים
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              צור, חפש, סנן ונהל אירועים.
            </p>
            <div className="mt-6">
              <EventsAdmin />
            </div>
          </div>
        )}

        {active === "lectures" && (
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold text-gray-900"
              id="lectures-heading"
            >
              הרצאות
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              צור, חפש, סנן ונהל הרצאות.
            </p>
            <div className="mt-6">
              <LecturesAdmin />
            </div>
          </div>
        )}

        {active === "presentations" && (
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold text-gray-900"
              id="presentations-heading"
            >
              מצגות
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              צור, חפש, סנן ונהל מצגות.
            </p>
            <div className="mt-6">
              <PresentationsAdmin />
            </div>
          </div>
        )}

        {active === "messages" && (
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold text-gray-900"
              id="messages-heading"
            >
              הודעות
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              צפה ונהל הודעות מיצירת קשר.
            </p>
            <div className="mt-6">
              <MessagesAdmin />
            </div>
          </div>
        )}

        {active === "settings" && (
          <div>
            <SettingsAdmin />
          </div>
        )}

      </section>
    </div>
  );
}
