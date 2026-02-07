"use client";

import { navItems } from "@/constants/Nav/data";
import { useTranslation } from "@/contexts/Translation/translation.context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import GlobalSearch from "../GlobalSearch";
import SettingsPanel from "../Settings/SettingsPanel";
import AIAssistantPanel from "./AIAssistantPanel";
import {
  MdMenu,
  MdClose,
  MdPerson,
  MdSettings,
  MdLogout,
  MdLogin,
  MdAdminPanelSettings,
  MdLanguage,
} from "react-icons/md";
import { Bot } from "lucide-react";
import { signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();
  const { t, locale, setLocale } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [aiAssistantOpen, setAIAssistantOpen] = useState<boolean>(false);
  const pathname = usePathname();
  const mobileMenuRef = useRef<HTMLElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  const isAdmin = session?.user?.role === "ADMIN";
  const isRTL = locale === "he";

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Profile menu
      if (
        profileMenuOpen &&
        profileMenuRef.current &&
        profileButtonRef.current &&
        !profileMenuRef.current.contains(event.target as Node) &&
        !profileButtonRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }

      // Mobile menu
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        mobileButtonRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        !mobileButtonRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen, profileMenuOpen]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Hide header on auth pages
  if (pathname?.startsWith("/auth")) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const toggleLanguage = () => {
    setLocale(locale === "he" ? "en" : "he");
  };

  return (
    <>
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        {t("header.skipToContent")}
      </a>

      <header
        className="fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-950 backdrop-blur-sm shadow-sm px-4 py-3"
        role="banner"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex-shrink-0 text-xl sm:text-2xl font-extrabold tracking-tight hover:scale-105 transition-transform duration-200 text-gray-900 dark:text-white"
            aria-label={t("header.brandAriaLabel")}
          >
            {t("header.brandName")}
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center gap-1 flex-1 justify-center"
            role="navigation"
            aria-label={t("header.mainNavigation")}
          >
            {navItems.map(({ label, href }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {t(label)}
                </Link>
              );
            })}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Search - Desktop only */}
            <div className="hidden lg:block">
              <GlobalSearch />
            </div>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={t("settings.language")}
              title={t("settings.language")}
            >
              <MdLanguage size={18} />
              <span>{locale === "he" ? "ריתעב" : "English"}</span>
            </button>

            {/* Profile/Menu Button */}
            <div className="relative hidden md:block">
              <button
                ref={profileButtonRef}
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label={session ? t("header.myAccount") : t("header.menu")}
                aria-expanded={profileMenuOpen}
              >
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-7 h-7 rounded-full"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {session?.user?.name?.charAt(0)?.toUpperCase() || (
                      <MdPerson size={18} />
                    )}
                  </div>
                )}
              </button>

              {/* Dropdown Menu */}
              {profileMenuOpen && (
                <div
                  ref={profileMenuRef}
                  className={`absolute ${isRTL ? "left-0" : "right-0"} mt-2 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 overflow-hidden z-[60]`}
                >
                  {/* User Info */}
                  {session && (
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {session.user?.name || session.user?.email}
                      </p>
                      {session.user?.name && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {session.user?.email}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Menu Items */}
                  <div className="py-1">
                    {session ? (
                      <>
                        <Link
                          href="/account"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          <MdPerson size={18} />
                          {t("header.myAccount")}
                        </Link>

                        {isAdmin && (
                          <Link
                            href="/elitzur"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-medium"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            <MdAdminPanelSettings size={18} />
                            {t("header.adminSettings")}
                          </Link>
                        )}

                        <button
                          onClick={() => {
                            setAIAssistantOpen(true);
                            setProfileMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Bot size={18} />
                          {t("settings.aiAssistant.title")}
                        </button>

                        <button
                          onClick={() => {
                            setSettingsOpen(true);
                            setProfileMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <MdSettings size={18} />
                          {t("settings.title")}
                        </button>

                        <div className="border-t border-gray-200 dark:border-gray-700 my-1" />

                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <MdLogout size={18} />
                          {t("header.logout")}
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/auth/login"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          onClick={() => setProfileMenuOpen(false)}
                        >
                          <MdLogin size={18} />
                          {t("header.login")}
                        </Link>

                        <button
                          onClick={() => {
                            setSettingsOpen(true);
                            setProfileMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                          <MdSettings size={18} />
                          {t("settings.title")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              ref={mobileButtonRef}
              className="md:hidden text-gray-700 dark:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={
                mobileMenuOpen
                  ? t("header.closeNavigationMenu")
                  : t("header.openNavigationMenu")
              }
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Navigation */}
      <nav
        ref={mobileMenuRef}
        className={`fixed top-[60px] left-0 right-0 z-50 md:hidden bg-white dark:bg-gray-950 shadow-xl border-t border-gray-100 dark:border-gray-800 transition-all duration-300 ease-out ${
          mobileMenuOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
        role="navigation"
        aria-label="Mobile navigation"
      >
        {/* Mobile Search */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <GlobalSearch />
        </div>

        {/* Navigation Links */}
        <ul className="flex flex-col p-3 space-y-1 max-h-[calc(100vh-240px)] overflow-y-auto">
          {navItems.map(({ label, href }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-colors ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                >
                  {t(label)}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mobile Actions */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <button
            onClick={toggleLanguage}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <MdLanguage size={20} />
            <span className="font-medium">
              {locale === "he" ? "Switch to English" : "עבור לעברית"}
            </span>
          </button>

          {session && (
            <>
              <Link
                href="/account"
                className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <MdPerson size={20} />
                <span className="font-medium">{t("header.myAccount")}</span>
              </Link>

              {isAdmin && (
                <Link
                  href="/elitzur"
                  className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <MdAdminPanelSettings size={20} />
                  <span>{t("header.adminSettings")}</span>
                </Link>
              )}

              <button
                onClick={() => {
                  setAIAssistantOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Bot size={20} />
                <span className="font-medium">
                  {t("settings.aiAssistant.title")}
                </span>
              </button>
            </>
          )}

          <button
            onClick={() => {
              setSettingsOpen(true);
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <MdSettings size={20} />
            <span className="font-medium">{t("settings.title")}</span>
          </button>

          {session ? (
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <MdLogout size={20} />
              <span className="font-medium">{t("header.logout")}</span>
            </button>
          ) : (
            <Link
              href="/auth/login"
              className="w-full flex items-center gap-3 py-3 px-4 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors font-semibold"
              onClick={() => setMobileMenuOpen(false)}
            >
              <MdLogin size={20} />
              <span>{t("header.login")}</span>
            </Link>
          )}
        </div>
      </nav>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* AI Assistant Panel */}
      <AIAssistantPanel
        isOpen={aiAssistantOpen}
        onClose={() => setAIAssistantOpen(false)}
      />
    </>
  );
}
