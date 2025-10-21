"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import LoginForm from "@/components/Login/login";
import CategoryManager from "@/components/Category/CategoryManager";
import SignOutButton from "@/components/Auth/SignOutButton";

type TabKey = "user" | "categories" | "themes";

const TABS: { key: TabKey; label: string; disabled?: boolean }[] = [
  { key: "user", label: "User" },
  { key: "categories", label: "Categories" },
  { key: "themes", label: "Themes", disabled: true },
];

export default function ElitzurDashboard() {
  const { data: session } = useSession();
  const [active, setActive] = useState<TabKey>("user");

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <aside className="w-60 shrink-0">
        <div className="sticky top-20 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">Navigation</h2>
            <nav className="mt-2 space-y-2">
              {TABS.map((tab) => {
                const isActive = active === tab.key;
                const isDisabled = !!tab.disabled;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => !isDisabled && setActive(tab.key)}
                    className={[
                      "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition",
                      isActive
                        ? "bg-blue-600 text-white shadow"
                        : "text-gray-700 hover:bg-gray-100",
                      isDisabled ? "opacity-50 cursor-not-allowed" : "",
                    ].join(" ")}
                    aria-disabled={isDisabled}
                  >
                    {tab.label}
                    {isDisabled && (
                      <span className="ml-2 text-xs opacity-80">
                        (Coming soon)
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Session</h3>
            <div className="mt-2">
              {session ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600">
                    Signed in as{" "}
                    <span className="font-medium text-gray-900">
                      {session.user?.email || session.user?.name || "user"}
                    </span>
                  </p>
                  <SignOutButton />
                </div>
              ) : (
                <p className="text-xs text-gray-600">Not signed in</p>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <section className="flex-1">
        {active === "user" && (
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              User
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to access administration features.
            </p>
            <div className="mt-6">
              <LoginForm />
            </div>
          </div>
        )}

        {active === "categories" && (
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Category Management
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Create, edit and delete categories.
            </p>
            <div className="mt-6">
              {session ? (
                <CategoryManager />
              ) : (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
                  You must sign in to manage categories.
                  <div className="mt-4">
                    <LoginForm />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {active === "themes" && (
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Themes
            </h1>
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-700">
                Theme management is not implemented yet. Coming soon.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
