"use client";

import { navItems } from "@/constants/Nav/data";
import { useTranslation } from "@/contexts/Translation/translation.context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SettingsButton } from "../Settings";
import { AIAssistantButton } from "../AIAssistant";
import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import GlobalSearch from "../GlobalSearch";
import {
  MdArticle,
  MdOutlineOndemandVideo,
  MdMic,
  MdContactMail,
  MdEvent,
  MdOnlinePrediction,
  MdMenu,
  MdClose,
  MdPerson,
  MdSearch,
} from "react-icons/md";

const IconMap: { [key: string]: React.ElementType } = {
  ArticleIcon: MdArticle,
  PresentationIcon: MdOutlineOndemandVideo,
  LectureIcon: MdMic,
  ContactIcon: MdContactMail,
  EventIcon: MdEvent,
  OnlineEventIcon: MdOnlinePrediction,
  PersonIcon: MdPerson,
  MdSearch: MdSearch,
};

export default function Header() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuOpen &&
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const visibleNavItems = [
    ...navItems,
    ...(session
      ? [
          {
            label: "header.adminSettings",
            href: "/elitzur",
            className: "text-red-600 font-semibold",
            icon: "PersonIcon",
          },
        ]
      : []),
  ];

  // Hide header on auth pages
  if (pathname?.startsWith("/auth")) {
    return null;
  }

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 w-full border-b border-gray-200 dark:border-gray-700/80 bg-white dark:bg-gray-950 backdrop-blur-sm shadow-lg dark:shadow-black/30 px-4 py-3 sm:py-4"
        role="banner"
      >
        <div className="flex flex-nowrap items-center justify-between gap-2 sm:gap-4 min-w-0">
          <Link
            href="/"
            className="flex-shrink min-w-0 max-w-[80%] text-lg sm:text-2xl font-extrabold tracking-tight cursor-pointer hover:scale-105 transition-transform duration-200 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2 whitespace-normal leading-tight"
            style={{
              background: "linear-gradient(135deg, #007bff 0%, #6610f2 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
            aria-label={t("header.brandAriaLabel")}
          >
            Avshalom C. Elitzur
          </Link>
          <nav
            className="hidden md:flex items-center gap-1 text-sm font-medium"
            role="navigation"
            aria-label={t("header.mainNavigation")}
          >
            {visibleNavItems.map(({ label, href, className, icon }) => {
              const IconComponent = icon ? IconMap[icon] : null;
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2 ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold"
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  } ${className || ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {IconComponent && (
                    <IconComponent size={18} aria-hidden="true" />
                  )}
                  {t(label)}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:block">
              <GlobalSearch />
            </div>
            <div className="relative shrink-0">
              <AIAssistantButton />
            </div>
            <div className="relative shrink-0">
              <SettingsButton />
            </div>
            <button
              ref={buttonRef}
              className="md:hidden text-gray-700 dark:text-gray-200 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2 cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={
                menuOpen
                  ? t("header.closeNavigationMenu")
                  : t("header.openNavigationMenu")
              }
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
            >
              <div className="relative w-6 h-6">
                <MdMenu
                  size={24}
                  className={`absolute inset-0 transition-all duration-300 ${
                    menuOpen ? "opacity-0 rotate-90" : "opacity-100 rotate-0"
                  }`}
                  aria-hidden="true"
                />
                <MdClose
                  size={24}
                  className={`absolute inset-0 transition-all duration-300 ${
                    menuOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"
                  }`}
                  aria-hidden="true"
                />
              </div>
            </button>
          </div>
        </div>
      </header>
      {/* Mobile Menu Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${
          menuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Navigation */}
      <nav
        ref={menuRef}
        className={`fixed top-[60px] left-0 right-0 z-50 md:hidden bg-white dark:bg-gray-950 shadow-xl dark:shadow-black/30 border-t border-gray-100 dark:border-gray-800 transition-all duration-300 ease-out ${
          menuOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
        role="navigation"
        aria-label="Mobile navigation"
        id="mobile-navigation"
      >
        {/* Mobile Search Bar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <GlobalSearch />
        </div>

        <ul className="flex flex-col p-3 space-y-1 max-h-[calc(100vh-180px)] overflow-y-auto" role="menubar">
          {visibleNavItems.map(({ label, href, className, icon }) => {
            const IconComponent = icon ? IconMap[icon] : null;
            const isActive = pathname === href;
            return (
              <li key={href} role="none">
                <Link
                  href={href}
                  className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-colors duration-200 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2 ${
                    className || ""
                  } ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700"
                  }`}
                  onClick={() => setMenuOpen(false)}
                  role="menuitem"
                  aria-current={isActive ? "page" : undefined}
                >
                  {IconComponent && (
                    <IconComponent
                      size={22}
                      className={isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"}
                      aria-hidden="true"
                    />
                  )}
                  <span className="font-medium">{t(label)}</span>
                  {isActive && (
                    <span className="mr-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
