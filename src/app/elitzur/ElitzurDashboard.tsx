"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import LoginForm from "@/components/Login/login";
import CategoryManager from "@/components/Category/CategoryManager";
import SignOutButton from "@/components/Auth/SignOutButton";
import Clock from "@/components/Clock/Clock";
import Weather from "@/components/Weather/Weather";
import QuickStats from "@/components/QuickStats/QuickStats";
import ActivityFeed from "@/components/ActivityFeed/ActivityFeed";
import QuickActions from "@/components/QuickActions/QuickActions";
import SystemHealth from "@/components/SystemHealth/SystemHealth";
import MotivationalQuote from "@/components/MotivationalQuote/MotivationalQuote";
import ThemeToggle from "@/components/ThemeToggle";
import ArticlesAdmin from "./ArticlesAdmin";
import EventsAdmin from "./EventsAdmin";
import LecturesAdmin from "./LecturesAdmin";
import PresentationsAdmin from "./PresentationsAdmin";
import MessagesAdmin from "./MessagesAdmin";
import SettingsAdmin from "./SettingsAdmin";
import { Menu, X } from "lucide-react";

type TabKey =
  | "user"
  | "categories"
  | "articles"
  | "events"
  | "lectures"
  | "presentations"
  | "messages"
  | "settings"
  | "themes";

const TABS: { key: TabKey; label: string; disabled?: boolean }[] = [
  { key: "user", label: "החשבון שלך" },
  { key: "categories", label: "קטגוריות" },
  { key: "articles", label: "מאמרים" },
  { key: "events", label: "אירועים" },
  { key: "lectures", label: "הרצאות" },
  { key: "presentations", label: "מצגות" },
  { key: "messages", label: "הודעות" },
  { key: "settings", label: "הגדרות מערכת" },
  { key: "themes", label: "ערכות נושא" },
];

export default function ElitzurDashboard() {
  const { data: session } = useSession();
  const [active, setActive] = useState<TabKey>("user");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex gap-6">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-lg border border-gray-200"
        aria-label="Toggle navigation menu"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`w-60 shrink-0 fixed md:relative top-0 left-0 h-full z-40 bg-white md:bg-transparent border-r md:border-r-0 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        role="complementary"
        aria-label="Dashboard navigation"
      >
        <div className="sticky top-20 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2
              className="text-sm font-semibold text-gray-900"
              id="navigation-heading"
            >
              ניווט
            </h2>
            <nav
              className="mt-2 space-y-2"
              role="tablist"
              aria-labelledby="navigation-heading"
            >
              {TABS.map((tab) => {
                const isActive = active === tab.key;
                const isDisabled = !!tab.disabled;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      !isDisabled && setActive(tab.key);
                      setSidebarOpen(false); // Close sidebar on mobile after selection
                    }}
                    className={[
                      "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition focus:outline-2 focus:outline-blue-500 focus:outline-offset-2",
                      isActive
                        ? "bg-blue-600 text-white shadow"
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
                    {tab.label}
                    {isDisabled && (
                      <span
                        className="ml-2 text-xs opacity-80"
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

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Content */}
      <section
        className="flex-1 overflow-hidden md:ml-0"
        role="tabpanel"
        aria-labelledby={`tab-${active}`}
        id={`panel-${active}`}
      >
        {active === "user" && (
          <div className="space-y-8 max-w-full">
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
              <div className="mt-6">
                <LoginForm />
              </div>
            </div>

            {session && (
              <div className="space-y-8">
                {/* Quick Stats - Full Width */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    סקירה מהירה
                  </h2>
                  <QuickStats />
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  {/* System & Environment Panel */}
                  <div className="space-y-6">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        שעה ומזג אוויר
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Clock />
                        </div>
                        <div>
                          <Weather />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        מצב המערכת
                      </h3>
                      <SystemHealth />
                    </div>
                  </div>

                  {/* Activity & Motivation Panel */}
                  <div className="space-y-6">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        פעילות אחרונה
                      </h3>
                      <ActivityFeed />
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        מוטיבציה יומית
                      </h3>
                      <MotivationalQuote />
                    </div>
                  </div>
                </div>
              </div>
            )}
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
            <h1
              className="text-2xl md:text-3xl font-bold text-gray-900"
              id="settings-heading"
            >
              הגדרות
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              נהל הגדרות כלליות של האתר.
            </p>
            <div className="mt-6">
              <SettingsAdmin />
            </div>
          </div>
        )}

        {active === "themes" && (
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold text-gray-900"
              id="themes-heading"
            >
              ניהול ערכות נושא
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              התאם את המראה של האתר להעדפותיך.
            </p>
            <div className="mt-6">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  מצב תצוגה
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    החלף בין מצב בהיר וכהה
                  </span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
